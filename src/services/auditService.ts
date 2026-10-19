import { supabase } from '../config/database';
import { AuditLog } from '../types';
import { mapDbRowToAuditLog } from './mappers';

/**
 * Service untuk operasi catatan riwayat audit (Audit Logs) di Supabase
 */
export const AuditService = {
  async getAll(): Promise<AuditLog[]> {
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
  },

  async insert(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog | null> {
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
  },
};
