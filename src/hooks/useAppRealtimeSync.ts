import { useEffect, useCallback } from 'react';
import { Member, AuditLog, DeletionRequest } from '../types';
import { saveMembers, saveAuditLogs, saveDeletionRequests } from '../utils/storage';
import {
  getMembersFromSupabase,
  getAuditLogsFromSupabase,
  getDeletionRequestsFromSupabase,
  subscribeToAllRealtime,
} from '../utils/backendClient';

interface UseAppRealtimeSyncProps {
  isAuthenticated: boolean;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  setDeletionRequests: React.Dispatch<React.SetStateAction<DeletionRequest[]>>;
  setIsCloudConnected: (connected: boolean) => void;
  setIsRealtimeActive: (active: boolean) => void;
}

export function useAppRealtimeSync({
  isAuthenticated,
  setMembers,
  setAuditLogs,
  setDeletionRequests,
  setIsCloudConnected,
  setIsRealtimeActive,
}: UseAppRealtimeSyncProps) {
  // 1. Initial Load from Supabase / Backend (Members, Audit Logs, Deletion Requests)
  const loadInitialCloudData = useCallback(async () => {
    try {
      const [cloudMembers, cloudLogs, cloudRequests] = await Promise.all([
        getMembersFromSupabase(),
        getAuditLogsFromSupabase(),
        getDeletionRequestsFromSupabase(),
      ]);

      if (Array.isArray(cloudMembers)) {
        setMembers(cloudMembers);
        saveMembers(cloudMembers);
      }
      if (Array.isArray(cloudLogs)) {
        setAuditLogs(cloudLogs);
        saveAuditLogs(cloudLogs);
      }
      if (Array.isArray(cloudRequests)) {
        setDeletionRequests(cloudRequests);
        saveDeletionRequests(cloudRequests);
      }

      setIsCloudConnected(true);
    } catch (err) {
      console.error('Gagal sinkronisasi data dengan backend/Supabase:', err);
    }
  }, [setMembers, setAuditLogs, setDeletionRequests, setIsCloudConnected]);

  // 2. Realtime WebSocket / Polling Subscription on all 3 tables
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      loadInitialCloudData();
    }

    const unsubscribe = subscribeToAllRealtime({
      onMemberChange: (eventType, payload) => {
        if (!isMounted) return;
        setIsRealtimeActive(true);

        setMembers((prev) => {
          let updated: Member[];
          if (eventType === 'DELETE') {
            const deleteNik = (payload as { nik: string }).nik;
            updated = prev.filter((m) => m.nik !== deleteNik);
          } else if (eventType === 'INSERT') {
            const newMember = payload as Member;
            const exists = prev.some((m) => m.nik === newMember.nik);
            if (exists) {
              updated = prev.map((m) => (m.nik === newMember.nik ? newMember : m));
            } else {
              updated = [newMember, ...prev];
            }
          } else {
            // UPDATE
            const updatedMember = payload as Member;
            const exists = prev.some((m) => m.nik === updatedMember.nik);
            if (exists) {
              updated = prev.map((m) => (m.nik === updatedMember.nik ? updatedMember : m));
            } else {
              updated = [updatedMember, ...prev];
            }
          }
          saveMembers(updated);
          return updated;
        });
      },

      onAuditLogInsert: (newLog) => {
        if (!isMounted) return;
        setIsRealtimeActive(true);

        setAuditLogs((prev) => {
          if (prev.some((l) => l.id === newLog.id)) return prev;
          const updated = [newLog, ...prev];
          saveAuditLogs(updated);
          return updated;
        });
      },

      onDeletionRequestChange: (eventType, payload) => {
        if (!isMounted) return;
        setIsRealtimeActive(true);

        setDeletionRequests((prev) => {
          let updated: DeletionRequest[];
          if (eventType === 'DELETE') {
            const deleteId = (payload as { id: string }).id;
            updated = prev.filter((r) => r.id !== deleteId);
          } else if (eventType === 'INSERT') {
            const newReq = payload as DeletionRequest;
            if (prev.some((r) => r.id === newReq.id)) return prev;
            updated = [newReq, ...prev];
          } else {
            // UPDATE
            const updatedReq = payload as DeletionRequest;
            updated = prev.map((r) => (r.id === updatedReq.id ? updatedReq : r));
          }
          saveDeletionRequests(updated);
          return updated;
        });
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthenticated, loadInitialCloudData, setMembers, setAuditLogs, setDeletionRequests, setIsRealtimeActive]);

  return { loadInitialCloudData };
}
