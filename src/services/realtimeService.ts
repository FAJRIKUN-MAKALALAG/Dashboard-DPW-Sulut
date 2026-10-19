import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/database';
import { Member, AuditLog, DeletionRequest } from '../types';
import { mapDbRowToMember, mapDbRowToAuditLog, mapDbRowToDeletionRequest } from './mappers';

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
    supabase?.removeChannel(channel);
  };
}
