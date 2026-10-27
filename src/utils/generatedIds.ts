/**
 * Penanda NIK / E-KTA hasil generate sistem.
 * Dipakai saat data pengurus diimpor tanpa NIK / E-KTA, supaya admin dapat mengenali
 * pengurus mana yang datanya belum lengkap.
 */

// Format NIK generate: 71 + kode DPD(2) + kode dewan(11/22/33/44) + 2026 + nomor urut(6)  = 16 digit.
// Bulan "26" pada posisi tanggal lahir tidak mungkin ada di NIK asli, sehingga pola ini unik.
// Pola NIK template/generate:
// 1. Format 16 digit urut dimulai angka 0 (contoh: 0000000000000001 dst)
// 2. Format lama: 71 + DPD + dewan + 2026 + urut
const GENERATED_NIK_PATTERN = /^(0{6,}\d+|71\d{2}(11|22|33|44)2026\d{6})$/;

export const GENERATED_EKTA_PREFIX = 'KTA-GEN-';

export const isGeneratedNik = (nik?: string | null): boolean =>
  GENERATED_NIK_PATTERN.test(String(nik || '').trim());

export const isGeneratedEkta = (ekta?: string | null): boolean =>
  String(ekta || '').trim().startsWith(GENERATED_EKTA_PREFIX);

/** E-KTA sementara yang diturunkan dari NIK (selalu unik karena NIK unik). */
export const makeGeneratedEkta = (nik: string): string =>
  `${GENERATED_EKTA_PREFIX}${String(nik).replace(/[^0-9]/g, '').slice(-10)}`;
