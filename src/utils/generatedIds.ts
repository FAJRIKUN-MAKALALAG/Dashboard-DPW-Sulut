/**
 * Penanda NIK / E-KTA hasil generate sistem.
 * Dipakai saat data pengurus diimpor tanpa NIK / E-KTA, supaya admin dapat mengenali
 * pengurus mana yang datanya belum lengkap.
 */

// Format NIK generate: 71 + kode DPD(2) + kode dewan(11/22/33/44) + 2026 + nomor urut(6)  = 16 digit.
// Bulan "26" pada posisi tanggal lahir tidak mungkin ada di NIK asli, sehingga pola ini unik.
// Pola NIK template/generate:
// 1. Format 16 digit urut dimulai angka 0 (contoh: 0000000000000001 dst)
// 2. Format aktif: 71 + DPD(2) + dewan(11/22/33/44/55/99) + 26 + urut/scope(8) = 16 digit
// 3. Format lama: 71 + DPD(2) + dewan(11/22/33/44) + 2026 + urut(6) = 16 digit
const GENERATED_NIK_PATTERN = /^(0{6,}\d+|71\d{2}(11|22|33|44|55|99)26\d{8}|71\d{2}(11|22|33|44)2026\d{6})$/;

export const GENERATED_EKTA_PREFIX = 'KTA-GEN-';

export const isGeneratedNik = (nik?: string | null): boolean =>
  GENERATED_NIK_PATTERN.test(String(nik || '').trim());

/**
 * True bila NIK berisi angka 8-20 digit yang layak disimpan apa adanya saat impor/edit matriks
 * (termasuk NIK yang terketik 12-15 digit di Excel agar angkanya tidak hilang).
 */
export const isAcceptableImportNik = (nik?: string | null): boolean => {
  const clean = String(nik || '').replace(/[^0-9]/g, '').trim();
  if (clean.length < 8 || clean.length > 20) return false;
  if (/^0{6,}/.test(clean)) return false;
  if (isGeneratedNik(clean)) return false;
  return true;
};

/** True bila NIK sudah ada angkanya (bukan ID generate), tetapi panjangnya belum tepat 16 digit standar KTP. */
export const isIncompleteNik = (nik?: string | null): boolean => {
  if (!nik || isGeneratedNik(nik)) return false;
  const clean = String(nik).replace(/[^0-9]/g, '').trim();
  return clean.length > 0 && clean.length !== 16;
};

export const isGeneratedEkta = (ekta?: string | null): boolean =>
  String(ekta || '').trim().startsWith(GENERATED_EKTA_PREFIX);

/** E-KTA sementara yang diturunkan dari NIK (selalu unik karena NIK unik). */
export const makeGeneratedEkta = (nik: string): string =>
  `${GENERATED_EKTA_PREFIX}${String(nik).replace(/[^0-9]/g, '').slice(-10)}`;

const PLACEHOLDER_VALUES = new Set(['', '-', '--', '---', '—', 'null', 'none', 'n/a', '0']);

export const isImportPlaceholder = (val?: string | null): boolean =>
  PLACEHOLDER_VALUES.has(String(val || '').trim().toLowerCase());

export interface RequiredImportCheckResult {
  isValid: boolean;
  missingFields: string[];
  reason?: string;
  cleanNik: string;
  cleanEkta: string;
  cleanHp: string;
}

/**
 * Validasi 3 kolom wajib saat import Excel/SQL:
 * 1. NIK: tepat 16 digit angka valid (bukan template/generate sistem)
 * 2. e-KTA: nomor e-KTA asli terisi (bukan kosong / '-' / KTA-GEN-...)
 * 3. No. Telepon / HP: nomor aktif terisi minimal 8 digit angka (bukan kosong / '-')
 * Jika salah satu saja tidak lengkap, baris wajib ditolak.
 */
export const validateRequiredImportColumns = (fields: {
  nik?: string | null;
  nomorEKTA?: string | null;
  nomorHP?: string | null;
}): RequiredImportCheckResult => {
  const cleanNik = String(fields.nik || '').replace(/[^0-9]/g, '').trim();
  const cleanEkta = String(fields.nomorEKTA || '').trim();
  const cleanHp = String(fields.nomorHP || '').trim();
  const hpDigits = cleanHp.replace(/[^0-9]/g, '');

  const missingFields: string[] = [];

  if (
    !/^\d{16}$/.test(cleanNik) ||
    /^0{6,}/.test(cleanNik) ||
    isGeneratedNik(cleanNik)
  ) {
    missingFields.push('NIK (wajib 16 digit)');
  }

  if (
    isImportPlaceholder(cleanEkta) ||
    isGeneratedEkta(cleanEkta) ||
    cleanEkta.length < 5 ||
    !/\d/.test(cleanEkta)
  ) {
    missingFields.push('Nomor e-KTA');
  }

  if (isImportPlaceholder(cleanHp) || hpDigits.length < 8) {
    missingFields.push('No. Telepon/HP');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    reason:
      missingFields.length > 0
        ? `Data tidak masuk — kolom wajib belum lengkap: ${missingFields.join(', ')}`
        : undefined,
    cleanNik,
    cleanEkta,
    cleanHp,
  };
};
