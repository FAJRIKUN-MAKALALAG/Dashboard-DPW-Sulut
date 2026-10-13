import { createClient } from '@supabase/supabase-js';
import { Member, AuditLog, DeletionRequest } from '../types';

// Read environment variables (Vite requires VITE_ prefix)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
const supabaseAnonKey = rawAnonKey.replace(/^["']|["']$/g, '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// HELPER FUNCTIONS UNTUK INTEGRASI DATABASE SUPABASE
// ============================================================================

/**
 * Mengambil seluruh data anggota dari tabel Supabase
 */
export async function getMembersFromSupabase(): Promise<Member[] | null> {
  if (!supabase) return null;
  try {
    const { data, error, status } = await supabase
      .from('members')
      .select('*')
      .order('nama_lengkap', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || status === 404 || error.message?.includes('schema cache')) {
        console.warn(
          '[Supabase Info] Tabel "public.members" belum dibuat di proyek Supabase. Silakan jalankan file SQL "import_minsel_to_supabase.sql" atau "supabase_schema.sql" di SQL Editor Supabase.'
        );
        return [];
      }
      console.warn('Peringatan membaca data Supabase:', error.message || error);
      return [];
    }

    // Mapping snake_case kolom Supabase ke camelCase interface Member
    return (data || []).map((row: any) => ({
      nik: row.nik,
      nomorEKTA: row.nomor_ekta || '',
      namaLengkap: row.nama_lengkap,
      nomorHP: row.nomor_hp || '-',
      email: row.email,
      sosmed: row.sosmed,
      dpd: row.dpd,
      dpc: row.dpc,
      dprt: row.dprt,
      isPengurus: Boolean(row.is_pengurus),
      tingkatKepengurusan: row.tingkat_kepengurusan || 'Bukan Pengurus',
      wilayahPenugasan: row.wilayah_penugasan,
      nomorSK: row.nomor_sk,
      tanggalSK: row.tanggal_sk,
      kodeReferral: row.kode_referral,
      jabatan: row.jabatan || 'Anggota Biasa',
      status: row.status || 'Aktif',
      tanggalBergabung: row.tanggal_bergabung || new Date().toISOString().split('T')[0],
      catatanMutasi: row.catatan_mutasi,
      terakhirDiubah: row.terakhir_diubah,
      diubahOleh: row.diubah_oleh,
      fotoProfilUrl: row.foto_profil_url,
      fotoKtpUrl: row.foto_ktp_url,
      jenisKelamin: row.jenis_kelamin,
      tempatLahir: row.tempat_lahir,
      tanggalLahir: row.tanggal_lahir,
      alamatLengkap: row.alamat_lengkap,
      agama: row.agama,
      pekerjaan: row.pekerjaan,
      statusKtpVerified: Boolean(row.status_ktp_verified),
      kaderPerekrutNama: row.kader_perekrut_nama,
      kaderPerekrutNik: row.kader_perekrut_nik,
      kaderPerekrutEkta: row.kader_perekrut_ekta,
      kaderPerekrutJabatan: row.kader_perekrut_jabatan,
    }));
  } catch (err) {
    console.error('Supabase query failed:', err);
    return null;
  }
}

/**
 * Menyimpan / memperbarui daftar anggota ke Supabase secara massal (Upsert)
 */
export async function upsertMembersToSupabase(members: Member[]): Promise<boolean> {
  if (!supabase || members.length === 0) return false;
  try {
    const payload = members.map((m) => ({
      nik: m.nik,
      nomor_ekta: m.nomorEKTA || null,
      nama_lengkap: m.namaLengkap,
      nomor_hp: m.nomorHP || null,
      email: m.email || null,
      sosmed: m.sosmed || null,
      dpd: m.dpd,
      dpc: m.dpc,
      dprt: m.dprt,
      is_pengurus: Boolean(m.isPengurus),
      tingkat_kepengurusan: m.tingkatKepengurusan || 'Bukan Pengurus',
      wilayah_penugasan: m.wilayahPenugasan || null,
      nomor_sk: m.nomorSK || null,
      tanggal_sk: m.tanggalSK && m.tanggalSK.trim() ? m.tanggalSK.trim() : null,
      kode_referral: m.kodeReferral || null,
      jabatan: m.jabatan,
      status: m.status,
      tanggal_bergabung: m.tanggalBergabung && m.tanggalBergabung.trim() ? m.tanggalBergabung.trim() : null,
      catatan_mutasi: m.catatanMutasi || null,
      terakhir_diubah: new Date().toISOString(),
      diubah_oleh: m.diubahOleh || 'Sistem',
      foto_profil_url: m.fotoProfilUrl || null,
      foto_ktp_url: m.fotoKtpUrl || null,
      status_ktp_verified: Boolean(m.statusKtpVerified),
      jenis_kelamin: m.jenisKelamin || null,
      tempat_lahir: m.tempatLahir || null,
      tanggal_lahir: m.tanggalLahir && m.tanggalLahir.trim() ? m.tanggalLahir.trim() : null,
      alamat_lengkap: m.alamatLengkap || null,
      agama: m.agama || null,
      pekerjaan: m.pekerjaan || null,
      kader_perekrut_nama: m.kaderPerekrutNama || null,
      kader_perekrut_nik: m.kaderPerekrutNik || null,
      kader_perekrut_ekta: m.kaderPerekrutEkta || null,
      kader_perekrut_jabatan: m.kaderPerekrutJabatan || null,
    }));

    const { error } = await supabase.from('members').upsert(payload, { onConflict: 'nik' });
    if (error) {
      console.error('Error upserting to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert failed:', err);
    return false;
  }
}
