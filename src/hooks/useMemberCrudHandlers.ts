import { useCallback } from 'react';
import { Member, MemberStatus, UserSession, AuditLog, DeletionRequest } from '../types';
import {
  saveMembers,
  loadMembers,
  loadAuditLogs,
  saveAuditLogs,
  appendAuditLog,
  loadDeletionRequests,
  saveDeletionRequests,
  resetToDefaultSeeds,
} from '../utils/storage';
import {
  isSupabaseConfigured,
  upsertSingleMemberToSupabase,
  upsertMembersToSupabase,
  deleteMemberFromSupabase,
  deleteMembersFromSupabase,
  insertAuditLogToSupabase,
  insertDeletionRequestToSupabase,
  updateDeletionRequestInSupabase,
} from '../utils/backendClient';

interface UseMemberCrudHandlersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  deletionRequests: DeletionRequest[];
  setDeletionRequests: React.Dispatch<React.SetStateAction<DeletionRequest[]>>;
  session: UserSession;
  showToast: (msg: string) => void;
}

export function useMemberCrudHandlers({
  members,
  setMembers,
  setAuditLogs,
  deletionRequests,
  setDeletionRequests,
  session,
  showToast,
}: UseMemberCrudHandlersProps) {
  // Helper untuk menambah catatan audit ke database Supabase & local storage
  const recordAuditLog = useCallback(
    async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
      // 1. Simpan ke local storage
      appendAuditLog(logData);
      setAuditLogs(loadAuditLogs());

      // 2. Simpan ke Supabase secara real-time
      if (isSupabaseConfigured()) {
        try {
          await insertAuditLogToSupabase(logData);
        } catch (err) {
          console.error('Gagal mencatat audit log ke Supabase:', err);
        }
      }
    },
    [setAuditLogs]
  );

  // 1. FITUR DAFTAR ANGGOTA BARU (Registrasi Baru)
  const handleAddMember = async (newMember: Member) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    saveMembers(updated);

    showToast(`Kader baru ${newMember.namaLengkap} (${newMember.dpd}) berhasil didaftarkan.`);

    if (isSupabaseConfigured()) {
      upsertSingleMemberToSupabase(newMember).catch((err) => {
        console.error('Gagal menyimpan kader baru ke Supabase:', err);
      });
    }

    recordAuditLog({
      memberNik: newMember.nik,
      memberName: newMember.namaLengkap,
      action: 'CREATE',
      newStatus: newMember.status,
      reason: 'Registrasi mandiri anggota baru di database.',
      actor: session.adminName,
      dpd: newMember.dpd,
    });
  };

  // 2. FITUR EDIT DATA ANGGOTA (Memperbarui data yang ada)
  const handleEditMember = async (updatedMember: Member, originalNik: string) => {
    const cleanOriginal = originalNik.replace(/[^0-9]/g, '').trim();
    const targetIndex = members.findIndex(
      (m) => m.nik === originalNik || m.nik.replace(/[^0-9]/g, '').trim() === cleanOriginal
    );

    let updated: Member[];
    if (targetIndex !== -1) {
      updated = [...members];
      updated[targetIndex] = updatedMember;
    } else {
      updated = members.map((m) => (m.nik === originalNik ? updatedMember : m));
    }

    setMembers(updated);
    saveMembers(updated);
    showToast(`Data kader ${updatedMember.namaLengkap} berhasil diperbarui.`);

    if (isSupabaseConfigured()) {
      upsertSingleMemberToSupabase(updatedMember).catch((err) => {
        console.error('Gagal memperbarui data kader di Supabase:', err);
      });
    }

    recordAuditLog({
      memberNik: updatedMember.nik,
      memberName: updatedMember.namaLengkap,
      action: 'UPDATE',
      reason: 'Pembaruan data profil anggota via formulir edit.',
      actor: session.adminName,
      dpd: updatedMember.dpd,
    });
  };

  // 3. FITUR UBAH STATUS KEANGGOTAAN
  const handleSaveStatus = async (nik: string, newStatus: MemberStatus, reason: string) => {
    const target = members.find((m) => m.nik === nik);
    if (!target) return;

    const prevStatus = target.status;
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let updatedMemberTarget: Member | null = null;
    const updated = members.map((m) => {
      if (m.nik === nik) {
        updatedMemberTarget = {
          ...m,
          status: newStatus,
          catatanMutasi: reason,
          terakhirDiubah: nowTime,
          diubahOleh: session.adminName,
        };
        return updatedMemberTarget;
      }
      return m;
    });

    setMembers(updated);
    saveMembers(updated);

    if (updatedMemberTarget && isSupabaseConfigured()) {
      upsertSingleMemberToSupabase(updatedMemberTarget).catch((err) => {
        console.error('Gagal update status di Supabase:', err);
      });
    }

    recordAuditLog({
      memberNik: target.nik,
      memberName: target.namaLengkap,
      action: 'STATUS_CHANGE',
      previousStatus: prevStatus,
      newStatus,
      reason,
      actor: session.adminName,
      dpd: target.dpd,
    });

    if (newStatus !== 'Aktif') {
      showToast(`Status ${target.namaLengkap} diubah ke ${newStatus}. Dikeluarkan dari hitungan aktif.`);
    } else {
      showToast(`Status ${target.namaLengkap} diaktifkan kembali.`);
    }
  };

  // 4. FITUR SIMPAN PERUBAHAN MATRIKS STRUKTUR TERITORIAL (DPW, DPD, DPC, DPRT)
  const getMemberPositionKey = useCallback((m: Member): string => {
    if (m.id) return m.id;
    const cleanT = (m.tingkatKepengurusan || 'ANGGOTA').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanD = (m.dpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanS = (m.wilayahPenugasan || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `${m.nik}_${cleanT}_${cleanD}_${cleanS}`;
  }, []);

  const handleBatchSaveTerritorialMembers = async (incomingMembers: Member[]) => {
    if (incomingMembers.length === 0) return;

    const membersMap = new Map<string, Member>();
    members.forEach((m) => membersMap.set(getMemberPositionKey(m), m));

    incomingMembers.forEach((inc) => {
      const key = getMemberPositionKey(inc);
      const existing = membersMap.get(key);
      membersMap.set(key, {
        ...(existing || {}),
        ...inc,
        id: inc.id || key,
      });
    });

    const combined = Array.from(membersMap.values());
    setMembers(combined);
    saveMembers(combined);

    showToast(`Berhasil menyimpan ${incomingMembers.length} pengurus struktur teritorial.`);

    if (isSupabaseConfigured()) {
      upsertMembersToSupabase(incomingMembers).catch((e) =>
        console.error('Gagal sync pengurus teritorial ke Supabase:', e)
      );
    }

    recordAuditLog({
      memberNik: 'MATRIKS-TERITORIAL',
      memberName: `${incomingMembers.length} Pengurus Teritorial`,
      action: 'UPDATE',
      newStatus: 'Aktif',
      reason: `Pembaruan data susunan jabatan pengurus teritorial (${incomingMembers.length} posisi).`,
      actor: session.adminName,
      dpd: incomingMembers[0]?.dpd || 'Sulawesi Utara',
    });
  };

  // 4b. FITUR HAPUS SEMUA DATA PENGURUS TERITORIAL (RESET / BERSIHKAN DATA WILAYAH TERTENTU)
  const handleBatchDeleteTerritorialMembers = async (niksToDelete: string[], territoryLabel: string) => {
    if (niksToDelete.length === 0) return;

    const toDeleteSet = new Set(niksToDelete);
    const remainingMembers = members.filter((m) => {
      const key = getMemberPositionKey(m);
      if (toDeleteSet.has(key) || (m.id && toDeleteSet.has(m.id))) {
        return false;
      }
      if (toDeleteSet.has(m.nik)) {
        const tLower = territoryLabel.toLowerCase();
        if (tLower.includes('dpd') && m.tingkatKepengurusan === 'DPD') return false;
        if (tLower.includes('dpc') && m.tingkatKepengurusan === 'DPC') return false;
        if (tLower.includes('dprt') && m.tingkatKepengurusan === 'DPRt') return false;
        if (tLower.includes('dpw') && m.tingkatKepengurusan === 'DPW') return false;
      }
      return true;
    });
    setMembers(remainingMembers);
    saveMembers(remainingMembers);

    showToast(`Berhasil menghapus ${niksToDelete.length} data pengurus untuk ${territoryLabel}.`);

    if (isSupabaseConfigured()) {
      deleteMembersFromSupabase(niksToDelete).catch((e) =>
        console.error('Gagal hapus pengurus teritorial dari Supabase:', e)
      );
    }

    recordAuditLog({
      memberNik: 'DELETE-TERITORIAL',
      memberName: `${niksToDelete.length} Pengurus ${territoryLabel}`,
      action: 'DELETE',
      reason: `Penghapusan/pembersihan seluruh data pengurus teritorial ${territoryLabel} (${niksToDelete.length} data) sebelum import ulang.`,
      actor: session.adminName,
      dpd: territoryLabel,
    });
  };

  // 5. FITUR IMPORT MASSAL DARI SPREADSHEET EXCEL
  const handleImportSuccess = async (newMembers: Member[], count: number) => {
    const combined = [...newMembers, ...members];
    setMembers(combined);
    saveMembers(combined);

    showToast(`${count} kader berhasil diimpor massal ke Shadow Database.`);

    if (isSupabaseConfigured()) {
      upsertMembersToSupabase(newMembers).catch((e) =>
        console.error('Gagal upload massal ke Supabase:', e)
      );
    }

    recordAuditLog({
      memberNik: 'MASS-UPLOAD',
      memberName: `${count} Anggota Daerah`,
      action: 'IMPORT_MASSAL',
      newStatus: 'Aktif',
      reason: `Import massal berkas spreadsheet oleh ${session.adminName}.`,
      actor: session.adminName,
      dpd: session.dpdAccess === 'ALL' ? 'Sulawesi Utara' : session.dpdAccess,
    });
  };

  // 6. FITUR SINKRONISASI IDENTITAS & KTA
  const handleBatchUpdateMembers = async (updated: Member[]) => {
    setMembers(updated);
    saveMembers(updated);
    showToast('Standardisasi Nomor e-KTA Pusat berhasil disimpan.');

    if (isSupabaseConfigured()) {
      upsertMembersToSupabase(updated).catch((e) =>
        console.error('Gagal sinkronisasi nomor KTA ke Supabase:', e)
      );
    }
  };

  // 7. HAPUS ANGGOTA SECARA LANGSUNG (SUPER ADMIN DPW)
  const handleDirectDeleteMember = async (member: Member) => {
    if (session.role !== 'SUPER_ADMIN') {
      alert('Hanya Super Admin DPW yang memiliki hak menghapus data kader secara langsung.');
      return;
    }
    if (
      window.confirm(
        `HAPUS PERMANEN:\nApakah Anda yakin ingin menghapus data kader ${member.namaLengkap} (NIK: ${member.nik}) dari database Partai NasDem?`
      )
    ) {
      const updated = members.filter((m) => m.nik !== member.nik);
      setMembers(updated);
      saveMembers(updated);

      showToast(`Data kader ${member.namaLengkap} berhasil dihapus permanen.`);

      if (isSupabaseConfigured()) {
        deleteMemberFromSupabase(member.nik).catch((err) => {
          console.error('Gagal menghapus anggota dari Supabase:', err);
        });
      }

      recordAuditLog({
        memberNik: member.nik,
        memberName: member.namaLengkap,
        action: 'DELETE',
        reason: 'Penghapusan permanen langsung oleh Super Admin DPW Partai NasDem Sulut.',
        actor: session.adminName,
        dpd: member.dpd,
      });
    }
  };

  // 8. ALUR PERMOHONAN HAPUS (ADMIN DAERAH PENGAJUAN KE DPW)
  const handleSubmitDeletionRequest = async (member: Member, reason: string) => {
    const payload = {
      memberNik: member.nik,
      memberName: member.namaLengkap,
      memberNomorEKTA: member.nomorEKTA,
      dpd: member.dpd,
      dpc: member.dpc,
      dprt: member.dprt,
      statusMember: member.status,
      requestedByRole: session.role,
      requestedByName: session.adminName,
      reason,
    };

    const newLocalReq = {
      ...payload,
      id: `del-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'PENDING' as const,
    };
    const updatedList = [newLocalReq, ...deletionRequests];
    setDeletionRequests(updatedList);
    saveDeletionRequests(updatedList);

    if (isSupabaseConfigured()) {
      insertDeletionRequestToSupabase(payload).catch((err) => {
        console.error('Gagal mengirim permohonan hapus ke Supabase:', err);
      });
    }

    recordAuditLog({
      memberNik: member.nik,
      memberName: member.namaLengkap,
      action: 'DELETE_REQUEST',
      reason: `Permohonan penghapusan kader diajukan oleh ${session.jabatan}: "${reason}"`,
      actor: session.adminName,
      dpd: member.dpd,
    });

    showToast(`Permohonan penghapusan kader ${member.namaLengkap} berhasil dikirim ke DPW.`);
  };

  // 9. APPROVAL PERMOHONAN HAPUS (SUPER ADMIN DPW MENYETUJUI)
  const handleApproveDeletionRequest = async (requestId: string, notes?: string) => {
    const target = deletionRequests.find((r) => r.id === requestId);
    if (!target) return;

    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedReq: DeletionRequest = {
      ...target,
      status: 'APPROVED',
      reviewedBy: session.adminName,
      reviewedAt: nowTime,
      reviewNotes: notes,
    };

    const newReqList = deletionRequests.map((r) => (r.id === requestId ? updatedReq : r));
    setDeletionRequests(newReqList);
    saveDeletionRequests(newReqList);

    const updatedMembers = members.filter((m) => m.nik !== target.memberNik);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    if (isSupabaseConfigured()) {
      updateDeletionRequestInSupabase(updatedReq).catch((err) =>
        console.error('Gagal update status deletion request di Supabase:', err)
      );
      deleteMemberFromSupabase(target.memberNik).catch((err) =>
        console.error('Gagal delete member dari Supabase:', err)
      );
    }

    recordAuditLog({
      memberNik: target.memberNik,
      memberName: target.memberName,
      action: 'DELETE',
      reason: `Disetujui oleh DPW atas permohonan ${target.requestedByName}. Alasan: "${target.reason}". Catatan DPW: "${notes || '-'}"`,
      actor: session.adminName,
      dpd: target.dpd,
    });

    showToast(`Permohonan disetujui. Data kader ${target.memberName} telah dihapus permanen.`);
  };

  // 10. REJECT PERMOHONAN HAPUS (SUPER ADMIN DPW MENOLAK)
  const handleRejectDeletionRequest = async (requestId: string, notes: string) => {
    const target = deletionRequests.find((r) => r.id === requestId);
    if (!target) return;

    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedReq: DeletionRequest = {
      ...target,
      status: 'REJECTED',
      reviewedBy: session.adminName,
      reviewedAt: nowTime,
      reviewNotes: notes,
    };

    const newReqList = deletionRequests.map((r) => (r.id === requestId ? updatedReq : r));
    setDeletionRequests(newReqList);
    saveDeletionRequests(newReqList);

    if (isSupabaseConfigured()) {
      updateDeletionRequestInSupabase(updatedReq).catch((err) =>
        console.error('Gagal update status deletion request di Supabase:', err)
      );
    }

    recordAuditLog({
      memberNik: target.memberNik,
      memberName: target.memberName,
      action: 'DELETE_REQUEST',
      reason: `Permohonan penghapusan kader ${target.memberName} ditolak DPW. Alasan: "${notes}"`,
      actor: session.adminName,
      dpd: target.dpd,
    });

    showToast(`Permohonan penghapusan kader ${target.memberName} ditolak.`);
  };

  // 11. RESET DEMO DATA
  const handleResetDemoData = () => {
    if (window.confirm('Reset database ke data awal DPW Partai NasDem Sulawesi Utara?')) {
      resetToDefaultSeeds();
      const fresh = loadMembers();
      setMembers(fresh);
      setAuditLogs(loadAuditLogs());
      setDeletionRequests(loadDeletionRequests());
      showToast('Database berhasil di-reset.');
    }
  };

  return {
    recordAuditLog,
    handleAddMember,
    handleEditMember,
    handleSaveStatus,
    getMemberPositionKey,
    handleBatchSaveTerritorialMembers,
    handleBatchDeleteTerritorialMembers,
    handleImportSuccess,
    handleBatchUpdateMembers,
    handleDirectDeleteMember,
    handleSubmitDeletionRequest,
    handleApproveDeletionRequest,
    handleRejectDeletionRequest,
    handleResetDemoData,
  };
}
