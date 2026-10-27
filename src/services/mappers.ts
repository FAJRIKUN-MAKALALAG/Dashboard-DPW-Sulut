import { Member, AuditLog, DeletionRequest, MemberStatus, DeletionRequestStatus, AppUser, UserRole } from '../types';
import { normalizeSubOrgName } from '../utils/jobMatchingUtils';

export function sanitizeDate(dateStr?: string | null): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.includes('T')) return trimmed.split('T')[0];
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

export function mapDbRowToMember(row: any): Member {
  const rawJabatan = (row.jabatan || '').trim();
  const jUpper = rawJabatan.toUpperCase();
  const rawTingkat = (row.tingkat_kepengurusan || '').trim();
  const dpd = (row.dpd || '').trim();
  const dpc = (row.dpc || '').trim();
  const dprt = (row.dprt || '').trim();
  const wil = (row.wilayah_penugasan || row.sub_organisasi || row.badan_sayap || '').toUpperCase();

  // Deteksi apakah penugasan atau jabatannya merupakan bagian dari struktur kepengurusan partai
  const isCouncilOrStructure =
    wil.includes('PERTIMBANGAN') ||
    wil.includes('PAKAR') ||
    wil.includes('PIMPINAN') ||
    wil.includes('DEWAN') ||
    wil.includes('BIDANG') ||
    wil.includes('SAYAP') ||
    wil.includes('BADAN') ||
    jUpper.includes('PERTIMBANGAN') ||
    jUpper.includes('PAKAR') ||
    jUpper.includes('WANHAT') ||
    jUpper.includes('WANTIM') ||
    jUpper.includes('WANPAK') ||
    ['DPW', 'DPD', 'DPC', 'DPRT'].includes(rawTingkat.toUpperCase());

  // Hanya dianggap anggota biasa murni jika bukan dari struktur kepengurusan dan jabatannya non-struktural
  const isOrdinary =
    !isCouncilOrStructure &&
    (!rawJabatan ||
      rawJabatan === '-' ||
      jUpper === 'ANGGOTA BIASA' ||
      jUpper === 'ANGGOTA' ||
      jUpper === 'BUKAN PENGURUS' ||
      jUpper === 'SIMPATISAN' ||
      jUpper === 'KADER');

  const isPengurus =
    row.is_pengurus === true ||
    row.is_pengurus === 'true' ||
    row.is_pengurus === 1 ||
    row.kategori === 'Pengurus' ||
    row.kategori_kader === 'Pengurus' ||
    Boolean(row.nomor_sk) ||
    isCouncilOrStructure ||
    !isOrdinary;

  // Deteksi tingkat kepengurusan cerdas
  let tingkatKepengurusan: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus' = 'Bukan Pengurus';
  if (['DPW', 'DPD', 'DPC', 'DPRt'].includes(rawTingkat)) {
    tingkatKepengurusan = rawTingkat as any;
  } else if (isPengurus) {
    if (
      jUpper.includes('DPW') ||
      jUpper.includes('WILAYAH') ||
      dpd === 'Sulawesi Utara' ||
      dpd === 'DPW Sulut' ||
      wil.includes('DPW')
    ) {
      tingkatKepengurusan = 'DPW';
    } else if (
      jUpper.includes('DPRT') ||
      jUpper.includes('RANTING') ||
      (dprt && dprt !== '-' && dprt !== 'Pusat/Umum' && dprt !== 'Umum')
    ) {
      tingkatKepengurusan = 'DPRt';
    } else if (
      jUpper.includes('DPC') ||
      jUpper.includes('CABANG') ||
      (dpc && dpc !== '-' && dpc !== 'Umum (DPD)' && dpc !== 'Wilayah DPD' && dpc !== 'Pusat/Umum' && dpc !== 'Umum' && !jUpper.includes('DPD'))
    ) {
      tingkatKepengurusan = 'DPC';
    } else {
      tingkatKepengurusan = 'DPD';
    }
  }

  // Normalisasi cerdas Sub-Organisasi (Dewan Pertimbangan, Dewan Pakar, Dewan Pimpinan)
  const rawWil = (row.wilayah_penugasan || row.sub_organisasi || row.badan_sayap || '').trim();
  let finalWilayahPenugasan: string | undefined = undefined;

  if (rawWil) {
    finalWilayahPenugasan = normalizeSubOrgName(
      rawWil,
      tingkatKepengurusan === 'Bukan Pengurus' ? 'DPD' : (tingkatKepengurusan as any)
    );
  } else if (isCouncilOrStructure) {
    if (jUpper.includes('PERTIMBANGAN') || jUpper.includes('WANHAT') || jUpper.includes('WANTIM')) {
      finalWilayahPenugasan = tingkatKepengurusan === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
    } else if (jUpper.includes('PAKAR') || jUpper.includes('WANPAK')) {
      finalWilayahPenugasan = tingkatKepengurusan === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
    } else if (isPengurus && tingkatKepengurusan !== 'Bukan Pengurus') {
      finalWilayahPenugasan = normalizeSubOrgName(undefined, tingkatKepengurusan as any);
    }
  }

  return {
    id: row.id || undefined,
    nik: String(row.nik || ''),
    nomorEKTA: row.nomor_ekta || '',
    namaLengkap: row.nama_lengkap || '',
    nomorHP: row.nomor_hp || '-',
    email: row.email || undefined,
    sosmed: row.sosmed || undefined,
    dpd: row.dpd || '',
    dpc: row.dpc || '',
    dprt: row.dprt || '',
    isPengurus,
    tingkatKepengurusan,
    wilayahPenugasan: finalWilayahPenugasan,
    nomorSK: row.nomor_sk || undefined,
    tanggalSK: row.tanggal_sk || undefined,
    kodeReferral: row.kode_referral || undefined,
    jabatan: rawJabatan || 'Anggota Biasa',
    status: (row.status as MemberStatus) || 'Aktif',
    tanggalBergabung: row.tanggal_bergabung || new Date().toISOString().split('T')[0],
    catatanMutasi: row.catatan_mutasi || undefined,
    terakhirDiubah: row.terakhir_diubah || undefined,
    diubahOleh: row.diubah_oleh || undefined,
    fotoProfilUrl: row.foto_profil_url || undefined,
    fotoKtpUrl: row.foto_ktp_url || undefined,
    jenisKelamin: row.jenis_kelamin || undefined,
    tempatLahir: row.tempat_lahir || undefined,
    tanggalLahir: row.tanggal_lahir || undefined,
    alamatLengkap: row.alamat_lengkap || undefined,
    agama: row.agama || undefined,
    pekerjaan: row.pekerjaan || undefined,
    statusKtpVerified: Boolean(row.status_ktp_verified),
    kaderPerekrutNama: row.kader_perekrut_nama || undefined,
    kaderPerekrutNik: row.kader_perekrut_nik || undefined,
    kaderPerekrutEkta: row.kader_perekrut_ekta || undefined,
    kaderPerekrutJabatan: row.kader_perekrut_jabatan || undefined,
    kaderPerekrutKodeReferral: row.kader_perekrut_kode_referral || undefined,
    ketuaLangsungNik: row.ketua_langsung_nik || undefined,
    ketuaLangsungNama: row.ketua_langsung_nama || undefined,
    ketuaLangsungJabatan: row.ketua_langsung_jabatan || undefined,
    ketuaLangsungTingkat: row.ketua_langsung_tingkat || undefined,
    urutan: row.urutan !== undefined && row.urutan !== null ? Number(row.urutan) : undefined,
  };
}

export function mapMemberToDbPayload(m: Member): any {
  const payload: any = {
    id: m.id || undefined,
    nik: String(m.nik).trim(),
    nomor_ekta: m.nomorEKTA?.trim() || null,
    nama_lengkap: m.namaLengkap.trim(),
    nomor_hp: m.nomorHP?.trim() || null,
    email: m.email?.trim() || null,
    sosmed: m.sosmed?.trim() || null,
    dpd: m.dpd,
    dpc: m.dpc,
    dprt: m.dprt,
    is_pengurus: Boolean(m.isPengurus),
    tingkat_kepengurusan: m.tingkatKepengurusan || 'Bukan Pengurus',
    wilayah_penugasan: m.wilayahPenugasan || null,
    nomor_sk: m.nomorSK?.trim() || null,
    tanggal_sk: sanitizeDate(m.tanggalSK),
    kode_referral: m.kodeReferral?.trim() || null,
    jabatan: m.jabatan || 'Anggota Biasa',
    status: m.status || 'Aktif',
    tanggal_bergabung: sanitizeDate(m.tanggalBergabung) || new Date().toISOString().split('T')[0],
    catatan_mutasi: m.catatanMutasi?.trim() || null,
    terakhir_diubah: new Date().toISOString(),
    diubah_oleh: m.diubahOleh || 'Sistem Realtime',
    foto_profil_url: m.fotoProfilUrl || null,
    foto_ktp_url: m.fotoKtpUrl || null,
    status_ktp_verified: Boolean(m.statusKtpVerified),
    jenis_kelamin: m.jenisKelamin || null,
    tempat_lahir: m.tempatLahir?.trim() || null,
    tanggal_lahir: sanitizeDate(m.tanggalLahir),
    alamat_lengkap: m.alamatLengkap?.trim() || null,
    agama: m.agama || null,
    pekerjaan: m.pekerjaan || null,
    kader_perekrut_nama: m.kaderPerekrutNama?.trim() || null,
    kader_perekrut_nik: m.kaderPerekrutNik?.trim() || null,
    kader_perekrut_ekta: m.kaderPerekrutEkta?.trim() || null,
    kader_perekrut_jabatan: m.kaderPerekrutJabatan?.trim() || null,
    kader_perekrut_kode_referral: m.kaderPerekrutKodeReferral?.trim() || null,
    ketua_langsung_nik: m.ketuaLangsungNik?.trim() || null,
    ketua_langsung_nama: m.ketuaLangsungNama?.trim() || null,
    ketua_langsung_jabatan: m.ketuaLangsungJabatan?.trim() || null,
    ketua_langsung_tingkat: m.ketuaLangsungTingkat?.trim() || null,
  };
  // Hanya dikirim bila ada nilainya (kolom urutan opsional, tidak menimpa data lama)
  if (m.urutan !== undefined && m.urutan !== null) payload.urutan = m.urutan;
  return payload;
}

export function mapDbRowToAuditLog(row: any): AuditLog {
  const ts = row.timestamp || row.created_at || new Date().toISOString();
  const formattedTime = ts.includes('T') ? ts.replace('T', ' ').substring(0, 16) : ts;

  return {
    id: String(row.id),
    timestamp: formattedTime,
    memberNik: row.member_nik || '',
    memberName: row.member_name || '',
    action: row.action || 'UPDATE',
    previousStatus: row.previous_status || undefined,
    newStatus: row.new_status || undefined,
    reason: row.reason || '',
    actor: row.actor || 'Admin',
    dpd: row.dpd || 'Sulawesi Utara',
  };
}

export function mapDbRowToDeletionRequest(row: any): DeletionRequest {
  const reqAt = row.requested_at || row.created_at || new Date().toISOString();
  const formattedReq = reqAt.includes('T') ? reqAt.replace('T', ' ').substring(0, 16) : reqAt;

  return {
    id: String(row.id),
    memberNik: row.member_nik || '',
    memberName: row.member_name || '',
    memberNomorEKTA: row.member_nik || '',
    dpd: row.dpd || '',
    dpc: row.dpc || '',
    dprt: row.dprt || '',
    statusMember: 'Aktif',
    requestedByRole: 'ADMIN_DPD',
    requestedByName: row.requested_by || 'Admin Daerah',
    requestedAt: formattedReq,
    reason: row.reason || '',
    status: (row.status as DeletionRequestStatus) || 'PENDING',
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? row.reviewed_at.replace('T', ' ').substring(0, 16) : undefined,
    reviewNotes: row.review_notes || undefined,
  };
}

export function mapDbRowToAppUser(row: any): AppUser {
  return {
    id: String(row.id),
    memberNik: row.member_nik || undefined,
    nomorEkta: row.nomor_ekta || undefined,
    username: row.username || '',
    password: row.password_hash || '',
    fullName: row.full_name || '',
    role: (row.role as UserRole) || 'ADMIN_DPD',
    dpdAccess: row.dpd_access || 'ALL',
    dpcAccess: row.dpc_access || 'ALL',
    dprtAccess: row.dprt_access || 'ALL',
    jabatan: row.jabatan || '',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAppUserToDbPayload(user: Partial<AppUser>): any {
  const payload: any = {};
  if (user.memberNik !== undefined) payload.member_nik = user.memberNik;
  if (user.nomorEkta !== undefined) payload.nomor_ekta = user.nomorEkta;
  if (user.username !== undefined) payload.username = user.username.trim();
  if (user.password !== undefined) payload.password_hash = user.password.trim();
  if (user.fullName !== undefined) payload.full_name = user.fullName.trim();
  if (user.role !== undefined) payload.role = user.role;
  if (user.dpdAccess !== undefined) payload.dpd_access = user.dpdAccess;
  if (user.dpcAccess !== undefined) payload.dpc_access = user.dpcAccess;
  if (user.dprtAccess !== undefined) payload.dprt_access = user.dprtAccess;
  if (user.jabatan !== undefined) payload.jabatan = user.jabatan;
  if (user.isActive !== undefined) payload.is_active = user.isActive;
  payload.updated_at = new Date().toISOString();
  return payload;
}
