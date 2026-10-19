import { supabase } from '../config/database';
import { DeletionRequest } from '../types';
import { mapDbRowToDeletionRequest } from './mappers';

/**
 * Service untuk operasi permohonan hapus data (Deletion Requests) di Supabase
 */
export const DeletionRequestService = {
  async getAll(): Promise<DeletionRequest[]> {
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
  },

  async insert(
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

      const { data, error } = await supabase
        .from('deletion_requests')
        .insert([payload])
        .select()
        .single();
      if (error) {
        console.error('Error insertDeletionRequestToSupabase:', error);
        return null;
      }
      return mapDbRowToDeletionRequest(data);
    } catch (err) {
      console.error('Exception in insertDeletionRequestToSupabase:', err);
      return null;
    }
  },

  async update(req: DeletionRequest): Promise<boolean> {
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
  },
};
