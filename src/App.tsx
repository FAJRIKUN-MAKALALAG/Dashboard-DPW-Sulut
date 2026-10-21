import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Member, MemberStatus, UserSession, AuditLog, DeletionRequest } from './types';
import {
  loadMembers,
  saveMembers,
  loadAuditLogs,
  saveAuditLogs,
  appendAuditLog,
  loadSession,
  saveSession,
  resetToDefaultSeeds,
  loadDeletionRequests,
  saveDeletionRequests,
} from './utils/storage';
import {
  isSupabaseConfigured,
  getMembersFromSupabase,
  upsertSingleMemberToSupabase,
  upsertMembersToSupabase,
  deleteMemberFromSupabase,
  deleteMembersFromSupabase,
  getAuditLogsFromSupabase,
  insertAuditLogToSupabase,
  getDeletionRequestsFromSupabase,
  insertDeletionRequestToSupabase,
  updateDeletionRequestInSupabase,
  subscribeToAllRealtime,
  getToken,
  clearToken,
  AUTH_EXPIRED_EVENT,
} from './utils/backendClient';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { MemberManagement } from './components/MemberManagement';
import { SyncIdReconciliation } from './components/SyncIdReconciliation';
import {
  AddMemberModal,
  EditMemberModal,
  MemberDetailModal,
  EKtaCardModal,
  BulkImportModal,
  StatusChangeModal,
  DeletionRequestModal,
  DeletionApprovalModal,
  RoleSwitcherModal,
  AuditTrailModal,
  ExecutiveReportPrintModal,
  UserManagementModal,
} from './components/modals';
import { AppSidebar, MainNavTab } from './components/layout/AppSidebar';
import { TerritorialStructurePage } from './components/TerritorialStructurePage';
import { TemplateDownloadHubModal } from './components/territorial/TemplateDownloadHubModal';
import { ReferralHubModal } from './components/referral/ReferralHubModal';
import { isJobTitleMatch, normalizeSubOrgName } from './utils/jobMatchingUtils';
import { isDpdMatch, isDpcMatch, isDprtMatch } from './utils/structureReadinessUtils';
import { LoginPage } from './components/LoginPage';
import {
  Printer,
  RotateCcw,
  CheckCircle2,
  Sun,
  Moon,
  Menu,
  Radio,
  ArrowLeft,
  Download,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadAuditLogs());
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(() =>
    loadDeletionRequests()
  );
  const [session, setSession] = useState<UserSession>(() => loadSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nasdem_sulut_authenticated') === 'true' && Boolean(getToken());
  });
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // ============================================================================
  // 1. Initial Load from Supabase (Members, Audit Logs, Deletion Requests)
  const loadInitialCloudData = useCallback(async () => {
    try {
      const [cloudMembers, cloudLogs, cloudRequests] = await Promise.all([
        getMembersFromSupabase(),
        getAuditLogsFromSupabase(),
        getDeletionRequestsFromSupabase(),
      ]);

      if (cloudMembers && cloudMembers.length > 0) {
        setMembers(cloudMembers);
        saveMembers(cloudMembers);
      }
      if (cloudLogs && cloudLogs.length > 0) {
        setAuditLogs(cloudLogs);
        saveAuditLogs(cloudLogs);
      }
      if (cloudRequests && cloudRequests.length > 0) {
        setDeletionRequests(cloudRequests);
        saveDeletionRequests(cloudRequests);
      }

      setIsCloudConnected(true);
    } catch (err) {
      console.error('Gagal sinkronisasi data dengan backend/Supabase:', err);
    }
  }, []);

  // ============================================================================
  // REALTIME DATABASE SYNCHRONIZATION (SUPABASE LIVE + WEBSOCKETS / POLLING)
  // ============================================================================
  useEffect(() => {
    let isMounted = true;

    // Muat data jika user sudah terautentikasi
    if (isAuthenticated) {
      loadInitialCloudData();
    }

    // 2. Realtime WebSocket Subscription on all 3 tables
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
  }, [isAuthenticated, loadInitialCloudData]);

  // 1b. Manual Cloud Sync Trigger (Tarik & Perbarui Data Langsung dari Supabase)
  const handleRefreshFromSupabase = async () => {
    setIsRefreshingCloud(true);
    showToast('Sedang menarik seluruh data terbaru dari database Supabase...');
    try {
      const cloudMembers = await getMembersFromSupabase();
      if (cloudMembers !== null) {
        setMembers(cloudMembers);
        saveMembers(cloudMembers);
        showToast(`✅ Berhasil menarik ${cloudMembers.length} data kader langsung dari Supabase live!`);
      } else {
        showToast('⚠️ Gagal menarik data dari Supabase / Backend. Pastikan backend aktif.');
      }
    } catch (e: any) {
      console.error('Error saat refresh cloud:', e);
      showToast(`⚠️ Terjadi kesalahan: ${e.message || e}`);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    saveSession(userSession);
    setIsAuthenticated(true);
    localStorage.setItem('nasdem_sulut_authenticated', 'true');
    showToast(`Selamat datang, ${userSession.adminName}`);
    loadInitialCloudData();
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('nasdem_sulut_authenticated');
      clearToken();
      showToast('⚠️ Sesi login telah berakhir atau belum terautentikasi. Silakan masuk kembali.');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [showToast]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nasdem_sulut_authenticated');
    clearToken();
  };

  // Theme state: default to 'light' for natural white background, with full toggle to 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sulut_ekta_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sulut_ekta_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Filter overrides when navigating from dashboard
  const [navDpdFilter, setNavDpdFilter] = useState<string | undefined>(undefined);
  const [navStatusFilter, setNavStatusFilter] = useState<MemberStatus | undefined>(undefined);
  const [navMembershipFilter, setNavMembershipFilter] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');

  // Modals state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isTemplateHubOpen, setIsTemplateHubOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Initial territory selector for territorial pages
  const [matrixInitialDpd, setMatrixInitialDpd] = useState<string | undefined>(undefined);
  const [matrixInitialDpc, setMatrixInitialDpc] = useState<string | undefined>(undefined);

  // Deletion requests state & modals
  const [isDeletionApprovalOpen, setIsDeletionApprovalOpen] = useState(false);
  const [isDeletionRequestOpen, setIsDeletionRequestOpen] = useState(false);
  const [deletionTargetMember, setDeletionTargetMember] = useState<Member | null>(null);

  // User Management modal (Super Admin exclusive)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Referral Hub Modal (Kode Referral & Rekrutmen Pengurus)
  const [isReferralHubOpen, setIsReferralHubOpen] = useState(false);

  const pendingDeletionCount = deletionRequests.filter((r) => r.status === 'PENDING').length;

  // Isolasi Data: Hak Akses Teritorial & Peran (Super Admin, DPW, DPD, DPC, DPRt)
  const accessibleMembers = useMemo(() => {
    if (!session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return members;
    }
    return members.filter((m) => {
      // 1. DPD level filter
      if (session.dpdAccess && session.dpdAccess !== 'ALL') {
        if (!isDpdMatch(m.dpd, session.dpdAccess)) {
          return false;
        }
      }
      // 2. DPC level filter
      if (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') {
        if (session.dpcAccess && session.dpcAccess !== 'ALL') {
          if (!isDpcMatch(m.dpc, session.dpcAccess)) {
            return false;
          }
        }
      }
      // 3. DPRt level filter
      if (session.role === 'ADMIN_DPRT') {
        if (session.dprtAccess && session.dprtAccess !== 'ALL') {
          if (!isDprtMatch(m.dprt, session.dprtAccess)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [members, session]);

  // Tab Guard: Cegah akses ke tingkatan kepengurusan di luar kewenangan peran
  useEffect(() => {
    if (session?.role !== 'SUPER_ADMIN' && session?.role !== 'ADMIN_DPW') {
      if (activeTab === 'dpw') {
        setActiveTab('dashboard');
      }
    }
    if (session?.role === 'ADMIN_DPC') {
      if (activeTab === 'dpw' || activeTab === 'dpd') {
        setActiveTab('dpc');
      }
    }
    if (session?.role === 'ADMIN_DPRT') {
      if (activeTab === 'dpw' || activeTab === 'dpd' || activeTab === 'dpc') {
        setActiveTab('dprt');
      }
    }
  }, [session?.role, activeTab]);

  // Helper untuk menambah catatan audit ke database Supabase & local storage
  const recordAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
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
  };

  // ============================================================================
  // DATABASE ACTIONS (CRUD TERHUBUNG SUPABASE & REALTIME)
  // ============================================================================

  // 1. FITUR DAFTAR ANGGOTA BARU (Registrasi Baru)
  const handleAddMember = async (newMember: Member) => {
    // Optimistic UI Update
    const updated = [newMember, ...members];
    setMembers(updated);
    saveMembers(updated);

    showToast(`Kader baru ${newMember.namaLengkap} (${newMember.dpd}) berhasil didaftarkan.`);

    // Realtime Supabase Write
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

    // Realtime Supabase Write
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
  const handleBatchSaveTerritorialMembers = async (incomingMembers: Member[]) => {
    if (incomingMembers.length === 0) return;

    const membersMap = new Map<string, Member>();
    // Masukkan data lama
    members.forEach((m) => membersMap.set(m.nik, m));

    // Timpa / tambahkan data pengurus baru yang diedit (tanpa menghapus data anggota lain)
    incomingMembers.forEach((inc) => {
      const existing = membersMap.get(inc.nik);
      membersMap.set(inc.nik, {
        ...(existing || {}),
        ...inc,
      });
    });

    const combined = Array.from(membersMap.values());
    setMembers(combined);
    saveMembers(combined);

    showToast(`Berhasil menyimpan ${incomingMembers.length} pengurus struktur teritorial.`);

    // Realtime Supabase Batch Upsert
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
    const remainingMembers = members.filter((m) => !toDeleteSet.has(m.nik));
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

    // Realtime Supabase Batch Upsert
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

      // Realtime Supabase Delete
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
  const handleOpenDeletionRequest = (member: Member) => {
    setDeletionTargetMember(member);
    setIsDeletionRequestOpen(true);
  };

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

    // 1. Simpan ke local storage
    const newLocalReq = {
      ...payload,
      id: `del-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'PENDING' as const,
    };
    const updatedList = [newLocalReq, ...deletionRequests];
    setDeletionRequests(updatedList);
    saveDeletionRequests(updatedList);

    // 2. Simpan ke Supabase
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

    // Hapus anggota dari daftar
    const updatedMembers = members.filter((m) => m.nik !== target.memberNik);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    // Realtime Supabase Update & Delete
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

  const handleSelectSession = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    showToast(`Beralih ke peran: ${newSession.jabatan}`);
  };

  const handleNavigateFromDashboard = (
    filterDpd?: string,
    filterStatus?: MemberStatus,
    filterMembership: 'ALL' | 'PENGURUS' | 'ANGGOTA' = 'ALL'
  ) => {
    setNavDpdFilter(filterDpd);
    setNavStatusFilter(filterStatus);
    setNavMembershipFilter(filterMembership);
    setActiveTab('members');
  };

  // If not logged in, display full LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans transition-colors duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-amber-500/80 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        session={session}
        totalMembersCount={accessibleMembers.length}
        auditLogsCount={auditLogs.length}
        pendingDeletionCount={pendingDeletionCount}
        isCloudConnected={isCloudConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenDeletionApproval={() => setIsDeletionApprovalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenReferralHub={() => setIsReferralHubOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Viewport Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Minimalist Top Bar: Mobile Hamburger + Breadcrumb + Quick Tools */}
        <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Buka Navigasi Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeTab !== 'dashboard' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mr-1"
                title="Kembali ke Dashboard Utama"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Menu &raquo;
              </span>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {activeTab === 'dashboard' && 'Dashboard Eksekutif'}
                {activeTab === 'dpw' && 'Susunan Pengurus DPW Sulut'}
                {activeTab === 'dpd' && 'Susunan Pengurus DPD Kab/Kota'}
                {activeTab === 'dpc' && 'Susunan Pengurus DPC Kecamatan'}
                {activeTab === 'dprt' && 'Susunan Pengurus DPRt Ranting Desa'}
                {activeTab === 'members' && 'Database Seluruh Kader Daerah'}
                {activeTab === 'sync' && 'Sinkronisasi Nomor KTA & NIK'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCloudConnected && (
              <div
                title="Terhubung ke Cloud Database Supabase Realtime Live"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs"
              >
                <Radio className={`w-3.5 h-3.5 text-emerald-500 ${isRealtimeActive ? 'animate-pulse' : ''}`} />
                <span>Supabase Realtime Live</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="btn-white p-2 rounded-xl text-xs font-medium cursor-pointer"
              title={theme === 'light' ? 'Mode Malam' : 'Mode Terang'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={() => setIsReferralHubOpen(true)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer shadow-2xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="Pusat Kode Referral & Rekrutmen Kader Partai NasDem Sulut"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Kode Referral</span>
            </button>

            <button
              onClick={() => setIsTemplateHubOpen(true)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Pusat Unduh Template Excel Resmi Partai NasDem (DPW, DPD, DPC, DPRt)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Unduh Template Excel</span>
              <span className="sm:hidden">Template</span>
            </button>

            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="btn-white hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer shadow-2xs text-blue-600 dark:text-blue-400"
              title="Cetak Laporan PDF Ringkasan Atasan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Laporan PDF</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab 1: Executive Dashboard */}
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              members={accessibleMembers}
              session={session}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
              onOpenUserManagement={() => setIsUserManagementOpen(true)}
              onOpenDownloadTemplate={() => setIsTemplateHubOpen(true)}
              onOpenReferralHub={() => setIsReferralHubOpen(true)}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onNavigateToMembers={handleNavigateFromDashboard}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onAddMembers={(newMembers) => {
                handleImportSuccess(newMembers, newMembers.length);
              }}
              onOpenTerritorialMatrix={(dpd, dpc, level) => {
                if (level === 'DPW') {
                  setActiveTab('dpw');
                } else if (level === 'DPRt') {
                  if (dpd) setMatrixInitialDpd(dpd);
                  if (dpc) setMatrixInitialDpc(dpc);
                  setActiveTab('dprt');
                } else if (level === 'DPC' || dpc) {
                  if (dpd) setMatrixInitialDpd(dpd);
                  if (dpc) setMatrixInitialDpc(dpc);
                  setActiveTab('dpc');
                } else if (level === 'DPD' || dpd) {
                  if (dpd) setMatrixInitialDpd(dpd);
                  setActiveTab('dpd');
                } else {
                  setActiveTab('dpd');
                }
              }}
            />
          )}

          {/* Tab 2: Pengurus DPW (HANYA SUPER ADMIN & ADMIN DPW) */}
          {activeTab === 'dpw' && (session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW') && (
            <TerritorialStructurePage
              level="DPW"
              members={accessibleMembers}
              session={session}
              onSaveMembersBatch={handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 3: Pengurus DPD */}
          {activeTab === 'dpd' && (
            <TerritorialStructurePage
              level="DPD"
              members={accessibleMembers}
              session={session}
              initialDpd={matrixInitialDpd}
              onSaveMembersBatch={handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 4: Pengurus DPC */}
          {activeTab === 'dpc' && (
            <TerritorialStructurePage
              level="DPC"
              members={accessibleMembers}
              session={session}
              initialDpd={matrixInitialDpd}
              initialDpc={matrixInitialDpc}
              onSaveMembersBatch={handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 5: Pengurus DPRt */}
          {activeTab === 'dprt' && (
            <TerritorialStructurePage
              level="DPRt"
              members={accessibleMembers}
              session={session}
              initialDpd={matrixInitialDpd}
              initialDpc={matrixInitialDpc}
              onSaveMembersBatch={handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 6: Member Management */}
          {activeTab === 'members' && (
            <MemberManagement
              members={accessibleMembers}
              session={session}
              initialDpdFilter={navDpdFilter}
              initialStatusFilter={navStatusFilter}
              initialMembershipFilter={navMembershipFilter}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
              onOpenStatusModal={(m) => {
                setSelectedMember(m);
                setIsStatusModalOpen(true);
              }}
              onOpenCardModal={(m) => {
                setSelectedMember(m);
                setIsCardModalOpen(true);
              }}
              onOpenEditModal={(m) => {
                setSelectedMember(m);
                setIsEditModalOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onOpenDeletionRequest={handleOpenDeletionRequest}
              onDirectDelete={handleDirectDeleteMember}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 7: ID Synchronization & Cross Matching */}
          {activeTab === 'sync' && (
            <SyncIdReconciliation
              members={accessibleMembers}
              onBatchUpdateMembers={handleBatchUpdateMembers}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200/90 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-5 text-slate-500 text-xs transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-300">DPW Partai NasDem Sulut</span>
              <span>·</span>
              <span>Sistem Manajemen Keanggotaan Terpadu Realtime</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="hidden md:inline font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {members.filter((m) => m.status === 'Aktif').length} Kader Aktif Riil
              </span>
              <button
                onClick={handleResetDemoData}
                className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset database demonstrasi"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TemplateDownloadHubModal
        isOpen={isTemplateHubOpen}
        onClose={() => setIsTemplateHubOpen(false)}
        session={session}
        onOpenTerritorialMatrix={(dpd, dpc, level) => {
          setIsTemplateHubOpen(false);
          if (level === 'DPW') {
            setActiveTab('dpw');
          } else if (level === 'DPRt') {
            if (dpd) setMatrixInitialDpd(dpd);
            if (dpc) setMatrixInitialDpc(dpc);
            setActiveTab('dprt');
          } else if (level === 'DPC' || dpc) {
            if (dpd) setMatrixInitialDpd(dpd);
            if (dpc) setMatrixInitialDpc(dpc);
            setActiveTab('dpc');
          } else if (level === 'DPD' || dpd) {
            if (dpd) setMatrixInitialDpd(dpd);
            setActiveTab('dpd');
          } else {
            setActiveTab('dpd');
          }
        }}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        existingMembers={members}
        session={session}
        onImportSuccess={handleImportSuccess}
      />

      <ExecutiveReportPrintModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        members={members}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        session={session}
        onSaveStatus={handleSaveStatus}
      />

      {/* Modal Khusus Daftar Anggota Baru */}
      {isAddModalOpen && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMember}
          existingMembers={members}
          session={session}
        />
      )}

      {/* Modal Khusus Edit Data Anggota */}
      {isEditModalOpen && selectedMember && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
          onSave={handleEditMember}
          member={selectedMember}
          existingMembers={members}
          session={session}
        />
      )}

      {isCardModalOpen && selectedMember && (
        <EKtaCardModal
          isOpen={isCardModalOpen}
          member={selectedMember}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedMember(null);
          }}
        />
      )}

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentSession={session}
        onSelectSession={handleSelectSession}
      />

      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
        session={session}
      />

      {/* Member Detail Modal */}
      <MemberDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        session={session}
        onUpdateMember={(updated) => {
          handleEditMember(updated, updated.nik);
        }}
        onOpenEdit={(m) => {
          setIsDetailModalOpen(false);
          setSelectedMember(m);
          setIsEditModalOpen(true);
        }}
        onOpenStatusChange={(m) => {
          setIsDetailModalOpen(false);
          setSelectedMember(m);
          setIsStatusModalOpen(true);
        }}
        onOpenCardModal={(m) => {
          setIsDetailModalOpen(false);
          setSelectedMember(m);
          setIsCardModalOpen(true);
        }}
      />

      {/* Permohonan Hapus Data Modal (Khusus Admin Daerah DPD / DPC / DPRt) */}
      <DeletionRequestModal
        isOpen={isDeletionRequestOpen}
        onClose={() => {
          setIsDeletionRequestOpen(false);
          setDeletionTargetMember(null);
        }}
        member={deletionTargetMember}
        session={session}
        onSubmitRequest={handleSubmitDeletionRequest}
      />

      {/* Panel Approval Permohonan Hapus (Otoritas Super Admin DPW) */}
      <DeletionApprovalModal
        isOpen={isDeletionApprovalOpen}
        onClose={() => setIsDeletionApprovalOpen(false)}
        requests={deletionRequests}
        session={session}
        onApprove={handleApproveDeletionRequest}
        onReject={handleRejectDeletionRequest}
      />

      {/* Manajemen Pengguna & Hak Akses Admin (Otoritas Eksklusif Super Admin) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        members={members}
        session={session}
        onRecordAudit={(log) => recordAuditLog(log)}
      />

      {/* Modal Pusat Kode Referral & Rekrutmen Kader Berjenjang */}
      <ReferralHubModal
        isOpen={isReferralHubOpen}
        onClose={() => setIsReferralHubOpen(false)}
        session={session}
      />
    </div>
  );
}
