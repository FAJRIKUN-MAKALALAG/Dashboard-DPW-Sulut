import React, { useState, useRef } from 'react';
import { Upload, Camera, Crop, ScanLine } from 'lucide-react';
import { compressImageFile, resolveImageUrl } from '../../utils/imageUtils';
import {
  KtpCameraScannerBox,
  ExtractedKtpData,
  KtpImageQualityReport,
  scanAndExtractKtpOnDevice,
} from '../../ktp-scanner';
import { ImageCropperModal, ImageCropResult } from '../../components/ui/ImageCropperModal';

interface DppEktaDocumentsSectionProps {
  fotoKtpUrl: string;
  setFotoKtpUrl: (v: string) => void;
  fotoProfilUrl: string;
  setFotoProfilUrl?: (v: string) => void;
  showKtpScanner: boolean;
  setShowKtpScanner: React.Dispatch<React.SetStateAction<boolean>>;
  ktpQuality: KtpImageQualityReport | null;
  extractedData: ExtractedKtpData | null;
  onScanComplete: (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>, target: 'ktp' | 'profil') => void;
}

export const DppEktaDocumentsSection: React.FC<DppEktaDocumentsSectionProps> = ({
  fotoKtpUrl,
  setFotoKtpUrl,
  fotoProfilUrl,
  setFotoProfilUrl,
  showKtpScanner,
  setShowKtpScanner,
  ktpQuality,
  extractedData,
  onScanComplete,
  onUploadFile,
}) => {
  const [ktpCropSource, setKtpCropSource] = useState<string | File | null>(null);
  const [profileCropSource, setProfileCropSource] = useState<string | File | null>(null);
  const [isRunningCropOcr, setIsRunningCropOcr] = useState<boolean>(false);
  const [cropOcrLabel, setCropOcrLabel] = useState<string>('');
  const lastRawKtpRef = useRef<string | File | null>(null);
  const lastRawProfileRef = useRef<string | File | null>(null);

  const handleSelectKtp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    lastRawKtpRef.current = file;
    setKtpCropSource(file);
    e.target.value = '';
  };

  const handleSelectProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (setFotoProfilUrl) {
      lastRawProfileRef.current = file;
      setProfileCropSource(file);
      e.target.value = '';
    } else {
      onUploadFile(e, 'profil');
    }
  };

  const handleSkipKtpCrop = async () => {
    const src = ktpCropSource;
    setKtpCropSource(null);
    if (!src) return;
    if (typeof src === 'string') {
      setFotoKtpUrl(src);
    } else {
      try {
        setFotoKtpUrl(await compressImageFile(src, 1400, 1000, 0.88));
      } catch {
        /* ignore */
      }
    }
  };

  const handleSkipProfileCrop = async () => {
    const src = profileCropSource;
    setProfileCropSource(null);
    if (!src || !setFotoProfilUrl) return;
    if (typeof src === 'string') {
      setFotoProfilUrl(src);
    } else {
      try {
        setFotoProfilUrl(await compressImageFile(src, 600, 600, 0.85));
      } catch {
        /* ignore */
      }
    }
  };

  const handleConfirmKtpCrop = async (res: ImageCropResult) => {
    setKtpCropSource(null);
    setFotoKtpUrl(res.croppedDataUrl);
    if (!fotoProfilUrl && res.croppedFaceDataUrl && setFotoProfilUrl) {
      setFotoProfilUrl(res.croppedFaceDataUrl);
    }
    if (res.triggerOcr) {
      setIsRunningCropOcr(true);
      setCropOcrLabel('Membaca NIK & Biodata dari hasil crop e-KTP...');
      try {
        const scanResult = await scanAndExtractKtpOnDevice(res.croppedDataUrl, (_pct, label) =>
          setCropOcrLabel(label)
        );
        onScanComplete({
          fotoKtpUrl: scanResult.standardizedKtpDataUrl || res.croppedDataUrl,
          croppedFaceDataUrl: scanResult.croppedFaceDataUrl || res.croppedFaceDataUrl,
          quality: scanResult.quality,
          extracted: scanResult.extracted,
        });
      } catch {
        /* tetap simpan hasil crop */
      } finally {
        setIsRunningCropOcr(false);
        setCropOcrLabel('');
      }
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            1. Dokumen Foto e-KTP &amp; Pasfoto Profil (Format JPEG/PNG)
          </h4>
          <p className="text-[11px] text-slate-500">
            Foto e-KTP &amp; Pasfoto Profil dapat diperbesar dan dipotong (crop) agar rapi saat dicetak ke kartu e-KTA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowKtpScanner((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-[#1A3282] text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{showKtpScanner ? 'Tutup Kamera Scanner' : 'Scan e-KTP Otomatis'}</span>
        </button>
      </div>

      {showKtpScanner && (
        <div className="pt-2">
          <KtpCameraScannerBox
            fotoKtpUrl={fotoKtpUrl}
            qualityReport={ktpQuality}
            extractedData={extractedData}
            onScanComplete={onScanComplete}
            onClearKtp={() => setFotoKtpUrl('')}
            onProceedNext={() => setShowKtpScanner(false)}
          />
        </div>
      )}

      {isRunningCropOcr && (
        <div className="p-3 rounded-xl bg-[#1A3282]/10 dark:bg-slate-900 border border-[#1A3282]/30 dark:border-slate-700 flex items-center gap-2.5 text-xs font-semibold text-[#1A3282] dark:text-amber-300">
          <ScanLine className="w-4 h-4 animate-pulse shrink-0" />
          <span>{cropOcrLabel || 'Mengekstrak data NIK & Biodata dari hasil crop e-KTP...'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Foto KTP Card */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div
            onClick={() => fotoKtpUrl && setKtpCropSource(lastRawKtpRef.current || fotoKtpUrl)}
            title={fotoKtpUrl ? 'Klik untuk potong / crop foto KTP' : undefined}
            className={`w-22 h-15 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 ${
              fotoKtpUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#1A3282]' : ''
            }`}
          >
            {resolveImageUrl(fotoKtpUrl) ? (
              <img src={resolveImageUrl(fotoKtpUrl)} alt="KTP" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">Foto KTP</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Berkas Foto e-KTP</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>{fotoKtpUrl ? 'Ganti Foto KTP' : 'Pilih Foto KTP'}</span>
                <input type="file" accept="image/*" onChange={handleSelectKtp} className="hidden" />
              </label>
              {fotoKtpUrl && (
                <button
                  type="button"
                  onClick={() => setKtpCropSource(lastRawKtpRef.current || fotoKtpUrl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A3282] hover:bg-[#21409A] text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Crop className="w-3 h-3 text-amber-300" />
                  <span>Potong / Crop</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pasfoto Profil Card */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div
            onClick={() =>
              fotoProfilUrl && setFotoProfilUrl && setProfileCropSource(lastRawProfileRef.current || fotoProfilUrl)
            }
            title={fotoProfilUrl ? 'Klik untuk potong / crop pasfoto profil' : undefined}
            className={`w-14 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 ${
              fotoProfilUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#1A3282]' : ''
            }`}
          >
            {resolveImageUrl(fotoProfilUrl) ? (
              <img src={resolveImageUrl(fotoProfilUrl)} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">Pasfoto</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Pasfoto Profil Kader</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>{fotoProfilUrl ? 'Ganti Foto Profil' : 'Pilih Foto Profil'}</span>
                <input type="file" accept="image/*" onChange={handleSelectProfile} className="hidden" />
              </label>
              {fotoProfilUrl && setFotoProfilUrl && (
                <button
                  type="button"
                  onClick={() => setProfileCropSource(lastRawProfileRef.current || fotoProfilUrl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A3282] hover:bg-[#21409A] text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Crop className="w-3 h-3 text-amber-300" />
                  <span>Potong / Crop</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crop KTP */}
      <ImageCropperModal
        mode="ktp"
        isOpen={Boolean(ktpCropSource)}
        imageSource={ktpCropSource}
        primaryButtonText="Simpan Hasil Crop KTP"
        showOcrButton={true}
        showSkipCropButton={true}
        onConfirmCrop={handleConfirmKtpCrop}
        onSkipCrop={handleSkipKtpCrop}
        onCancel={() => setKtpCropSource(null)}
      />

      {/* Modal Crop Pasfoto Profil */}
      <ImageCropperModal
        mode="profile"
        isOpen={Boolean(profileCropSource)}
        imageSource={profileCropSource}
        primaryButtonText="Simpan Pasfoto Profil"
        showSkipCropButton={true}
        onConfirmCrop={(res) => {
          setProfileCropSource(null);
          setFotoProfilUrl?.(res.croppedDataUrl);
        }}
        onSkipCrop={handleSkipProfileCrop}
        onCancel={() => setProfileCropSource(null)}
      />
    </div>
  );
};
