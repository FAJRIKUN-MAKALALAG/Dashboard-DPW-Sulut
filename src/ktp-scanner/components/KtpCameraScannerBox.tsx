import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  X,
  ScanLine,
  Image as ImageIcon,
} from 'lucide-react';
import { KTP_SCANNER_CONFIG } from '../ktpScannerConfig';
import {
  KtpImageQualityReport,
  ExtractedKtpData,
  scanAndExtractKtpOnDevice,
} from '../ktpScannerService';
import {
  KtpStandardizationGuide,
  KtpScannedPreviewCard,
} from './KtpStandardizationGuide';
import { KtpLiveCameraViewport } from './KtpLiveCameraViewport';

export interface KtpCameraScannerBoxProps {
  fotoKtpUrl: string;
  qualityReport: KtpImageQualityReport | null;
  extractedData: ExtractedKtpData | null;
  onScanComplete: (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => void;
  onClearKtp: () => void;
  onProceedNext: () => void;
}

export const KtpCameraScannerBox: React.FC<KtpCameraScannerBoxProps> = ({
  fotoKtpUrl,
  qualityReport,
  extractedData,
  onScanComplete,
  onClearKtp,
  onProceedNext,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [torchNotice, setTorchNotice] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const guideFrameRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
        } catch {}
        track.stop();
      });
      streamRef.current = null;
    }
    setIsTorchOn(false);
    setIsTorchSupported(false);
    setTorchNotice(null);
    setIsCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startCameraStream = async (preferredFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      nativeCameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (
          typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {}
        ) as any;

        const hasTorch = Boolean(capabilities && 'torch' in capabilities);
        setIsTorchSupported(hasTorch);

        const advancedConstraints: any[] = [];
        if (Array.isArray(capabilities?.focusMode) && capabilities.focusMode.includes('continuous')) {
          advancedConstraints.push({ focusMode: 'continuous' });
        }
        if (advancedConstraints.length > 0) {
          videoTrack.applyConstraints({ advanced: advancedConstraints }).catch(() => {});
        }
      }

      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err: any) {
      console.warn('Gagal membuka live kamera:', err);
      setCameraError(
        'Kamera langsung tidak dapat diakses (pastikan izin kamera diberikan). Anda tetap dapat memilih foto KTP dari galeri atau membuka kamera perangkat.'
      );
    }
  };

  const handleToggleTorch = async () => {
    setTorchNotice(null);
    const stream = streamRef.current;
    const videoTrack = stream?.getVideoTracks()?.[0];
    if (!videoTrack) return;

    const nextTorch = !isTorchOn;
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setIsTorchOn(nextTorch);
      setIsTorchSupported(true);
    } catch {
      setIsTorchOn(false);
      setTorchNotice(
        'Kamera perangkat/browser ini belum mendukung kontrol lampu senter (Flash LED) langsung.'
      );
      setTimeout(() => {
        setTorchNotice(null);
      }, 3500);
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraOpen) {
      startCameraStream(nextMode);
    }
  };

  const processKtpSource = async (source: string | File) => {
    setIsProcessingOcr(true);
    setOcrProgress(5);
    setOcrStatusText('Mempersiapkan pemindaian e-KTP...');
    try {
      const result = await scanAndExtractKtpOnDevice(source, (pct, label) => {
        setOcrProgress(pct);
        setOcrStatusText(label);
      });
      onScanComplete({
        fotoKtpUrl: result.standardizedKtpDataUrl,
        croppedFaceDataUrl: result.croppedFaceDataUrl,
        quality: result.quality,
        extracted: result.extracted,
      });
    } catch (err) {
      console.error('Gagal memproses e-KTP:', err);
      setCameraError('Terjadi kendala saat memproses gambar KTP. Silakan coba foto ulang.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleCaptureFromLiveCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    let startX = 0;
    let startY = 0;
    let cropW = vw;
    let cropH = vh;

    const videoRect = video.getBoundingClientRect();
    const guideRect = guideFrameRef.current?.getBoundingClientRect();

    if (guideRect && videoRect.width > 0 && videoRect.height > 0) {
      const scale = Math.max(vw / videoRect.width, vh / videoRect.height);
      const renderedW = videoRect.width * scale;
      const renderedH = videoRect.height * scale;
      const offsetX = (vw - renderedW) / 2;
      const offsetY = (vh - renderedH) / 2;

      const relX = guideRect.left - videoRect.left;
      const relY = guideRect.top - videoRect.top;

      startX = Math.max(0, offsetX + relX * scale);
      startY = Math.max(0, offsetY + relY * scale);
      cropW = Math.min(vw - startX, guideRect.width * scale);
      cropH = Math.min(vh - startY, guideRect.height * scale);
    } else {
      const targetAspect = KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
      cropW = vw * 0.88;
      cropH = cropW / targetAspect;
      if (cropH > vh * 0.82) {
        cropH = vh * 0.82;
        cropW = cropH * targetAspect;
      }
      startX = (vw - cropW) / 2;
      startY = (vh - cropH) / 2;
    }

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = KTP_SCANNER_CONFIG.TARGET_WIDTH;
    captureCanvas.height = KTP_SCANNER_CONFIG.TARGET_HEIGHT;
    const ctx = captureCanvas.getContext('2d')!;
    ctx.drawImage(
      video,
      startX,
      startY,
      cropW,
      cropH,
      0,
      0,
      KTP_SCANNER_CONFIG.TARGET_WIDTH,
      KTP_SCANNER_CONFIG.TARGET_HEIGHT
    );

    const capturedDataUrl = captureCanvas.toDataURL('image/jpeg', 0.94);
    stopCameraStream();
    processKtpSource(capturedDataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processKtpSource(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processKtpSource(file);
    }
  };

  return (
    <div className="space-y-3.5">
      <KtpStandardizationGuide />

      {cameraError && (
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCameraError(null)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isCameraOpen && (
        <KtpLiveCameraViewport
          videoRef={videoRef}
          guideFrameRef={guideFrameRef}
          isTorchOn={isTorchOn}
          isTorchSupported={isTorchSupported}
          torchNotice={torchNotice}
          onToggleTorch={handleToggleTorch}
          onStopCamera={stopCameraStream}
          onCapture={handleCaptureFromLiveCamera}
          onToggleFacingMode={handleToggleFacingMode}
        />
      )}

      {isProcessingOcr && (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto">
            <ScanLine className="w-5 h-5 text-[#1A3282] dark:text-slate-200 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Memindai & Mengekstrak Data e-KTP ({ocrProgress}%)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ocrStatusText}</p>
          </div>
          <div className="w-full max-w-md mx-auto h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#1A3282] dark:bg-slate-300 transition-all duration-200 rounded-full"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
        </div>
      )}

      {!isCameraOpen && !isProcessingOcr && !fotoKtpUrl && (
        <>
          <div className="md:hidden p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-[#1A3282] dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Scan e-KTP Calon Anggota
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data NIK, nama, TTL & alamat akan terisi otomatis ke formulir.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => startCameraStream('environment')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera & Scan e-KTP</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-white w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Pilih Foto e-KTP dari Galeri</span>
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`hidden md:block p-6 lg:p-8 rounded-xl border border-dashed transition-all text-center space-y-4 ${
              isDragging
                ? 'border-[#1A3282] bg-slate-100/70 dark:bg-slate-900'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto shadow-2xs">
              <Camera className="w-6 h-6 text-[#1A3282] dark:text-slate-200" />
            </div>

            <div className="max-w-lg mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Pindai e-KTP dengan Kamera atau Unggah Berkas Foto e-KTP
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tarik dan lepaskan file foto e-KTP ke area ini, pilih berkas dari perangkat Anda, atau gunakan kamera perangkat untuk memotret e-KTP secara langsung.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Berkas Foto e-KTP</span>
              </button>

              <button
                type="button"
                onClick={() => startCameraStream('environment')}
                className="btn-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Buka Kamera Perangkat</span>
              </button>
            </div>
          </div>
        </>
      )}

      {!isCameraOpen && !isProcessingOcr && fotoKtpUrl && (
        <KtpScannedPreviewCard
          fotoKtpUrl={fotoKtpUrl}
          qualityReport={qualityReport}
          extractedData={extractedData}
          onRetakeCamera={() => startCameraStream('environment')}
          onReplaceFileClick={() => fileInputRef.current?.click()}
          onClearKtp={onClearKtp}
          onProceedNext={onProceedNext}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

