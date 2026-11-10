import {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  SULUT_NIK_PREFIX_TO_DPD,
} from './ktpOcr/nikDecoder';
import {
  ExtractedKtpData,
  mergeExtractedKtpData,
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
 * Menjalankan pipeline penuh pemindaian e-KTP Berbasis Zona (Zonal OCR) secara On-Device:
 * 1. Standarisasi ukuran, penghapusan latar cyan e-KTP, Adaptive Thresholding & Masking Pasfoto.
 * 2. Zonal Pass 1: Membaca potongan khusus baris 16-digit NIK yang diperbesar.
 * 3. Zonal Pass 2: Membaca blok teks Biodata kiri-tengah (Nama, TTL, Alamat, Kel/Desa, Kecamatan, Agama, Pekerjaan).
 * 4. Validasi silang dengan dekoder 16-digit NIK & Fuzzy Matching wilayah Sulut.
 */
export async function scanAndExtractKtpOnDevice(
  imageSource: string | File,
  onProgress?: (progressPct: number, statusLabel: string) => void
): Promise<KtpScanPipelineResult> {
  onProgress?.(10, 'Menghapus corak latar biru & menajamkan teks e-KTP...');
  const {
    standardizedKtpDataUrl,
    ocrEnhancedDataUrl,
    nikZoneDataUrl,
    biodataZoneDataUrl,
    croppedFaceDataUrl,
    quality,
  } = await standardizeAndPreprocessKtpImage(imageSource);

  onProgress?.(22, 'Memuat mesin Zonal OCR e-KTP On-Device...');
  let nikRawText = '';
  let bioRawText = '';
  let fullCardRawText = '';

  try {
    const Tesseract = await import('tesseract.js');

    let worker: any = null;
    try {
      worker = await Tesseract.createWorker('ind+eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.min(88, Math.round(35 + m.progress * 45));
            onProgress?.(pct, 'Membaca zona NIK, Nama, TTL & Alamat e-KTP...');
          }
        },
      });
    } catch {
      worker = await Tesseract.createWorker('eng');
    }

    try {
      // Zona 1: Fokus khusus baris 16-Digit NIK di bagian atas kartu
      onProgress?.(32, 'Membaca zona 16 digit NIK e-KTP...');
      const resNik = await worker.recognize(nikZoneDataUrl);
      nikRawText = resNik?.data?.text || '';

      // Zona 2: Fokus blok teks Biodata (tanpa gangguan pasfoto & tanda tangan)
      onProgress?.(55, 'Membaca zona Biodata, Alamat, Kelurahan & Kecamatan...');
      const resBio = await worker.recognize(biodataZoneDataUrl);
      bioRawText = resBio?.data?.text || '';

      const primaryExtracted = parseKtpOcrText(bioRawText, nikRawText);

      // Zona 3 (Fallback): Jika NIK belum 16 digit atau Nama/Alamat masih kurang lengkap, baca kartu penuh
      if (
        primaryExtracted.nik.length < 16 ||
        !primaryExtracted.namaLengkap ||
        (!primaryExtracted.kelDesa && !primaryExtracted.kecamatan)
      ) {
        onProgress?.(82, 'Memvalidasi ulang detail huruf pada kartu utuh...');
        const resFull = await worker.recognize(ocrEnhancedDataUrl);
        fullCardRawText = resFull?.data?.text || '';
      }
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    console.warn('Gagal menjalankan worker OCR, mencoba recognize standar:', err);
    try {
      const Tesseract = await import('tesseract.js');
      const resFallback = await Tesseract.recognize(biodataZoneDataUrl, 'eng');
      bioRawText = resFallback?.data?.text || '';
    } catch (innerErr) {
      console.warn('Gagal menjalankan OCR lokal:', innerErr);
    }
  }

  onProgress?.(94, 'Mencocokkan data KTP dengan master wilayah Sulawesi Utara...');
  let extracted = parseKtpOcrText(`${nikRawText}\n${bioRawText}`, nikRawText);

  if (fullCardRawText) {
    const secondary = parseKtpOcrText(fullCardRawText, nikRawText);
    extracted = mergeExtractedKtpData(extracted, secondary);
  }

  extracted.croppedFaceDataUrl = croppedFaceDataUrl;

  onProgress?.(100, 'Pemindaian e-KTP selesai!');
  return {
    standardizedKtpDataUrl,
    croppedFaceDataUrl,
    quality,
    extracted,
  };
}
