import { apiFetch } from './http';
import { TerritoryContext, ParsedTerritoryRow } from '../utils/territorialExcelTemplateUtils';
import { isJobTitleMatch, normalizeSubOrgName } from '../utils/jobMatchingUtils';
import { getStructureTemplate } from '../data/structureTemplates';

export interface AiCleanedItem {
  no: number;
  subOrg: string;
  jabatan: string;
  canonicalJabatan?: string;
  isMatched: boolean;
  namaLengkap: string;
  gelar?: string;
  nik: string;
  jenisKelamin?: string;
  nomorHP?: string;
  email?: string;
  clusterGroup?: 'WANKAR' | 'WANGAN' | 'PIMPINAN' | string;
  aiCorrection?: string;
}

export interface AiCleaningResult {
  success: boolean;
  items: AiCleanedItem[];
  stats: {
    total: number;
    pertimbanganCount: number;
    pakarCount: number;
    pimpinanCount: number;
    matchedCount: number;
    correctedCount: number;
  };
  message?: string;
  isFallback?: boolean;
}

export interface AiProgressUpdate {
  current: number;
  total: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  currentLabel: string;
}

export type AiProgressCallback = (progress: AiProgressUpdate) => void;

/**
 * Membersihkan dan mengelompokkan data pengurus via Backend AI (`/api/ai/clean`).
 * Jika backend tidak terkonfigurasi Gemini API key atau offline, otomatis fallback ke local normalizer.
 */
export async function cleanDataWithGeminiAi(
  rawRows: ParsedTerritoryRow[],
  ctx: TerritoryContext,
  onProgress?: AiProgressCallback
): Promise<AiCleaningResult> {
  const CHUNK_SIZE = 75; // Ukuran optimal per batch

  if (rawRows.length <= CHUNK_SIZE) {
    if (onProgress) {
      onProgress({
        current: rawRows.length,
        total: rawRows.length,
        percentage: 50,
        currentBatch: 1,
        totalBatches: 1,
        currentLabel: `Memproses ${rawRows.length} pengurus via AI...`,
      });
    }

    const res = await processSingleBatch(rawRows, ctx);

    if (onProgress) {
      onProgress({
        current: rawRows.length,
        total: rawRows.length,
        percentage: 100,
        currentBatch: 1,
        totalBatches: 1,
        currentLabel: `Selesai memproses ${rawRows.length} pengurus!`,
      });
    }

    return res;
  }

  // Multi-batch jika data banyak
  const totalBatches = Math.ceil(rawRows.length / CHUNK_SIZE);
  const allCleanedItems: AiCleanedItem[] = [];

  let totalPertimbangan = 0;
  let totalPakar = 0;
  let totalPimpinan = 0;
  let totalMatched = 0;
  let totalCorrected = 0;

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, rawRows.length);
    const batchRows = rawRows.slice(startIdx, endIdx);

    const percent = Math.round((startIdx / rawRows.length) * 100);
    if (onProgress) {
      onProgress({
        current: startIdx,
        total: rawRows.length,
        percentage: percent,
        currentBatch: b + 1,
        totalBatches,
        currentLabel: `Memproses Batch ${b + 1} dari ${totalBatches}: baris ${startIdx + 1} - ${endIdx} (${batchRows.length} pengurus)...`,
      });
    }

    const batchResult = await processSingleBatch(batchRows, ctx);

    batchResult.items.forEach((item, idx) => {
      allCleanedItems.push({
        ...item,
        no: startIdx + idx + 1,
      });
    });

    totalPertimbangan += batchResult.stats.pertimbanganCount;
    totalPakar += batchResult.stats.pakarCount;
    totalPimpinan += batchResult.stats.pimpinanCount;
    totalMatched += batchResult.stats.matchedCount;
    totalCorrected += batchResult.stats.correctedCount;
  }

  if (onProgress) {
    onProgress({
      current: rawRows.length,
      total: rawRows.length,
      percentage: 100,
      currentBatch: totalBatches,
      totalBatches,
      currentLabel: `Berhasil membersihkan seluruh ${rawRows.length} pengurus!`,
    });
  }

  return {
    success: true,
    items: allCleanedItems,
    stats: {
      total: allCleanedItems.length,
      pertimbanganCount: totalPertimbangan,
      pakarCount: totalPakar,
      pimpinanCount: totalPimpinan,
      matchedCount: totalMatched,
      correctedCount: totalCorrected,
    },
    message: `AI berhasil memproses massal ${allCleanedItems.length} kader pengurus dalam ${totalBatches} batch!`,
    isFallback: false,
  };
}

/**
 * Memproses 1 batch melalui Backend REST API (/api/ai/clean), fallback ke local engine jika gagal.
 */
async function processSingleBatch(
  batchRows: ParsedTerritoryRow[],
  ctx: TerritoryContext
): Promise<AiCleaningResult> {
  try {
    const res = await apiFetch<AiCleaningResult>('/ai/clean', {
      method: 'POST',
      body: {
        rawRows: batchRows.map((r) => ({
          no: r.no,
          subOrg: r.subOrg,
          jabatan: r.jabatanExcel,
          namaLengkap: r.namaLengkap,
          nik: r.nik,
          jenisKelamin: r.jenisKelamin,
          nomorHP: r.nomorHP,
          email: r.email,
        })),
        territoryContext: ctx,
      },
    });

    if (res && res.success && Array.isArray(res.items) && res.items.length > 0) {
      return {
        success: true,
        items: res.items,
        stats: res.stats,
        message: res.message,
        isFallback: false,
      };
    }
  } catch (err) {
    console.warn('Backend AI endpoint call failed or returned error, using local normalizer:', err);
  }

  // Fallback Normalizer Cerdas Lokal
  return fallbackLocalCleaner(batchRows, ctx);
}

/**
 * Fallback Normalizer Cerdas jika koneksi backend AI offline atau key belum diset
 */
function fallbackLocalCleaner(
  rawRows: ParsedTerritoryRow[],
  ctx: TerritoryContext
): AiCleaningResult {
  const slots = getStructureTemplate(ctx.level);
  let pertimbanganCount = 0;
  let pakarCount = 0;
  let pimpinanCount = 0;
  let matchedCount = 0;
  let correctedCount = 0;

  const items: AiCleanedItem[] = rawRows.map((r, idx) => {
    const rawJabatan = (r.jabatanExcel || '').trim();
    const rawSubOrg = (r.subOrg || '').toLowerCase();
    const jabatanLower = rawJabatan.toLowerCase();

    // 1. Clustering Sub-Organisasi
    let clusterGroup: 'WANKAR' | 'WANGAN' | 'PIMPINAN' = 'PIMPINAN';
    let targetSubOrg =
      ctx.level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : ctx.level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : 'III. DEWAN PIMPINAN CABANG';

    let aiCorrection = '';

    if (
      rawSubOrg.includes('pertimbangan') ||
      rawSubOrg.includes('wankar') ||
      jabatanLower.includes('pertimbangan') ||
      jabatanLower.includes('wankar')
    ) {
      clusterGroup = 'WANKAR';
      targetSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      pertimbanganCount++;
      aiCorrection = 'Dipisahkan ke Dewan Pertimbangan';
      correctedCount++;
    } else if (
      rawSubOrg.includes('pakar') ||
      rawSubOrg.includes('wangan') ||
      jabatanLower.includes('pakar') ||
      jabatanLower.includes('wangan')
    ) {
      clusterGroup = 'WANGAN';
      targetSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      pakarCount++;
      aiCorrection = 'Dipisahkan ke Dewan Pakar';
      correctedCount++;
    } else {
      pimpinanCount++;
    }

    // 2. Pencocokan Jabatan ke Slot Baku
    const matchedSlot = slots.find((s) => isJobTitleMatch(rawJabatan, s.jabatan));
    const isMatched = !!matchedSlot;
    const canonicalJabatan = matchedSlot ? matchedSlot.jabatan : rawJabatan;

    if (matchedSlot && matchedSlot.jabatan !== rawJabatan) {
      aiCorrection = aiCorrection
        ? `${aiCorrection} | Jabatan dinormalisasi ke "${canonicalJabatan}"`
        : `Jabatan dinormalisasi ke "${canonicalJabatan}"`;
      correctedCount++;
    }

    if (isMatched) {
      matchedCount++;
    }

    return {
      no: idx + 1,
      subOrg: normalizeSubOrgName(targetSubOrg, ctx.level),
      jabatan: rawJabatan,
      canonicalJabatan,
      isMatched,
      namaLengkap: r.namaLengkap,
      nik: r.nik,
      jenisKelamin: r.jenisKelamin,
      nomorHP: r.nomorHP,
      email: r.email,
      clusterGroup,
      aiCorrection,
    };
  });

  return {
    success: true,
    items,
    stats: {
      total: items.length,
      pertimbanganCount,
      pakarCount,
      pimpinanCount,
      matchedCount,
      correctedCount,
    },
    message: 'Data berhasil dinormalisasi dan dikelompokkan dengan Intelligent Engine!',
    isFallback: true,
  };
}
