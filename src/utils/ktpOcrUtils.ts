import {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  SULUT_NIK_PREFIX_TO_DPD,
} from './ktpOcr/nikDecoder';
import {
  ExtractedKtpData,
  parseKtpOcrText,
  toCleanTitleCase,
} from './ktpOcr/ktpTextParser';
import {
  KtpImageQualityReport,
  standardizeAndPreprocessKtpImage,
} from './ktpOcr/ktpImageProcessor';

export {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  SULUT_NIK_PREFIX_TO_DPD,
  parseKtpOcrText,
  toCleanTitleCase,
  standardizeAndPreprocessKtpImage,
};
export type { ExtractedKtpData, KtpImageQualityReport };

export interface KtpScanPipelineResult {
  standardizedKtpDataUrl: string;
  croppedFaceDataUrl: string;
  quality: KtpImageQualityReport;
  extracted: ExtractedKtpData;
}

/**
 * Menjalankan pipeline penuh pemindaian e-KTP secara On-Device (Client-Side WebAssembly):
 * 1. Standarisasi ukuran, orientasi, & evaluasi kualitas gambar KTP.
 * 2. Menjalankan pengenalan teks (OCR) langsung di perangkat tanpa batasan kuota/limit API.
 * 3. Menggabungkan hasil OCR dengan dekoder 16-digit NIK & pemetaan wilayah Sulut.
 */
export async function scanAndExtractKtpOnDevice(
  imageSource: string | File,
  onProgress?: (progressPct: number, statusLabel: string) => void
): Promise<KtpScanPipelineResult> {
  onProgress?.(10, 'Menstandarkan orientasi & ketajaman citra e-KTP...');
  const { standardizedKtpDataUrl, ocrEnhancedDataUrl, croppedFaceDataUrl, quality } =
    await standardizeAndPreprocessKtpImage(imageSource);

  onProgress?.(25, 'Memuat mesin pembaca e-KTP On-Device...');
  let rawTextCombined = '';

  try {
    const Tesseract = await import('tesseract.js');
    const resEnhanced = await Tesseract.recognize(ocrEnhancedDataUrl, 'ind+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = Math.round(30 + m.progress * 55);
          onProgress?.(pct, 'Membaca NIK, Nama, TTL & Alamat dari e-KTP...');
        }
      },
    });
    rawTextCombined = resEnhanced?.data?.text || '';

    const firstPass = parseKtpOcrText(rawTextCombined);
    if (firstPass.nik.length < 16 || !firstPass.namaLengkap) {
      onProgress?.(88, 'Memvalidasi ulang detail huruf pada citra asli...');
      const resColor = await Tesseract.recognize(standardizedKtpDataUrl, 'ind+eng');
      rawTextCombined = `${rawTextCombined}\n${resColor?.data?.text || ''}`;
    }
  } catch (err) {
    console.warn('Tesseract ind+eng fallback ke eng:', err);
    try {
      const Tesseract = await import('tesseract.js');
      const resFallback = await Tesseract.recognize(ocrEnhancedDataUrl, 'eng');
      rawTextCombined = resFallback?.data?.text || '';
    } catch (innerErr) {
      console.warn('Gagal menjalankan OCR lokal:', innerErr);
    }
  }

  onProgress?.(95, 'Mencocokkan data KTP dengan wilayah DPW/DPD/DPC/DPRt Sulut...');
  const extracted = parseKtpOcrText(rawTextCombined);
  extracted.croppedFaceDataUrl = croppedFaceDataUrl;

  onProgress?.(100, 'Pemindaian e-KTP selesai!');
  return {
    standardizedKtpDataUrl,
    croppedFaceDataUrl,
    quality,
    extracted,
  };
}
