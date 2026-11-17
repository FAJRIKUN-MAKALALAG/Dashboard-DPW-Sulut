import React, { useEffect, useRef, useState, useCallback } from 'react';
import { compressImageFileToDataUri } from './inventoryService';
import { Camera, RefreshCw, Check, X, Upload, Smartphone } from 'lucide-react';

interface InventoryCameraModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onCapture: (dataUri: string) => void;
}

export const InventoryCameraModal: React.FC<InventoryCameraModalProps> = ({
  isOpen,
  title = 'Ambil Foto Barang Inventaris',
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedDataUri, setCapturedDataUri] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraStream = useCallback(
    async (mode: 'environment' | 'user') => {
      stopCameraStream();
      setCameraError('');
      setIsStarting(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser pada perangkat ini tidak mendukung akses kamera langsung. Gunakan tombol Kamera HP atau Galeri di bawah.'
        );
        setIsStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
          }
        } catch {
          setCameraError(
            'Izin kamera belum diberikan atau perangkat tidak memiliki kamera aktif. Anda tetap bisa memotret via Kamera HP atau pilih dari Galeri.'
          );
        }
      } finally {
        setIsStarting(false);
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUri('');
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode, startCameraStream, stopCameraStream]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const maxDim = 1000;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (Math.max(width, height) > maxDim) {
      if (width > height) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(video, 0, 0, width, height);

    const dataUri = canvas.toDataURL('image/webp', 0.84);
    setCapturedDataUri(dataUri);
    stopCameraStream();
  };

  const handleRetake = () => {
    setCapturedDataUri('');
    startCameraStream(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (!capturedDataUri) return;
    onCapture(capturedDataUri);
    onClose();
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUri(file, 1000, 0.82);
      onCapture(compressed);
      onClose();
    } catch {
      setCameraError('Gagal memproses berkas foto. Pastikan format gambar valid.');
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] w-[100vw] max-w-[100vw] min-h-[100vh] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-[3%] sm:p-[2%] animate-backdrop-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[100%] sm:w-[92%] md:w-[75%] lg:w-[52%] max-w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 rounded-[16px] overflow-hidden shadow-2xl animate-modal-pop"
      >
        {/* Header */}
        <div className="w-[100%] px-[4%] py-[0.85rem] border-b-[1px] border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-[0.5rem] min-w-0">
            <Camera className="w-[1.1rem] h-[1.1rem] text-[#1A3282] dark:text-blue-400 shrink-0" />
            <h3 className="text-[0.9375rem] font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.75rem] p-[0.45em] rounded-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-[1.1rem] h-[1.1rem]" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="w-[100%] p-[4%] space-y-[0.875rem]">
          <div className="relative w-[100%] aspect-[4/3] rounded-[12px] border-[1px] border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
            {capturedDataUri ? (
              <img
                src={capturedDataUri}
                alt="Hasil Foto Barang"
                className="w-[100%] h-[100%] object-contain bg-slate-950"
              />
            ) : cameraError ? (
              <div className="w-[88%] text-center space-y-[0.75rem] text-slate-300">
                <Camera className="w-[2.25rem] h-[2.25rem] mx-auto text-slate-500" />
                <p className="text-[0.75rem] leading-relaxed">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-[100%] h-[100%] object-cover"
                />
                {/* Viewfinder Frame Overlay */}
                <div className="pointer-events-none absolute inset-[6%] border-[1px] border-dashed border-white/40 rounded-[10px]" />
                {isStarting && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-[0.75rem] font-medium">
                    Membuka kamera...
                  </div>
                )}
              </>
            )}

            {/* Switch Front/Back Camera Button */}
            {!capturedDataUri && !cameraError && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Putar Kamera Depan / Belakang"
                className="absolute top-[3%] right-[3%] text-[0.75rem] px-[0.85em] py-[0.5em] rounded-[10px] bg-slate-900/80 hover:bg-slate-900 text-white border-[1px] border-white/20 flex items-center gap-[0.35rem] cursor-pointer"
              >
                <RefreshCw className="w-[0.875rem] h-[0.875rem]" />
                <span>Putar Kamera</span>
              </button>
            )}
          </div>

          {/* Hidden Inputs for Native Mobile Camera & File Gallery */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Action Controls */}
          {capturedDataUri ? (
            <div className="w-[100%] flex flex-wrap items-center justify-between gap-[2%]">
              <button
                type="button"
                onClick={handleRetake}
                className="w-[48%] text-[0.8125rem] font-semibold px-[1em] py-[0.65em] rounded-[12px] border-[1px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-[0.4rem] cursor-pointer"
              >
                <RefreshCw className="w-[0.95rem] h-[0.95rem]" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="w-[48%] text-[0.8125rem] font-semibold px-[1em] py-[0.65em] rounded-[12px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white flex items-center justify-center gap-[0.4rem] cursor-pointer"
              >
                <Check className="w-[0.95rem] h-[0.95rem]" />
                <span>Gunakan Foto</span>
              </button>
            </div>
          ) : (
            <div className="w-[100%] space-y-[0.5rem]">
              {!cameraError && (
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="w-[100%] text-[0.875rem] font-bold px-[1.2em] py-[0.7em] rounded-[12px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white flex items-center justify-center gap-[0.5rem] cursor-pointer shadow-2xs"
                >
                  <Camera className="w-[1rem] h-[1rem]" />
                  <span>Ambil Foto Sekarang</span>
                </button>
              )}

              <div className="w-[100%] flex flex-wrap items-center justify-between gap-[2%]">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-[48.5%] text-[0.75rem] font-semibold px-[0.9em] py-[0.6em] rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center gap-[0.35rem] cursor-pointer"
                >
                  <Smartphone className="w-[0.875rem] h-[0.875rem] text-slate-500" />
                  <span>Kamera HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-[48.5%] text-[0.75rem] font-semibold px-[0.9em] py-[0.6em] rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center gap-[0.35rem] cursor-pointer"
                >
                  <Upload className="w-[0.875rem] h-[0.875rem] text-slate-500" />
                  <span>Pilih File / Galeri</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
