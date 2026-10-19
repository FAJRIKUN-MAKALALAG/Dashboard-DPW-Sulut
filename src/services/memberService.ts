import { supabase } from '../config/database';
import { Member } from '../types';
import { mapMemberToDbPayload, mapDbRowToMember } from './mappers';

/**
 * Service untuk operasi database anggota (Members) di Supabase
 */
export const MemberService = {
  /**
   * Mengambil seluruh data anggota dari tabel Supabase
   */
  async getAll(): Promise<Member[] | null> {
    if (!supabase) return null;
    try {
      let allRows: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error, status } = await supabase
          .from('members')
          .select('*')
          .order('nama_lengkap', { ascending: true })
          .range(from, to);

        if (error) {
          if (error.code === 'PGRST205' || status === 404 || error.message?.includes('schema cache')) {
            console.warn('[Supabase] Tabel "public.members" belum aktif.');
            return [];
          }
          console.warn('Peringatan membaca data Supabase:', error.message || error);
          break;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      return allRows.map(mapDbRowToMember);
    } catch (err) {
      console.error('Supabase getMembers query failed:', err);
      return null;
    }
  },

  /**
   * Menyimpan / memperbarui 1 orang anggota secara realtime ke Supabase
   */
  async upsertOne(member: Member): Promise<boolean> {
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
  },

  /**
   * Menyimpan / memperbarui daftar anggota ke Supabase secara massal (Batch Upsert)
   */
  async upsertBatch(members: Member[]): Promise<boolean> {
    if (!supabase || members.length === 0) return false;
    try {
      const payload = members.map(mapMemberToDbPayload);
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
  },

  /**
   * Menghapus data anggota dari Supabase secara permanen
   */
  async deleteOne(nik: string): Promise<boolean> {
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
  },

  /**
   * Menghapus kumpulan anggota dari Supabase secara massal (Batch Delete)
   */
  async deleteBatch(niks: string[]): Promise<boolean> {
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
  },
};
