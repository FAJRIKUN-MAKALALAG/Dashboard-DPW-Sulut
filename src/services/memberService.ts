import { Member } from '../types';
import { mapMemberToDbPayload } from './mappers';
import { mapApiMember } from './apiMappers';
import { apiFetch, ApiError } from './http';

interface MemberListResponse {
  items: any[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const FETCH_PAGE_SIZE = 500; // batas MAX_PAGE_SIZE di backend
const PARALLEL_PAGES = 4;
const BULK_UPSERT_CHUNK = 500;
const BULK_DELETE_CHUNK = 1000;

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
  /**
   * Mengambil seluruh data anggota (sesuai cakupan wilayah akun) dengan paginasi dari server.
   */
  async getAll(): Promise<Member[] | null> {
    try {
      const first = await apiFetch<MemberListResponse>('/members', {
        query: { page: 1, per_page: FETCH_PAGE_SIZE },
      });
      const rows: any[] = [...first.items];

      const remaining: number[] = [];
      for (let p = 2; p <= first.totalPages; p++) remaining.push(p);

      for (let i = 0; i < remaining.length; i += PARALLEL_PAGES) {
        const batch = remaining.slice(i, i + PARALLEL_PAGES);
        const pages = await Promise.all(
          batch.map((page) =>
            apiFetch<MemberListResponse>('/members', { query: { page, per_page: FETCH_PAGE_SIZE } })
          )
        );
        pages.forEach((pg) => rows.push(...pg.items));
      }

      console.log(`[API] Berhasil menarik ${rows.length} data anggota dari backend.`);
      return rows.map(mapApiMember);
    } catch (err) {
      console.error('[API] Gagal menarik data anggota:', err);
      return null;
    }
  },

  /**
   * Mengambil 1 anggota berdasarkan NIK (tanpa foto). Null jika tidak ada / di luar cakupan.
   */
  async getByNik(nik: string): Promise<Member | null> {
    try {
      const res = await apiFetch<MemberListResponse>('/members', {
        query: { q: nik, search_by: 'nik', per_page: 1 },
      });
      const found = res.items.find((i) => i.nik === nik);
      return found ? mapApiMember(found) : null;
    } catch {
      return null;
    }
  },

  /**
   * Menyimpan anggota: daftar baru (POST), atau perbarui bila NIK sudah ada (PUT).
   */
  async upsertOne(member: Member): Promise<boolean> {
    try {
      const payload = toApiPayload(member);
      try {
        await apiFetch('/members', { method: 'POST', body: payload });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          await apiFetch(`/members/${encodeURIComponent(payload.nik)}`, { method: 'PUT', body: payload });
        } else {
          throw err;
        }
      }
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
      return true;
    } catch (err) {
      console.error('[API] Gagal mengubah status anggota:', err);
      return false;
    }
  },

  /**
   * Import / upsert massal (dipecah per chunk).
   */
  async upsertBatch(members: Member[]): Promise<boolean> {
    if (members.length === 0) return false;
    try {
      const payload = members.map(toApiPayload);
      let allOk = true;
      for (let i = 0; i < payload.length; i += BULK_UPSERT_CHUNK) {
        const chunk = payload.slice(i, i + BULK_UPSERT_CHUNK);
        const res = await apiFetch<{ imported: number; rejected: number; errors: any[] }>('/members/bulk', {
          method: 'POST',
          body: { members: chunk },
        });
        if (res.rejected > 0) {
          allOk = false;
          console.warn(`[API] ${res.rejected} baris ditolak server:`, res.errors);
        }
      }
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
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return true; // sudah tidak ada
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
      return true;
    } catch (err) {
      console.error('[API] Gagal hapus massal:', err);
      return false;
    }
  },
};
