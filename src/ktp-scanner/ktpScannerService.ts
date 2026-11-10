import { apiFetch } from '../services/http';
import { KTP_SCANNER_CONFIG } from './ktpScannerConfig';
import {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  SULUT_NIK_PREFIX_TO_DPD,
} from './nikDecoder';
import {
  ExtractedKtpData,
  mergeExtractedKtpData,
  parseKtpOcrText,
  toCleanTitleCase,
} from './ktpTextParser';
import {
  KtpImageQualityReport,
  standardizeAndPreprocessKtpImage,
} from './ktpImageProcessor';

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
 * Menjalankan pipeline penuh pemindaian e-KTP:
 * 1. Standarisasi orientasi & kualitas gambar e-KTP.
 * 2. Mengirim ke Mesin Utama: Backend Deep Learning RapidOCR (PP-OCRv4 ONNX) + Spatial Coordinate Parser (`/api/ktp-scanner/scan`).
 * 3. Mencocokkan wilayah Kab/Kota, Kecamatan & Kelurahan dengan master wilayah Sulawesi Utara (`SULUT_REGIONS`).
 * 4. Jika koneksi backend terputus, otomatis fallback ke Zonal OCR di perangkat.
 */
export async function scanAndExtractKtpOnDevice(
  imageSource: string | File,
  onProgress?: (progressPct: number, statusLabel: string) => void
): Promise<KtpScanPipelineResult> {
  onProgress?.(15, 'Menstandarkan orientasi & ketajaman citra e-KTP...');
  const {
    standardizedKtpDataUrl,
    ocrEnhancedDataUrl,
    nikZoneDataUrl,
    biodataZoneDataUrl,
    croppedFaceDataUrl,
    quality,
  } = await standardizeAndPreprocessKtpImage(imageSource);

  // 1. Prioritas Utama: Mesin Deep Learning RapidOCR (PP-OCRv4 ONNX) di Server Backend
  try {
    onProgress?.(45, 'Membaca NIK & Biodata dengan Deep Learning OCR (PP-OCRv4)...');
    const backendRes = await apiFetch<any>(KTP_SCANNER_CONFIG.BACKEND_SCAN_ENDPOINT, {
      method: 'POST',
      body: { image: standardizedKtpDataUrl },
    });

    if (backendRes && backendRes.success && backendRes.extracted) {
      onProgress?.(90, 'Mencocokkan data KTP dengan master wilayah Sulawesi Utara...');
      const srvExt = backendRes.extracted as ExtractedKtpData;
      const territoryMatch = matchSulutTerritoryFromKtp(
        srvExt.kabKota || '',
        srvExt.kecamatan || '',
        srvExt.kelDesa || '',
        srvExt.nik || ''
      );

      const finalKelDesa = territoryMatch.matchedDprt || srvExt.kelDesa || '';
      const finalKecamatan = territoryMatch.matchedDpc || srvExt.kecamatan || '';
      const finalKabKota = territoryMatch.matchedDpd || srvExt.kabKota || '';

      const enriched: ExtractedKtpData = {
        ...srvExt,
        kelDesa: finalKelDesa,
        kecamatan: finalKecamatan,
        kabKota: finalKabKota,
        matchedDpd: territoryMatch.matchedDpd,
        matchedDpc: territoryMatch.matchedDpc,
        matchedDprt: territoryMatch.matchedDprt,
        croppedFaceDataUrl: backendRes.croppedFaceDataUrl || croppedFaceDataUrl,
      };

      onProgress?.(100, 'Pemindaian e-KTP selesai!');
      return {
        standardizedKtpDataUrl: backendRes.standardizedKtpDataUrl || standardizedKtpDataUrl,
        croppedFaceDataUrl: backendRes.croppedFaceDataUrl || croppedFaceDataUrl,
        quality: backendRes.quality || quality,
        extracted: enriched,
      };
    }
  } catch (backendErr) {
    console.warn('[KTP-SCANNER] Backend RapidOCR tidak terjangkau, menggunakan fallback OCR lokal:', backendErr);
  }

  // 2. Fallback Offline: Zonal OCR Lokal di Browser
  onProgress?.(50, 'Menjalankan pembacaan cadangan Zonal OCR di perangkat...');
  let nikRawText = '';
  let bioRawText = '';
  let fullCardRawText = '';

  try {
    const Tesseract = await import('tesseract.js');
    let worker: any = null;
    try {
      worker = await Tesseract.createWorker('ind+eng');
    } catch {
      worker = await Tesseract.createWorker('eng');
    }

    try {
      const resNik = await worker.recognize(nikZoneDataUrl);
      nikRawText = resNik?.data?.text || '';

      onProgress?.(72, 'Membaca zona Biodata, Alamat, Kelurahan & Kecamatan...');
      const resBio = await worker.recognize(biodataZoneDataUrl);
      bioRawText = resBio?.data?.text || '';

      const primaryExtracted = parseKtpOcrText(bioRawText, nikRawText);
      if (primaryExtracted.nik.length < 16 || !primaryExtracted.namaLengkap) {
        onProgress?.(86, 'Memvalidasi ulang detail huruf pada kartu utuh...');
        const resFull = await worker.recognize(ocrEnhancedDataUrl);
        fullCardRawText = resFull?.data?.text || '';
      }
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    console.warn('Gagal menjalankan fallback OCR lokal:', err);
  }

  onProgress?.(95, 'Mencocokkan data KTP dengan master wilayah Sulawesi Utara...');
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

