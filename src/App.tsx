import React, { useState, useEffect } from 'react';
import { Member, MemberStatus, UserSession, AuditLog, DeletionRequest } from './types';
import {
  loadMembers,
  saveMembers,
  loadAuditLogs,
  appendAuditLog,
  loadSession,
  saveSession,
  resetToDefaultSeeds,
  loadDeletionRequests,
  appendDeletionRequest,
  updateDeletionRequest,
} from './utils/storage';
import {
  getMembersFromSupabase,
  upsertMembersToSupabase,
  isSupabaseConfigured,
} from './utils/supabaseClient';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { MemberManagement } from './components/MemberManagement';
import { SyncIdReconciliation } from './components/SyncIdReconciliation';
import { BulkImportModal } from './components/BulkImportModal';
import { ExecutiveReportPrintModal } from './components/ExecutiveReportPrintModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { AddMemberModal } from './components/AddMemberModal';
import { EditMemberModal } from './components/EditMemberModal';
import { EKtaCardModal } from './components/EKtaCardModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { DeletionRequestModal } from './components/DeletionRequestModal';
import { DeletionApprovalModal } from './components/DeletionApprovalModal';
import { LoginPage } from './components/LoginPage';
import nasdemLogo from './assets/logo/logo_nasdem.png';
import {
  Users,
  LayoutDashboard,
  Shield,
  Key,
  Upload,
  Printer,
  History,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Building,
  UserCheck,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

export default function App() {
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadAuditLogs());
  const [session, setSession] = useState<UserSession>(() => loadSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nasdem_sulut_authenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'sync'>('dashboard');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => isSupabaseConfigured());

  // Sinkronisasi otomatis dengan Cloud Database Supabase saat startup
  useEffect(() => {
    async function syncCloudDatabase() {
      if (isSupabaseConfigured()) {
        try {
          const cloudData = await getMembersFromSupabase();
          if (cloudData !== null) {
            setMembers(cloudData);
            saveMembers(cloudData);
            setIsCloudConnected(true);
          }
        } catch (err) {
          console.error('Error connecting to Supabase cloud:', err);
        }
      }
    }
    syncCloudDatabase();
  }, []);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    saveSession(userSession);
    setIsAuthenticated(true);
    localStorage.setItem('nasdem_sulut_authenticated', 'true');
    showToast(`Selamat datang, ${userSession.adminName}`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nasdem_sulut_authenticated');
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

  // Modals state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Deletion requests state & modals
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(() =>
    loadDeletionRequests()
  );
  const [isDeletionApprovalOpen, setIsDeletionApprovalOpen] = useState(false);
  const [isDeletionRequestOpen, setIsDeletionRequestOpen] = useState(false);
  const [deletionTargetMember, setDeletionTargetMember] = useState<Member | null>(null);

  const pendingDeletionCount = deletionRequests.filter((r) => r.status === 'PENDING').length;

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync to local storage & Supabase Cloud
  const updateMembersState = (newMembers: Member[]) => {
    setMembers(newMembers);
    saveMembers(newMembers);
    if (isSupabaseConfigured()) {
      upsertMembersToSupabase(newMembers).catch((e) =>
        console.error('Failed to sync changes to Supabase:', e)
      );
    }
  };

  // 1. FITUR DAFTAR ANGGOTA BARU (Registrasi Baru)
  const handleAddMember = (newMember: Member) => {
    const updated = [newMember, ...members];
    updateMembersState(updated);
    appendAuditLog({
      memberNik: newMember.nik,
      memberName: newMember.namaLengkap,
      action: 'CREATE',
      newStatus: newMember.status,
      reason: 'Registrasi mandiri anggota baru di database.',
      actor: session.adminName,
      dpd: newMember.dpd,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`Kader baru ${newMember.namaLengkap} (${newMember.dpd}) berhasil didaftarkan.`);
  };

  // 2. FITUR EDIT DATA ANGGOTA (Memperbarui data yang ada, tidak menambah jumlah anggota)
  const handleEditMember = (updatedMember: Member, originalNik: string) => {
    const cleanOriginal = originalNik.replace(/[^0-9]/g, '').trim();
    // Cari index anggota yang diedit secara presisi
    const targetIndex = members.findIndex(
      (m) => m.nik === originalNik || m.nik.replace(/[^0-9]/g, '').trim() === cleanOriginal
    );

    let updated: Member[];
    if (targetIndex !== -1) {
      updated = [...members];
      updated[targetIndex] = updatedMember;
    } else {
      const altIndex = members.findIndex(
        (m) =>
          (m.nomorEKTA && updatedMember.nomorEKTA && m.nomorEKTA === updatedMember.nomorEKTA) ||
          m.nik === updatedMember.nik
      );
      if (altIndex !== -1) {
        updated = [...members];
        updated[altIndex] = updatedMember;
      } else {
        updated = members.map((m) => (m.nik === originalNik ? updatedMember : m));
      }
    }

    updateMembersState(updated);
    appendAuditLog({
      memberNik: updatedMember.nik,
      memberName: updatedMember.namaLengkap,
      action: 'UPDATE',
      reason: 'Pembaruan data profil anggota via formulir edit.',
      actor: session.adminName,
      dpd: updatedMember.dpd,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`Data kader ${updatedMember.namaLengkap} berhasil diperbarui.`);
  };

  // Proxy untuk backward-compatibility
  const handleSaveMember = (memberData: Member, isEdit: boolean, originalNik?: string) => {
    if (isEdit) {
      handleEditMember(memberData, originalNik || memberData.nik);
    } else {
      handleAddMember(memberData);
    }
  };

  const handleSaveStatus = (nik: string, newStatus: MemberStatus, reason: string) => {
    const target = members.find((m) => m.nik === nik);
    if (!target) return;

    const prevStatus = target.status;
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = members.map((m) => {
      if (m.nik === nik) {
        return {
          ...m,
          status: newStatus,
          catatanMutasi: reason,
          terakhirDiubah: nowTime,
          diubahOleh: session.adminName,
        };
      }
      return m;
    });

    updateMembersState(updated);

    appendAuditLog({
      memberNik: target.nik,
      memberName: target.namaLengkap,
      action: 'STATUS_CHANGE',
      previousStatus: prevStatus,
      newStatus,
      reason,
      actor: session.adminName,
      dpd: target.dpd,
    });
    setAuditLogs(loadAuditLogs());

    if (newStatus !== 'Aktif') {
      showToast(`Status ${target.namaLengkap} diubah ke ${newStatus}. Otomatis dikeluarkan dari hitungan Aktif.`);
    } else {
      showToast(`Status ${target.namaLengkap} diaktifkan kembali.`);
    }
  };

  const handleImportSuccess = (newMembers: Member[], count: number) => {
    const combined = [...newMembers, ...members];
    updateMembersState(combined);
    appendAuditLog({
      memberNik: 'MASS-UPLOAD',
      memberName: `${count} Anggota Daerah`,
      action: 'IMPORT_MASSAL',
      newStatus: 'Aktif',
      reason: `Import massal berkas spreadsheet oleh ${session.adminName}.`,
      actor: session.adminName,
      dpd: session.dpdAccess === 'ALL' ? 'Sulawesi Utara' : session.dpdAccess,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`${count} kader berhasil diimpor massal ke Shadow Database.`);
  };

  const handleBatchUpdateMembers = (updated: Member[]) => {
    updateMembersState(updated);
    showToast('Standardisasi Nomor e-KTA Pusat berhasil disimpan.');
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset database ke data awal DPW Partai NasDem Sulawesi Utara?')) {
      resetToDefaultSeeds();
      const fresh = loadMembers();
      setMembers(fresh);
      setAuditLogs(loadAuditLogs());
      showToast('Database berhasil di-reset ke data kader DPW Partai NasDem Sulut.');
    }
  };

  const handleSelectSession = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    showToast(`Beralih ke peran: ${newSession.jabatan}`);
  };

  const handleNavigateFromDashboard = (filterDpd?: string, filterStatus?: MemberStatus) => {
    setNavDpdFilter(filterDpd);
    setNavStatusFilter(filterStatus);
    setActiveTab('members');
  };

  // Deletion workflows
  const handleDirectDeleteMember = (member: Member) => {
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
      updateMembersState(updated);
      appendAuditLog({
        memberNik: member.nik,
        memberName: member.namaLengkap,
        action: 'DELETE',
        reason: 'Penghapusan permanen langsung oleh Super Admin DPW Partai NasDem Sulut.',
        actor: session.adminName,
        dpd: member.dpd,
      });
      setAuditLogs(loadAuditLogs());
      showToast(`Data kader ${member.namaLengkap} berhasil dihapus permanen.`);
    }
  };

  const handleOpenDeletionRequest = (member: Member) => {
    setDeletionTargetMember(member);
    setIsDeletionRequestOpen(true);
  };

  const handleSubmitDeletionRequest = (member: Member, reason: string) => {
    appendDeletionRequest({
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
    });
    setDeletionRequests(loadDeletionRequests());
    appendAuditLog({
      memberNik: member.nik,
      memberName: member.namaLengkap,
      action: 'DELETE_REQUEST',
      reason: `Permohonan penghapusan kader diajukan oleh ${session.jabatan}: "${reason}"`,
      actor: session.adminName,
      dpd: member.dpd,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`Permohonan penghapusan kader ${member.namaLengkap} berhasil dikirim ke DPW.`);
  };

  const handleApproveDeletionRequest = (requestId: string, notes?: string) => {
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
    updateDeletionRequest(updatedReq);
    setDeletionRequests(loadDeletionRequests());

    // Permanently remove member
    const updated = members.filter((m) => m.nik !== target.memberNik);
    updateMembersState(updated);

    appendAuditLog({
      memberNik: target.memberNik,
      memberName: target.memberName,
      action: 'DELETE',
      reason: `Disetujui oleh DPW atas permohonan ${target.requestedByName}. Alasan: "${target.reason}". Catatan DPW: "${notes || '-'}"`,
      actor: session.adminName,
      dpd: target.dpd,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`Permohonan disetujui. Data kader ${target.memberName} telah dihapus permanen.`);
  };

  const handleRejectDeletionRequest = (requestId: string, notes: string) => {
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
    updateDeletionRequest(updatedReq);
    setDeletionRequests(loadDeletionRequests());

    appendAuditLog({
      memberNik: target.memberNik,
      memberName: target.memberName,
      action: 'DELETE_REQUEST',
      reason: `Permohonan penghapusan kader ${target.memberName} ditolak DPW. Alasan: "${notes}"`,
      actor: session.adminName,
      dpd: target.dpd,
    });
    setAuditLogs(loadAuditLogs());
    showToast(`Permohonan penghapusan kader ${target.memberName} ditolak.`);
  };

  // If not logged in, display full LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-amber-500/80 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract: Brand Wordmark — Nav Links — Primary Action & Theme Switcher */}
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Wordmark with Partai NasDem Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={nasdemLogo}
              alt="Logo Resmi Partai NasDem"
              className="h-10 w-auto object-contain shrink-0 drop-shadow-xs"
            />
            <div className="flex flex-col">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('dashboard');
                }}
                className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                DPW Partai NasDem Sulut
              </a>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight -mt-0.5">
                e-KTA Digital · Gerakan Perubahan
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setNavDpdFilter(undefined);
                setNavStatusFilter(undefined);
                setActiveTab('members');
              }}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeTab === 'members'
                  ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                  : ''
              }`}
            >
              Kader Daerah
            </button>
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Import Massal
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeTab === 'sync'
                  ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                  : ''
              }`}
            >
              Sinkronisasi ID
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Riwayat Audit ({auditLogs.length})
            </button>
            <button
              onClick={() => setIsDeletionApprovalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>{session.role === 'SUPER_ADMIN' ? 'Permohonan Hapus' : 'Status Pengajuan Hapus'}</span>
              {pendingDeletionCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {pendingDeletionCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Actions + Theme Switcher (Light / Night Mode) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isCloudConnected && (
              <div
                title="Terhubung ke Cloud Database Supabase Resmi"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Live</span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Beralih ke Mode Malam (Night Mode)' : 'Beralih ke Mode Terang (Latar Putih)'}
              className="btn-white flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer shadow-2xs"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">Mode Malam</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">Mode Terang</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsPrintReportOpen(true)}
              title="Cetak Laporan PDF Ringkasan Statistik 15 DPD untuk Atasan"
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Laporan PDF Atasan</span>
            </button>

            <button
              onClick={() => setIsRoleModalOpen(true)}
              title="Ganti Peran (Super Admin vs Admin DPD/DPC/DPRt)"
              className="btn-white flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline font-mono text-[11px]">{session.jabatan}</span>
              <span className="md:hidden font-mono">Peran</span>
            </button>

            <button
              onClick={handleLogout}
              title="Keluar / Ganti Akun"
              className="btn-white flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer shadow-2xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Navigation Tabs */}
        <div className="no-print md:hidden flex items-center justify-between gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 overflow-x-auto text-xs shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'dashboard' ? 'btn-white font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setNavDpdFilter(undefined);
                setNavStatusFilter(undefined);
                setActiveTab('members');
              }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'members' ? 'btn-white font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kader Daerah
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'sync' ? 'btn-white font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sinkronisasi
            </button>
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="btn-white px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium"
            >
              PDF
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Ganti Mode Tampilan"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Tab 1: Executive Dashboard */}
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            members={members}
            session={session}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
            onNavigateToMembers={handleNavigateFromDashboard}
            onOpenCardModal={(m) => {
              setSelectedMember(m);
              setIsCardModalOpen(true);
            }}
            onAddMembers={(newMembers) => {
              handleImportSuccess(newMembers, newMembers.length);
            }}
          />
        )}

        {/* Tab 2: Member Management */}
        {activeTab === 'members' && (
          <MemberManagement
            members={members}
            session={session}
            initialDpdFilter={navDpdFilter}
            initialStatusFilter={navStatusFilter}
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
          />
        )}

        {/* Tab 3: ID Synchronization & Cross Matching */}
        {activeTab === 'sync' && (
          <SyncIdReconciliation
            members={members}
            onBatchUpdateMembers={handleBatchUpdateMembers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200/90 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-5 text-slate-500 text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-300">DPW Partai NasDem Sulut</span>
            <span>·</span>
            <span>Restorasi Indonesia</span>
            <span>·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{members.filter((m) => m.status === 'Aktif').length} Kader Aktif Riil</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemoData}
              className="text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset ke database awal demonstrasi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Log Mutasi ({auditLogs.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
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

      {/* 1. Modal Khusus Daftar Anggota Baru */}
      {isAddModalOpen && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMember}
          existingMembers={members}
          session={session}
        />
      )}

      {/* 2. Modal Khusus Edit Data Anggota */}
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
          handleSaveMember(updated, true);
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
    </div>
  );
}
