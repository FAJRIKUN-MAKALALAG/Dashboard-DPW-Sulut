import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Member, AuditLog, DeletionRequest, MemberStatus, UserRole, DeletionRequestStatus } from '../types';

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
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ============================================================================
// HELPER UTILITIES & DATA MAPPERS
// ============================================================================

function sanitizeDate(dateStr?: string | null): string | null {
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
  return {
    nik: String(row.nik || ''),
    nomorEKTA: row.nomor_ekta || '',
    namaLengkap: row.nama_lengkap || '',
    nomorHP: row.nomor_hp || '-',
    email: row.email || undefined,
    sosmed: row.sosmed || undefined,
    dpd: row.dpd || '',
    dpc: row.dpc || '',
    dprt: row.dprt || '',
    isPengurus: Boolean(row.is_pengurus),
    tingkatKepengurusan: row.tingkat_kepengurusan || 'Bukan Pengurus',
    wilayahPenugasan: row.wilayah_penugasan || undefined,
    nomorSK: row.nomor_sk || undefined,
    tanggalSK: row.tanggal_sk || undefined,
    kodeReferral: row.kode_referral || undefined,
    jabatan: row.jabatan || 'Anggota Biasa',
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
  };
}

export function mapMemberToDbPayload(m: Member): any {
  return {
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
  };
}

export function mapDbRowToAuditLog(row: any): AuditLog {
  const ts = row.timestamp || row.created_at || new Date().toISOString();
  // Format readable timestamp if it's full ISO
  const formattedTime = ts.includes('T')
    ? ts.replace('T', ' ').substring(0, 16)
    : ts;

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

// ============================================================================
// 1. ANGGOTA & PENGURUS (MEMBERS CRUD)
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
        console.warn('[Supabase] Tabel "public.members" belum aktif.');
        return [];
      }
      console.warn('Peringatan membaca data Supabase:', error.message || error);
      return [];
    }

    return (data || []).map(mapDbRowToMember);
  } catch (err) {
    console.error('Supabase getMembers query failed:', err);
    return null;
  }
}

/**
 * Menyimpan / memperbarui 1 orang anggota secara realtime ke Supabase
 */
export async function upsertSingleMemberToSupabase(member: Member): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = mapMemberToDbPayload(member);
    const { error } = await supabase.from('members').upsert([payload], { onConflict: 'nik' });
    if (error) {
      console.error('Error upsertSingleMemberToSupabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in upsertSingleMemberToSupabase:', err);
    return false;
  }
}

/**
 * Menyimpan / memperbarui daftar anggota ke Supabase secara massal (Batch Upsert)
 */
export async function upsertMembersToSupabase(members: Member[]): Promise<boolean> {
  if (!supabase || members.length === 0) return false;
  try {
    const payload = members.map(mapMemberToDbPayload);
    // Batch upsert in chunks of 500 to prevent payload limits
    const chunkSize = 500;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { error } = await supabase.from('members').upsert(chunk, { onConflict: 'nik' });
      if (error) {
        console.error('Error batch upserting to Supabase:', error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Supabase batch upsert failed:', err);
    return false;
  }
}

/**
 * Menghapus data anggota dari Supabase secara permanen
 */
export async function deleteMemberFromSupabase(nik: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('members').delete().eq('nik', nik);
    if (error) {
      console.error('Error deleteMemberFromSupabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in deleteMemberFromSupabase:', err);
    return false;
  }
}

/**
 * Menghapus kumpulan anggota dari Supabase secara massal (Batch Delete)
 */
export async function deleteMembersFromSupabase(niks: string[]): Promise<boolean> {
  if (!supabase || niks.length === 0) return false;
  try {
    const chunkSize = 200;
    for (let i = 0; i < niks.length; i += chunkSize) {
      const chunk = niks.slice(i, i + chunkSize);
      const { error } = await supabase.from('members').delete().in('nik', chunk);
      if (error) {
        console.error('Error deleteMembersFromSupabase batch:', error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Exception in deleteMembersFromSupabase:', err);
    return false;
  }
}

// ============================================================================
// 2. AUDIT LOGS (RIWAYAT AUDIT CRUD)
// ============================================================================

/**
 * Mengambil seluruh data riwayat audit dari Supabase
 */
export async function getAuditLogsFromSupabase(): Promise<AuditLog[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('Peringatan membaca audit_logs Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToAuditLog);
  } catch (err) {
    console.error('Supabase getAuditLogs failed:', err);
    return [];
  }
}

/**
 * Menambahkan catatan audit baru ke Supabase
 */
export async function insertAuditLogToSupabase(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog | null> {
  if (!supabase) return null;
  try {
    const payload = {
      member_nik: log.memberNik,
      member_name: log.memberName,
      action: log.action,
      previous_status: log.previousStatus || null,
      new_status: log.newStatus || null,
      reason: log.reason,
      actor: log.actor,
      dpd: log.dpd,
    };

    const { data, error } = await supabase.from('audit_logs').insert([payload]).select().single();
    if (error) {
      console.error('Error insertAuditLogToSupabase:', error);
      return null;
    }
    return mapDbRowToAuditLog(data);
  } catch (err) {
    console.error('Exception in insertAuditLogToSupabase:', err);
    return null;
  }
}

// ============================================================================
// 3. DELETION REQUESTS (PERMOHONAN HAPUS DATA CRUD)
// ============================================================================

/**
 * Mengambil daftar permohonan hapus dari Supabase
 */
export async function getDeletionRequestsFromSupabase(): Promise<DeletionRequest[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('deletion_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Peringatan membaca deletion_requests Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToDeletionRequest);
  } catch (err) {
    console.error('Supabase getDeletionRequests failed:', err);
    return [];
  }
}

/**
 * Mengajukan permohonan hapus baru ke Supabase
 */
export async function insertDeletionRequestToSupabase(
  req: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>
): Promise<DeletionRequest | null> {
  if (!supabase) return null;
  try {
    const payload = {
      member_nik: req.memberNik,
      member_name: req.memberName,
      dpd: req.dpd,
      dpc: req.dpc,
      dprt: req.dprt,
      requested_by: req.requestedByName,
      reason: req.reason,
      status: 'PENDING',
    };

    const { data, error } = await supabase.from('deletion_requests').insert([payload]).select().single();
    if (error) {
      console.error('Error insertDeletionRequestToSupabase:', error);
      return null;
    }
    return mapDbRowToDeletionRequest(data);
  } catch (err) {
    console.error('Exception in insertDeletionRequestToSupabase:', err);
    return null;
  }
}

/**
 * Memperbarui status permohonan hapus (APPROVED / REJECTED) di Supabase
 */
export async function updateDeletionRequestInSupabase(req: DeletionRequest): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      status: req.status,
      reviewed_by: req.reviewedBy || null,
      reviewed_at: new Date().toISOString(),
      review_notes: req.reviewNotes || null,
    };

    const { error } = await supabase
      .from('deletion_requests')
      .update(payload)
      .eq('id', req.id);

    if (error) {
      console.error('Error updateDeletionRequestInSupabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in updateDeletionRequestInSupabase:', err);
    return false;
  }
}

// ============================================================================
// 4. SUPABASE REALTIME SUBSCRIPTION (LIVE DATA SINKRONISASI)
// ============================================================================

export interface RealtimeCallbacks {
  onMemberChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', member: Member | { nik: string }) => void;
  onAuditLogInsert?: (log: AuditLog) => void;
  onDeletionRequestChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', req: DeletionRequest | { id: string }) => void;
}

/**
 * Berlangganan (Subscribe) perubahan data Supabase secara Realtime (WebSocket).
 * Setiap ada INSERT / UPDATE / DELETE di database, callback otomatis terpanggil.
 */
export function subscribeToAllRealtime(callbacks: RealtimeCallbacks): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel('nasdem-sulut-realtime-global')
    // 1. Members Table Changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'members' },
      (payload) => {
        if (!callbacks.onMemberChange) return;
        if (payload.eventType === 'DELETE') {
          const nik = payload.old?.nik;
          if (nik) callbacks.onMemberChange('DELETE', { nik });
        } else if (payload.new) {
          const member = mapDbRowToMember(payload.new);
          callbacks.onMemberChange(payload.eventType as 'INSERT' | 'UPDATE', member);
        }
      }
    )
    // 2. Audit Logs Changes
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      (payload) => {
        if (!callbacks.onAuditLogInsert) return;
        if (payload.new) {
          const log = mapDbRowToAuditLog(payload.new);
          callbacks.onAuditLogInsert(log);
        }
      }
    )
    // 3. Deletion Requests Changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'deletion_requests' },
      (payload) => {
        if (!callbacks.onDeletionRequestChange) return;
        if (payload.eventType === 'DELETE') {
          const id = payload.old?.id;
          if (id) callbacks.onDeletionRequestChange('DELETE', { id });
        } else if (payload.new) {
          const req = mapDbRowToDeletionRequest(payload.new);
          callbacks.onDeletionRequestChange(payload.eventType as 'INSERT' | 'UPDATE', req);
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn('[Realtime Info] Subscription status:', status, err.message);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
