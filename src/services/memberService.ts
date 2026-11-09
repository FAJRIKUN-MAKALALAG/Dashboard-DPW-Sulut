import { Member } from '../types';
import { mapMemberToDbPayload } from './mappers';
import { mapApiMember } from './apiMappers';
import { apiFetch, ApiError, getToken } from './http';

interface MemberListResponse {
  items: any[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface GetMembersOptions {
  /** Lewati cache cooldown standar (mis. saat tombol Tarik Data ditekan manual) */
  force?: boolean;
}

const FETCH_PAGE_SIZE = 500; // batas MAX_PAGE_SIZE di backend
const PARALLEL_PAGES = 4;
const BULK_UPSERT_CHUNK = 500;
const BULK_DELETE_CHUNK = 1000;

// In-flight deduplication & cooldown cache untuk mencegah request ganda beruntun
const AUTO_COOLDOWN_MS = 8000;
const FORCE_COOLDOWN_MS = 2000;

let inFlightGetAll: Promise<Member[] | null> | null = null;
let inFlightToken: string | null = null;
let cachedMembers: Member[] | null = null;
let cachedAt = 0;
let cachedToken: string | null = null;

export function invalidateMemberCache(): void {
  cachedMembers = null;
  cachedAt = 0;
  cachedToken = null;
}

/**
 * Payload ke backend. Kolom yang dikelola server (waktu ubah, pengubah) dibuang, dan foto yang
 * kosong tidak dikirim agar tidak menimpa foto di database (daftar anggota tidak memuat foto).
 */
function toApiPayload(member: Member): Record<string, any> {
  const payload = mapMemberToDbPayload(member);
  delete payload.terakhir_diubah;
  delete payload.diubah_oleh;
  if (!payload.foto_profil_url) delete payload.foto_profil_url;
  if (!payload.foto_ktp_url) delete payload.foto_ktp_url;
  return payload;
}

/**
 * Service operasi data anggota (Members) melalui backend API.
 */
export const MemberService = {
  invalidateCache: invalidateMemberCache,

  /**
   * Mengambil seluruh data anggota (sesuai cakupan wilayah akun) dengan paginasi dari server.
   * Dilengkapi In-Flight Request Deduplication & Cooldown Throttling agar aman saat banyak komponen/user aktif.
   */
  async getAll(options?: GetMembersOptions): Promise<Member[] | null> {
    const currentToken = getToken() || '__anon__';
    const now = Date.now();
    const cooldown = options?.force ? FORCE_COOLDOWN_MS : AUTO_COOLDOWN_MS;

    // Jika akun berganti, bersihkan cache akun sebelumnya
    if (cachedToken && cachedToken !== currentToken) {
      invalidateMemberCache();
    }

    // Gunakan cache segar jika baru saja ditarik dalam jendela cooldown
    if (cachedMembers && cachedToken === currentToken && now - cachedAt < cooldown) {
      return cachedMembers;
    }

    // Gabungkan request paralel yang sedang berjalan untuk akun yang sama (In-Flight Deduplication)
    if (inFlightGetAll && inFlightToken === currentToken) {
      return inFlightGetAll;
    }

    inFlightToken = currentToken;
    inFlightGetAll = (async () => {
      try {
        const first = await apiFetch<MemberListResponse>('/members', {
          query: { page: 1, per_page: FETCH_PAGE_SIZE, include_photos: 'true' },
        });
        const rows: any[] = [...first.items];

        const remaining: number[] = [];
        for (let p = 2; p <= first.totalPages; p++) remaining.push(p);

        for (let i = 0; i < remaining.length; i += PARALLEL_PAGES) {
          const batch = remaining.slice(i, i + PARALLEL_PAGES);
          const pages = await Promise.all(
            batch.map((page) =>
              apiFetch<MemberListResponse>('/members', {
                query: { page, per_page: FETCH_PAGE_SIZE, include_photos: 'true' },
              })
            )
          );
          pages.forEach((pg) => rows.push(...pg.items));
        }

        const mapped = rows.map(mapApiMember);
        cachedMembers = mapped;
        cachedAt = Date.now();
        cachedToken = currentToken;
        console.log(`[API] Berhasil menarik ${rows.length} data anggota dari backend.`);
        return mapped;
      } catch (err) {
        console.error('[API] Gagal menarik data anggota:', err);
        return null;
      } finally {
        inFlightGetAll = null;
        inFlightToken = null;
      }
    })();

    return inFlightGetAll;
  },

  /**
   * Mengambil 1 anggota berdasarkan NIK (lengkap dengan foto). Null jika tidak ada / di luar cakupan.
   */
  async getByNik(nik: string): Promise<Member | null> {
    try {
      const singleRes = await apiFetch<any>(`/members/${encodeURIComponent(nik)}`);
      const item = singleRes?.member || singleRes;
      if (item && item.nik) {
        return mapApiMember(item);
      }
    } catch {
      // Fallback ke list endpoint jika single endpoint gagal
    }
    try {
      const res = await apiFetch<MemberListResponse>('/members', {
        query: { q: nik, search_by: 'nik', per_page: 1, include_photos: 'true' },
      });
      const found = res.items.find((i) => i.nik === nik);
      return found ? mapApiMember(found) : null;
    } catch {
      return null;
    }
  },

  /**
   * Mendaftarkan anggota baru ke database (POST).
   */
  async createOne(member: Member): Promise<boolean> {
    try {
      const payload = toApiPayload(member);
      const res = await apiFetch<any>('/members', { method: 'POST', body: payload });
      if (res && typeof res === 'object') {
        const item = res.member || res;
        if (item.fotoProfilUrl) member.fotoProfilUrl = item.fotoProfilUrl;
        if (item.fotoKtpUrl) member.fotoKtpUrl = item.fotoKtpUrl;
      }
      invalidateMemberCache();
      return true;
    } catch (err) {
      console.error('[API] Gagal mendaftarkan anggota baru:', err);
      throw err;
    }
  },

  /**
   * Memperbarui data anggota yang sudah terdaftar (PUT).
   */
  async updateOne(member: Member, originalNik?: string): Promise<boolean> {
    try {
      const targetNik = originalNik || member.nik;
      const payload = toApiPayload(member);
      // Saat edit individual, kirim null jika foto dikosongkan agar terhapus di database
      payload.foto_profil_url = member.fotoProfilUrl ? member.fotoProfilUrl : null;
      payload.foto_ktp_url = member.fotoKtpUrl ? member.fotoKtpUrl : null;
      payload.status_ktp_verified = Boolean(member.fotoKtpUrl);

      const res = await apiFetch<any>(`/members/${encodeURIComponent(targetNik)}`, {
        method: 'PUT',
        body: payload,
      });
      if (res && typeof res === 'object') {
        const item = res.member || res;
        member.fotoProfilUrl = item.fotoProfilUrl || undefined;
        member.fotoKtpUrl = item.fotoKtpUrl || undefined;
        member.statusKtpVerified = Boolean(item.fotoKtpUrl);
      }
      invalidateMemberCache();
      return true;
    } catch (err) {
      console.error('[API] Gagal memperbarui data anggota:', err);
      throw err;
    }
  },

  /**
   * Menyimpan anggota: jika mode edit atau originalNik tersedia, langsung panggil PUT.
   */
  async upsertOne(member: Member, originalNik?: string): Promise<boolean> {
    try {
      const targetNik = originalNik || member.nik;
      if (originalNik) {
        return await MemberService.updateOne(member, originalNik);
      }

      const payload = toApiPayload(member);
      try {
        await apiFetch('/members', { method: 'POST', body: payload });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          await apiFetch(`/members/${encodeURIComponent(targetNik)}`, { method: 'PUT', body: payload });
        } else {
          throw err;
        }
      }
      invalidateMemberCache();
      return true;
    } catch (err) {
      console.error('[API] Gagal menyimpan anggota:', err);
      return false;
    }
  },

  /**
   * Mutasi status keanggotaan (dicatat sebagai STATUS_CHANGE di audit log oleh backend).
   */
  async changeStatus(nik: string, status: string, reason: string): Promise<boolean> {
    try {
      await apiFetch(`/members/${encodeURIComponent(nik)}/status`, {
        method: 'POST',
        body: { status, reason: reason || 'Perubahan status keanggotaan' },
      });
      invalidateMemberCache();
      return true;
    } catch (err) {
      console.error('[API] Gagal mengubah status anggota:', err);
      return false;
    }
  },

  /**
   * Import / upsert massal (dipecah per chunk).
   */
  async upsertBatch(
    members: Member[],
    options?: { replaceTerritorySubOrgs?: boolean }
  ): Promise<boolean> {
    if (members.length === 0) return false;
    try {
      const payload = members.map(toApiPayload);
      let allOk = true;
      for (let i = 0; i < payload.length; i += BULK_UPSERT_CHUNK) {
        const chunk = payload.slice(i, i + BULK_UPSERT_CHUNK);
        const res = await apiFetch<{ imported: number; rejected: number; errors: any[] }>('/members/bulk', {
          method: 'POST',
          body: {
            members: chunk,
            replaceTerritorySubOrgs: i === 0 && Boolean(options?.replaceTerritorySubOrgs),
          },
        });
        if (res.rejected > 0) {
          allOk = false;
          console.warn(`[API] ${res.rejected} baris ditolak server:`, res.errors);
        }
      }
      invalidateMemberCache();
      return allOk;
    } catch (err) {
      console.error('[API] Gagal upsert massal:', err);
      return false;
    }
  },

  /**
   * Menghapus anggota secara permanen (khusus Super Admin di sisi server).
   */
  async deleteOne(nik: string): Promise<boolean> {
    try {
      await apiFetch(`/members/${encodeURIComponent(nik)}`, { method: 'DELETE' });
      invalidateMemberCache();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        invalidateMemberCache();
        return true; // sudah tidak ada
      }
      console.error('[API] Gagal menghapus anggota:', err);
      return false;
    }
  },

  /**
   * Menghapus kumpulan anggota (pembersihan data pengurus teritorial).
   */
  async deleteBatch(niks: string[]): Promise<boolean> {
    if (niks.length === 0) return false;
    try {
      for (let i = 0; i < niks.length; i += BULK_DELETE_CHUNK) {
        await apiFetch('/members/bulk-delete', {
          method: 'POST',
          body: { niks: niks.slice(i, i + BULK_DELETE_CHUNK) },
        });
      }
      invalidateMemberCache();
      return true;
    } catch (err) {
      console.error('[API] Gagal hapus massal:', err);
      return false;
    }
  },

  /**
   * Mengambil data profil lengkap milik user/kader yang sedang login.
   */
  async getMyProfile(): Promise<Member | null> {
    try {
      const res = await apiFetch<{ member: any }>('/members/me/profile');
      return res.member ? mapApiMember(res.member) : null;
    } catch (err) {
      console.error('[API] Gagal mengambil profil mandiri:', err);
      return null;
    }
  },

  /**
   * Memperbarui biodata kontak dan foto pribadi secara mandiri oleh kader/pengurus.
   */
  async updateMyProfile(data: Partial<Member>): Promise<{ success: boolean; member?: Member; error?: string }> {
    try {
      const payload = mapMemberToDbPayload(data as Member);
      delete payload.terakhir_diubah;
      delete payload.diubah_oleh;
      payload.foto_profil_url = data.fotoProfilUrl ? data.fotoProfilUrl : null;
      payload.foto_ktp_url = data.fotoKtpUrl ? data.fotoKtpUrl : null;
      payload.status_ktp_verified = Boolean(data.fotoKtpUrl);
      const res = await apiFetch<{ member: any; message?: string }>('/members/me/profile', {
        method: 'PUT',
        body: payload,
      });
      invalidateMemberCache();
      return { success: true, member: res.member ? mapApiMember(res.member) : undefined };
    } catch (err: any) {
      console.error('[API] Gagal memperbarui profil mandiri:', err);
      return { success: false, error: err?.message || 'Gagal memperbarui profil' };
    }
  },
};
