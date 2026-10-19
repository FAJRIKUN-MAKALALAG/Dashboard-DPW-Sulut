import { supabase } from '../config/database';
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

const NASDEM_SULUT_TAXONOMY = `
PANDUAN TAKSONOMI RESMI PARTAI NASDEM SULUT:
1. 15 DPD KABUPATEN / KOTA BAKU:
   - Manado, Minahasa, Minahasa Selatan, Minahasa Utara, Minahasa Tenggara,
   - Tomohon, Bitung, Kotamobagu, Bolaang Mongondow, Bolaang Mongondow Utara,
   - Bolaang Mongondow Selatan, Bolaang Mongondow Timur,
   - Kepulauan Sangihe, Kepulauan Talaud, Kepulauan Siau Tagulandang Biaro (Sitaro).

2. SUB-ORGANISASI RESMI:
   - "I. DEWAN PERTIMBANGAN" (atau "DEWAN PERTIMBANGAN WILAYAH" untuk DPW)
   - "II. DEWAN PAKAR" (atau "DEWAN PAKAR WILAYAH" untuk DPW)
   - "III. DEWAN PIMPINAN DAERAH" (atau "DEWAN PIMPINAN WILAYAH" untuk DPW, "DEWAN PIMPINAN CABANG" untuk DPC)

3. 36 JABATAN BAKU STRUKTURAL DEWAN PIMPINAN:
   - Ketua, Sekretaris, Bendahara.
   - Para Wakil Ketua Bidang: Bappilu, OKK, Kaderisasi & Pendidikan Politik, Hubungan Legislatif, Hubungan Eksekutif, Hubungan Sayap & Badan, Penggalangan Komunitas, Pemilih Pemula/Milenial, Digital & Siber, Media & Komunikasi Publik, UMKM, Ekonomi, Agama & Masyarakat Adat, Tenaga Kerja, Kesehatan, Perempuan & Anak, Pendidikan & Kebudayaan, Hukum & HAM, Pariwisata & Industri Kreatif, Pertanian/Peternakan/Desa, Maritim, Pemuda & Olahraga, Lingkungan Hidup, dll.
`;

/**
 * Membersihkan dan mengelompokkan data pengurus menggunakan Gemini Flash AI.
 * Mendukung pemanggilan langsung via Gemini API (dengan VITE_GEMINI_API_KEY)
 * atau via Supabase Edge Function, serta dilengkapi Smart Local Engine sebagai fallback.
 */
export async function cleanDataWithGeminiAi(
  rawRows: ParsedTerritoryRow[],
  ctx: TerritoryContext
): Promise<AiCleaningResult> {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 1. Eksekusi Langsung via Google Gemini Flash API jika VITE_GEMINI_API_KEY terkonfigurasi
  if (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim() !== '') {
    try {
      const directResult = await callDirectGeminiApi(rawRows, ctx, geminiApiKey.trim());
      if (directResult && directResult.success && directResult.items.length > 0) {
        return directResult;
      }
    } catch (directErr) {
      console.warn('Direct Gemini API call failed, trying Edge Function:', directErr);
    }
  }

  // 2. Coba via Supabase Edge Function 'ai-clean-cluster'
  try {
    const { data, error } = await supabase.functions.invoke('ai-clean-cluster', {
      body: {
        rawRows: rawRows.map((r) => ({
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

    if (!error && data && data.success && Array.isArray(data.items) && data.items.length > 0) {
      return {
        success: true,
        items: data.items,
        stats: data.stats,
        message: data.message || 'Data berhasil dibersihkan dan di-cluster dengan Gemini AI!',
        isFallback: false,
      };
    }
  } catch (edgeErr) {
    console.warn('Edge Function invoke failed, switching to local engine:', edgeErr);
  }

  // 3. Fallback Normalizer Cerdas (Rule-Based Clustering Engine)
  return fallbackLocalCleaner(rawRows, ctx);
}

/**
 * Pemanggilan langsung Google Gemini Flash API dari browser
 */
async function callDirectGeminiApi(
  rawRows: ParsedTerritoryRow[],
  ctx: TerritoryContext,
  apiKey: string
): Promise<AiCleaningResult> {
  const systemPrompt = `
Anda adalah AI Spesialis Normalisasi & Clustering Data Kepengurusan Partai NasDem Sulawesi Utara.
Tugas Anda adalah membaca daftar pengurus dan merapikannya sesuai taksonomi resmi:

${NASDEM_SULUT_TAXONOMY}

ATURAN PENTING:
1. PISAHKAN DEWAN:
   - Kata kunci "Pertimbangan" / "Wankar" -> subOrg = "I. DEWAN PERTIMBANGAN", clusterGroup = "WANKAR".
   - Kata kunci "Pakar" / "Wangan" -> subOrg = "II. DEWAN PAKAR", clusterGroup = "WANGAN".
   - Sisanya -> subOrg = "III. DEWAN PIMPINAN DAERAH" (atau tingkat wilayah yang sesuai), clusterGroup = "PIMPINAN".
2. NORMALISASI JABATAN:
   - Petakan singkatan ke nama jabatan resmi baku (misal "Wkl Ketua Bid OKK" -> "Wakil Ketua Bidang Organisasi, Keanggotaan, dan Kaderisasi (OKK)").
   - Cocokkan dengan 36 slot baku, set "isMatched": true jika cocok, false jika jabatan kustom.
3. RAPIKAN NAMA:
   - Format nama pengurus rapi (huruf besar atau title case profesional), pisahkan gelar jika ada.
4. KEMBALIKAN HANYA JSON DENGAN FORMAT:
   {
     "items": [
       {
         "no": 1,
         "subOrg": "I. DEWAN PERTIMBANGAN",
         "jabatan": "Ketua",
         "canonicalJabatan": "Ketua",
         "isMatched": true,
         "namaLengkap": "NAMA LENGKAP",
         "nik": "7105...",
         "clusterGroup": "WANKAR",
         "aiCorrection": "Dipisahkan ke Dewan Pertimbangan"
       }
     ]
   }
`;

  const userPrompt = `
Wilayah: Tingkat ${ctx.level} - ${ctx.dpd}
Data Pengurus:
${JSON.stringify(
  rawRows.map((r) => ({
    no: r.no,
    subOrg: r.subOrg,
    jabatan: r.jabatanExcel,
    namaLengkap: r.namaLengkap,
    nik: r.nik,
  })),
  null,
  2
)}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error: ${errText}`);
  }

  const jsonRes = await res.json();
  const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini API mengembalikan respons kosong.');

  const parsed = JSON.parse(rawText);
  const items: AiCleanedItem[] = parsed.items || parsed.pengurus || (Array.isArray(parsed) ? parsed : []);

  const stats = {
    total: items.length,
    pertimbanganCount: items.filter(
      (i) => (i.subOrg || '').toLowerCase().includes('pertimbangan') || i.clusterGroup === 'WANKAR'
    ).length,
    pakarCount: items.filter(
      (i) => (i.subOrg || '').toLowerCase().includes('pakar') || i.clusterGroup === 'WANGAN'
    ).length,
    pimpinanCount: items.filter(
      (i) => (i.subOrg || '').toLowerCase().includes('pimpinan') || i.clusterGroup === 'PIMPINAN'
    ).length,
    matchedCount: items.filter((i) => i.isMatched).length,
    correctedCount: items.filter((i) => i.aiCorrection).length,
  };

  return {
    success: true,
    items,
    stats,
    message: `Gemini AI berhasil membersihkan dan mengelompokkan ${items.length} kader pengurus!`,
    isFallback: false,
  };
}

/**
 * Fallback Normalizer Cerdas jika koneksi AI offline
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
      jabatanLower.includes('pertimbangan')
    ) {
      clusterGroup = 'WANKAR';
      targetSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      pertimbanganCount++;
      aiCorrection = 'Dipisahkan ke Dewan Pertimbangan';
      correctedCount++;
    } else if (
      rawSubOrg.includes('pakar') ||
      rawSubOrg.includes('wangan') ||
      jabatanLower.includes('pakar')
    ) {
      clusterGroup = 'WANGAN';
      targetSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      pakarCount++;
      aiCorrection = 'Dipisahkan ke Dewan Pakar';
      correctedCount++;
    } else {
      pimpinanCount++;
    }

    // 2. Pencocokan Jabatan ke 36 Slot Baku
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
