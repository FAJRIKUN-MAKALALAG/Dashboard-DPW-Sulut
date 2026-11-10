import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../structureReadinessUtils';

/**
 * Peta Kode BPS/Dukcapil 4 Digit Awal NIK Sulawesi Utara (Provinsi 71)
 */
export const SULUT_NIK_PREFIX_TO_DPD: Record<string, string> = {
  '7101': 'Kabupaten Bolaang Mongondow',
  '7102': 'Kabupaten Minahasa',
  '7103': 'Kabupaten Kepulauan Sangihe',
  '7104': 'Kabupaten Kepulauan Talaud',
  '7105': 'Kabupaten Minahasa Selatan',
  '7106': 'Kabupaten Minahasa Utara',
  '7107': 'Kabupaten Minahasa Tenggara',
  '7108': 'Kabupaten Bolaang Mongondow Utara',
  '7109': 'Kabupaten Kepulauan Siau Tagulandang Biaro',
  '7110': 'Kabupaten Bolaang Mongondow Timur',
  '7111': 'Kabupaten Bolaang Mongondow Selatan',
  '7171': 'Kota Manado',
  '7172': 'Kota Bitung',
  '7173': 'Kota Tomohon',
  '7174': 'Kota Kotamobagu',
};

/**
 * Menghitung kemiripan dua string (0.0 - 1.0) berbasis Levenshtein Distance
 * untuk mengoreksi salah baca 1-2 huruf oleh OCR pada nama Kecamatan/Kelurahan/Pekerjaan.
 */
export function stringSimilarity(a: string, b: string): number {
  const s1 = (a || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const s2 = (b || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;

  const dp: number[] = Array.from({ length: len2 + 1 }, (_, i) => i);
  for (let i = 1; i <= len1; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= len2; j++) {
      const temp = dp[j];
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }

  return 1 - dp[len2] / maxLen;
}

/**
 * Mendekode informasi pasti dari 16 digit NIK KTP Indonesia:
 * - Digit 1-4: Kode Provinsi & Kabupaten/Kota
 * - Digit 7-12: DDMMYY (Jika perempuan, DD ditambah 40)
 */
export function decodeIndonesianNik(rawNik: string): {
  isValidFormat: boolean;
  dpdName?: string;
  tempatLahirSuggestion?: string;
  tanggalLahir?: string;
  jenisKelamin?: 'Laki-laki' | 'Perempuan';
} {
  const clean = (rawNik || '').replace(/[^0-9]/g, '');
  if (clean.length !== 16) {
    return { isValidFormat: false };
  }

  const kabCode = clean.slice(0, 4);
  const dpdName = SULUT_NIK_PREFIX_TO_DPD[kabCode];
  const tempatLahirSuggestion = dpdName
    ? dpdName.replace(/^(Kabupaten|Kota)\s+/i, '')
    : undefined;

  let dd = parseInt(clean.slice(6, 8), 10);
  const mm = parseInt(clean.slice(8, 10), 10);
  const yy = parseInt(clean.slice(10, 12), 10);

  let jenisKelamin: 'Laki-laki' | 'Perempuan' | undefined = undefined;
  if (dd > 40 && dd <= 71) {
    jenisKelamin = 'Perempuan';
    dd -= 40;
  } else if (dd >= 1 && dd <= 31) {
    jenisKelamin = 'Laki-laki';
  }

  let tanggalLahir: string | undefined = undefined;
  if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && !isNaN(yy)) {
    const currentTwoDigitYear = new Date().getFullYear() % 100;
    const fullYear = yy <= currentTwoDigitYear - 15 ? 2000 + yy : 1900 + yy;
    const padD = String(dd).padStart(2, '0');
    const padM = String(mm).padStart(2, '0');
    tanggalLahir = `${fullYear}-${padM}-${padD}`;
  }

  return {
    isValidFormat: Boolean(jenisKelamin && tanggalLahir),
    dpdName,
    tempatLahirSuggestion,
    tanggalLahir,
    jenisKelamin,
  };
}

function cleanTerritoryNoise(raw: string): string {
  return (raw || '')
    .replace(/\b(KABUPATEN|KAB|KOTA|KECAMATAN|KEC|KELURAHAN|KEL|DESA)\b\.?/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mencocokkan teks Kabupaten, Kecamatan, dan Kelurahan hasil OCR ke master wilayah SULUT_REGIONS
 * dilengkapi dengan Fuzzy Similarity (toleransi salah baca karakter OCR).
 */
export function matchSulutTerritoryFromKtp(
  kabKotaText: string,
  kecamatanText: string,
  kelDesaText: string,
  nik: string
): {
  matchedDpd?: string;
  matchedDpc?: string;
  matchedDprt?: string;
} {
  const cleanKec = cleanTerritoryNoise(kecamatanText);
  const cleanKel = cleanTerritoryNoise(kelDesaText);
  const decodedNik = decodeIndonesianNik(nik);

  // 1. Cari DPD (Kabupaten/Kota) dari 4 digit awal NIK atau teks Header KTP
  let matchedRegion = decodedNik.dpdName
    ? SULUT_REGIONS.find((r) => isDpdMatch(r.name, decodedNik.dpdName))
    : undefined;

  if (!matchedRegion && kabKotaText) {
    matchedRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, kabKotaText));
    if (!matchedRegion) {
      let bestScore = 0;
      for (const r of SULUT_REGIONS) {
        const score = stringSimilarity(
          cleanTerritoryNoise(r.name),
          cleanTerritoryNoise(kabKotaText)
        );
        if (score > bestScore && score >= 0.72) {
          bestScore = score;
          matchedRegion = r;
        }
      }
    }
  }

  // Fallback cari DPD dari nama Kecamatan jika NIK/KabKota belum terdeteksi
  if (!matchedRegion && cleanKec) {
    matchedRegion = SULUT_REGIONS.find((r) =>
      r.subdistricts.some((s) => isDpcMatch(s.name, cleanKec))
    );
    if (!matchedRegion) {
      let bestScore = 0;
      for (const r of SULUT_REGIONS) {
        for (const s of r.subdistricts) {
          const score = stringSimilarity(s.name, cleanKec);
          if (score > bestScore && score >= 0.76) {
            bestScore = score;
            matchedRegion = r;
          }
        }
      }
    }
  }

  if (!matchedRegion) {
    return {};
  }

  // 2. Cari DPC (Kecamatan) secara eksak lalu fuzzy di dalam DPD tersebut
  let matchedSub = cleanKec
    ? matchedRegion.subdistricts.find((s) => isDpcMatch(s.name, cleanKec))
    : undefined;

  if (!matchedSub && cleanKec) {
    let bestSubScore = 0;
    for (const s of matchedRegion.subdistricts) {
      const score = stringSimilarity(s.name, cleanKec);
      if (score > bestSubScore && score >= 0.68) {
        bestSubScore = score;
        matchedSub = s;
      }
    }
  }

  // 3. Jika DPC belum ketemu tapi Kel/Desa terbaca, cari DPC yang memiliki Kel/Desa tersebut
  if (!matchedSub && cleanKel) {
    matchedSub = matchedRegion.subdistricts.find((s) =>
      s.villages.some((v) => isDprtMatch(v, cleanKel))
    );
    if (!matchedSub) {
      let bestVilScore = 0;
      for (const s of matchedRegion.subdistricts) {
        for (const v of s.villages) {
          const score = stringSimilarity(v, cleanKel);
          if (score > bestVilScore && score >= 0.74) {
            bestVilScore = score;
            matchedSub = s;
          }
        }
      }
    }
  }

  // 4. Cari DPRt (Desa/Kelurahan) di dalam DPC terpilih (atau seluruh DPC di DPD tersebut)
  let matchedVillage: string | undefined = undefined;
  if (cleanKel) {
    const searchSubs = matchedSub ? [matchedSub] : matchedRegion.subdistricts;
    for (const s of searchSubs) {
      const exactV = s.villages.find((v) => isDprtMatch(v, cleanKel));
      if (exactV) {
        matchedVillage = exactV;
        if (!matchedSub) matchedSub = s;
        break;
      }
    }

    if (!matchedVillage) {
      let bestVScore = 0;
      for (const s of searchSubs) {
        for (const v of s.villages) {
          const score = stringSimilarity(v, cleanKel);
          if (score > bestVScore && score >= 0.68) {
            bestVScore = score;
            matchedVillage = v;
            if (!matchedSub) matchedSub = s;
          }
        }
      }
    }
  }

  return {
    matchedDpd: matchedRegion.name,
    matchedDpc: matchedSub?.name,
    matchedDprt: matchedVillage || (cleanKel ? cleanKel : undefined),
  };
}
