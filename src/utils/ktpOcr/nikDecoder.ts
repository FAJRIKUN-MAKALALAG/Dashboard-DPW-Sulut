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

/**
 * Mencocokkan teks Kabupaten, Kecamatan, dan Kelurahan hasil OCR ke master wilayah SULUT_REGIONS
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
  const decodedNik = decodeIndonesianNik(nik);
  let matchedRegion = decodedNik.dpdName
    ? SULUT_REGIONS.find((r) => isDpdMatch(r.name, decodedNik.dpdName))
    : undefined;

  if (!matchedRegion && kabKotaText) {
    matchedRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, kabKotaText));
  }

  if (!matchedRegion && kecamatanText) {
    matchedRegion = SULUT_REGIONS.find((r) =>
      r.subdistricts.some((s) => isDpcMatch(s.name, kecamatanText))
    );
  }

  if (!matchedRegion) {
    return {};
  }

  let matchedSub = kecamatanText
    ? matchedRegion.subdistricts.find((s) => isDpcMatch(s.name, kecamatanText))
    : undefined;

  if (!matchedSub && kelDesaText) {
    matchedSub = matchedRegion.subdistricts.find((s) =>
      s.villages.some((v) => isDprtMatch(v, kelDesaText))
    );
  }

  let matchedVillage: string | undefined = undefined;
  if (matchedSub && kelDesaText) {
    matchedVillage = matchedSub.villages.find((v) => isDprtMatch(v, kelDesaText));
  }
  if (!matchedVillage && kelDesaText) {
    matchedVillage = kelDesaText.trim();
  }

  return {
    matchedDpd: matchedRegion.name,
    matchedDpc: matchedSub?.name,
    matchedDprt: matchedVillage,
  };
}

