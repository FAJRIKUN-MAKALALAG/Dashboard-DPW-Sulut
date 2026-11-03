import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Member, MemberStatus, UserSession, AuditLog, DeletionRequest } from './types';
import {
  loadMembers,
  saveMembers,
  loadAuditLogs,
  loadSession,
  saveSession,
  loadDeletionRequests,
} from './utils/storage';
import {
  isSupabaseConfigured,
  getMembersFromSupabase,
  MemberService,
  AuditService,
  DeletionRequestService,
  getToken,
  clearToken,
  AUTH_EXPIRED_EVENT,
} from './utils/backendClient';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { MemberManagement } from './components/MemberManagement';
import { AppModalsContainer } from './components/modals';
import { AppSidebar, MainNavTab } from './components/layout/AppSidebar';
import { TerritorialStructurePage } from './components/TerritorialStructurePage';
import { PengurusPortalPage } from './components/PengurusPortalPage';
import { SulutAnalyticsPage } from './components/analytics/SulutAnalyticsPage';
import { isDpdMatch, isDpcMatch, isDprtMatch } from './utils/structureReadinessUtils';
import {
  canAccessDashboard,
  getDefaultActiveTab,
  canAccessStructureTab,
  canAccessAnalytics,
} from './utils/permissionUtils';
import { LoginPage } from './components/LoginPage';
import { useAppModals } from './hooks/useAppModals';
import { useAppRealtimeSync } from './hooks/useAppRealtimeSync';
import { useMemberCrudHandlers } from './hooks/useMemberCrudHandlers';
import { useAppRouting, parseCurrentRoute, isTabPermitted } from './hooks/useAppRouting';
import {
  Printer,
  CheckCircle2,
  Sun,
  Moon,
  Menu,
  ArrowLeft,
  Download,
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
  // Hook: Application URL Routing & Deep Linking (Two-Way Browser History Sync)
  const {
    activeTab,
    setActiveTab,
    matrixInitialDpd,
    setMatrixInitialDpd,
    matrixInitialDpc,
    setMatrixInitialDpc,
    matrixInitialDprt,
    setMatrixInitialDprt,
    navDpdFilter,
    setNavDpdFilter,
    navStatusFilter,
    setNavStatusFilter,
    navMembershipFilter,
    setNavMembershipFilter,
    cleanScreenParam,
    isCleanMode,
    handleNavigateToTerritory,
    handleNavigateFromDashboard,
    handleTerritoryChange,
  } = useAppRouting({ session, isAuthenticated });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
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

  // Hook: Modal Dialog States & Helpers
  const modals = useAppModals();

  // Hook: Realtime Cloud Synchronization
  const { loadInitialCloudData } = useAppRealtimeSync({
    isAuthenticated,
    setMembers,
    setAuditLogs,
    setDeletionRequests,
    setIsCloudConnected,
    setIsRealtimeActive,
  });

  // Hook: Member & Audit CRUD Handlers
  const crud = useMemberCrudHandlers({
    members,
    setMembers,
    setAuditLogs,
    deletionRequests,
    setDeletionRequests,
    session,
    showToast,
  });

  // Manual Cloud Sync Trigger
  const handleRefreshFromSupabase = async () => {
    if (isRefreshingCloud) return;
    setIsRefreshingCloud(true);
    showToast('Sedang menarik seluruh data terbaru dari database server...');
    try {
      const cloudMembers = await getMembersFromSupabase({ force: true });
      if (cloudMembers !== null) {
        setMembers(cloudMembers);
        saveMembers(cloudMembers);
        showToast(`✅ Berhasil menarik ${cloudMembers.length} data kader langsung dari server live!`);
      } else {
        showToast('⚠️ Gagal menarik data dari Backend. Pastikan backend aktif.');
      }
    } catch (e: any) {
      console.error('Error saat refresh cloud:', e);
      showToast(`⚠️ Terjadi kesalahan: ${e.message || e}`);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  // Guard: Anggota biasa tanpa SK HANYA boleh mengakses portal (Profil Saya)
  useEffect(() => {
    if (session?.role === 'ANGGOTA' && activeTab !== 'portal') {
      setActiveTab('portal');
    }
  }, [session?.role, activeTab]);

  const handleLoginSuccess = (userSession: UserSession) => {
    MemberService.invalidateCache();
    AuditService.invalidateCache();
    DeletionRequestService.invalidateCache();
    const wasAlreadyAuthenticated = isAuthenticated;
    setSession(userSession);
    saveSession(userSession);
    setIsAuthenticated(true);
    localStorage.setItem('nasdem_sulut_authenticated', 'true');
    showToast(`Selamat datang, ${userSession.adminName}`);
    // Jika sebelumnya false -> useEffect di useAppRealtimeSync otomatis memanggil loadInitialCloudData sekali
    if (wasAlreadyAuthenticated) {
      loadInitialCloudData();
    }
    const parsed = parseCurrentRoute();
    if (parsed.tab && isTabPermitted(parsed.tab, userSession)) {
      setActiveTab(parsed.tab);
    } else {
      setActiveTab(getDefaultActiveTab(userSession));
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      MemberService.invalidateCache();
      AuditService.invalidateCache();
      DeletionRequestService.invalidateCache();
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
    MemberService.invalidateCache();
    AuditService.invalidateCache();
    DeletionRequestService.invalidateCache();
    setIsAuthenticated(false);
    localStorage.removeItem('nasdem_sulut_authenticated');
    clearToken();
  };

  // Theme state
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

  const pendingDeletionCount = useMemo(() => {
    const pending = deletionRequests.filter((r) => r.status === 'PENDING');
    if (!session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return pending.length;
    }
    return pending.filter((r) => {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') {
        if (!isDpdMatch(r.dpd, session.dpdAccess)) return false;
      }
      if (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') {
        if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)') {
          if (!isDpcMatch(r.dpc, session.dpcAccess)) return false;
        }
      }
      if (session.role === 'ADMIN_DPRT') {
        if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum') {
          if (!isDprtMatch(r.dprt, session.dprtAccess)) return false;
        }
      }
      return true;
    }).length;
  }, [deletionRequests, session]);

  // Auto-repair & sanitize DPC/DPRt access for ADMIN_DPC and ADMIN_DPRT if cached as 'ALL' or 'Umum'
  useEffect(() => {
    if (session && session.role === 'ADMIN_DPC' && (!session.dpcAccess || session.dpcAccess === 'ALL' || session.dpcAccess === 'Umum (DPD)')) {
      const myMember = members.find((m) => m.nik === session.adminNik);
      if (myMember) {
        const dpcPos = myMember.positions?.find(
          (p) => p.tingkatKepengurusan === 'DPC' && p.dpc && p.dpc !== 'ALL' && p.dpc !== 'Umum (DPD)' && p.dpc !== '-'
        );
        const resolvedDpc = dpcPos?.dpc || (myMember.dpc && myMember.dpc !== 'ALL' && myMember.dpc !== 'Umum (DPD)' && myMember.dpc !== '-' ? myMember.dpc : '');
        if (resolvedDpc) {
          const updatedSession: UserSession = {
            ...session,
            dpcAccess: resolvedDpc,
            jabatan: dpcPos?.jabatan || session.jabatan,
          };
          setSession(updatedSession);
          saveSession(updatedSession);
        }
      }
    } else if (session && session.role === 'ADMIN_DPRT' && (!session.dprtAccess || session.dprtAccess === 'ALL' || session.dprtAccess === 'Pusat/Umum')) {
      const myMember = members.find((m) => m.nik === session.adminNik);
      if (myMember) {
        const dprtPos = myMember.positions?.find(
          (p) => p.tingkatKepengurusan === 'DPRt' && p.dprt && p.dprt !== 'ALL' && p.dprt !== 'Pusat/Umum' && p.dprt !== '-'
        );
        const resolvedDprt = dprtPos?.dprt || (myMember.dprt && myMember.dprt !== 'ALL' && myMember.dprt !== 'Pusat/Umum' && myMember.dprt !== '-' ? myMember.dprt : '');
        const resolvedDpc = dprtPos?.dpc || (myMember.dpc && myMember.dpc !== 'ALL' && myMember.dpc !== 'Umum (DPD)' && myMember.dpc !== '-' ? myMember.dpc : session.dpcAccess);
        if (resolvedDprt) {
          const updatedSession: UserSession = {
            ...session,
            dpcAccess: resolvedDpc,
            dprtAccess: resolvedDprt,
            jabatan: dprtPos?.jabatan || session.jabatan,
          };
          setSession(updatedSession);
          saveSession(updatedSession);
        }
      }
    }
  }, [session, members]);

  // Isolasi Data: Hak Akses Teritorial & Peran (Super Admin, DPW, DPD, DPC, DPRt)
  const accessibleMembers = useMemo(() => {
    if (!session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return members;
    }
    return members.filter((m) => {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') {
        if (!isDpdMatch(m.dpd, session.dpdAccess)) return false;
      }
      if (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') {
        const targetDpc = session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)'
          ? session.dpcAccess
          : '';
        if (targetDpc) {
          if (!isDpcMatch(m.dpc, targetDpc)) return false;
        }
      }
      if (session.role === 'ADMIN_DPRT') {
        const targetDprt = session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum'
          ? session.dprtAccess
          : '';
        if (targetDprt) {
          if (!isDprtMatch(m.dprt, targetDprt)) return false;
        }
      }
      return true;
    });
  }, [members, session]);

  // Tab Guard: Cegah akses di luar kewenangan peran
  useEffect(() => {
    if (!canAccessDashboard(session) && activeTab === 'dashboard') {
      setActiveTab('portal');
      return;
    }
    if (activeTab === 'analytics' && !canAccessAnalytics(session)) {
      setActiveTab(getDefaultActiveTab(session));
      return;
    }
    if (activeTab === 'dpw' && !canAccessStructureTab('dpw', session)) {
      setActiveTab(getDefaultActiveTab(session));
      return;
    }
    if (activeTab === 'dpd' && !canAccessStructureTab('dpd', session)) {
      setActiveTab(getDefaultActiveTab(session));
      return;
    }
    if (activeTab === 'dpc' && !canAccessStructureTab('dpc', session)) {
      setActiveTab(getDefaultActiveTab(session));
      return;
    }
    if (activeTab === 'dprt' && !canAccessStructureTab('dprt', session)) {
      setActiveTab(getDefaultActiveTab(session));
      return;
    }
  }, [session, activeTab]);

  const handleSelectSession = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    showToast(`Beralih ke peran: ${newSession.jabatan}`);
  };

  // If not logged in, display full LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Standalone Clean Video Wall Mode (khusus monitor layar terpisah)
  if (isCleanMode && canAccessAnalytics(session) && activeTab === 'analytics') {
    return (
      <SulutAnalyticsPage
        members={members}
        session={session}
        onRefreshCloud={handleRefreshFromSupabase}
        isRefreshingCloud={isRefreshingCloud}
        initialScreen={cleanScreenParam}
        isCleanMode={true}
      />
    );
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
        onOpenPrintReport={modals.openPrintReport}
        onOpenRoleModal={() => modals.setIsRoleModalOpen(true)}
        onOpenAuditModal={() => modals.setIsAuditModalOpen(true)}
        onOpenDeletionApproval={() => modals.setIsDeletionApprovalOpen(true)}
        onOpenUserManagement={() => modals.setIsUserManagementOpen(true)}
        onOpenReferralHub={() => modals.setIsReferralHubOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Viewport Container (Full-Fluid Desktop Workspace) */}
      <div
        className={`flex-1 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        } flex flex-col min-w-0 min-h-screen transition-all duration-200`}
      >
        {/* Minimalist Top Bar: Mobile Hamburger + Breadcrumb + Quick Tools */}
        <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 lg:px-7 2xl:px-8 h-14 sm:h-15 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              title="Buka Navigasi Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeTab !== getDefaultActiveTab(session) && (
              <button
                onClick={() => setActiveTab(getDefaultActiveTab(session))}
                className="btn-white flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs shrink-0"
                title="Kembali ke Halaman Utama"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs font-medium text-slate-400 hidden sm:inline shrink-0">
                Navigasi /
              </span>
              <span
                className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white truncate block"
                title={
                  activeTab === 'dashboard'
                    ? 'Dashboard Eksekutif'
                    : activeTab === 'analytics'
                    ? 'Pusat Analisis & Visualisasi Data Teritorial'
                    : activeTab === 'portal'
                    ? (session?.role === 'ANGGOTA' ? 'Profil Saya' : 'Portal Kerja Mandiri Pengurus & Rekrutmen')
                    : activeTab === 'dpw'
                    ? 'Susunan Pengurus DPW Sulut'
                    : activeTab === 'dpd'
                    ? 'Susunan Pengurus DPD Kab/Kota'
                    : activeTab === 'dpc'
                    ? 'Susunan Pengurus DPC Kecamatan'
                    : activeTab === 'dprt'
                    ? 'Susunan Pengurus DPRt Ranting Desa'
                    : 'Database Seluruh Kader Daerah'
                }
              >
                {activeTab === 'dashboard' && 'Dashboard Eksekutif'}
                {activeTab === 'analytics' && 'Pusat Analisis & Visualisasi Data (Command Center)'}
                {activeTab === 'portal' && (session?.role === 'ANGGOTA' ? 'Profil Saya' : 'Portal Kerja Mandiri Pengurus')}
                {activeTab === 'dpw' && 'Susunan Pengurus DPW Sulut'}
                {activeTab === 'dpd' && 'Susunan Pengurus DPD Kab/Kota'}
                {activeTab === 'dpc' && 'Susunan Pengurus DPC Kecamatan'}
                {activeTab === 'dprt' && 'Susunan Pengurus DPRt Desa'}
                {activeTab === 'members' && (
                  session?.role === 'ADMIN_DPRT'
                    ? `Pencarian DPRt (${session.dprtAccess && session.dprtAccess !== 'ALL' ? session.dprtAccess : 'Ranting'})`
                    : session?.role === 'ADMIN_DPC'
                    ? `Pencarian DPC (${session.dpcAccess || ''})`
                    : session?.role === 'ADMIN_DPD'
                    ? `Pencarian DPD (${session.dpdAccess || ''})`
                    : session?.role === 'ADMIN_DPW'
                    ? 'Pencarian Anggota Wilayah Sulut'
                    : 'Database Kader Daerah'
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="btn-white p-2 rounded-xl text-xs font-medium cursor-pointer border border-slate-200 dark:border-slate-700"
              title={theme === 'light' ? 'Mode Malam' : 'Mode Terang'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {session?.role !== 'ANGGOTA' && (
              <button
                onClick={() => modals.setIsTemplateHubOpen(true)}
                className="btn-white flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Pusat Unduh Template Excel Resmi Partai NasDem (DPW, DPD, DPC, DPRt)"
                aria-label="Unduh Template Excel"
              >
                <Download className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden md:inline whitespace-nowrap">Template Excel</span>
              </button>
            )}

            {session?.role !== 'ANGGOTA' && (
              <button
                onClick={modals.openPrintReport}
                className="btn-white flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Cetak Laporan PDF Ringkasan Atasan"
                aria-label="Laporan PDF"
              >
                <Printer className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden md:inline whitespace-nowrap">Laporan PDF</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area: Full-Width Desktop Workspace */}
        <main
          className={`flex-1 w-full max-w-none ${
            activeTab === 'analytics'
              ? 'px-2 sm:px-4 lg:px-6 py-4'
              : 'px-3 sm:px-5 lg:px-6 2xl:px-8 py-4 sm:py-6'
          }`}
        >
          <div key={activeTab} className="animate-page-enter">
            {/* Tab 1: Executive Dashboard */}
            {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              members={accessibleMembers}
              session={session}
              onOpenPrintReport={modals.openPrintReport}
              onOpenUserManagement={() => modals.setIsUserManagementOpen(true)}
              onOpenDownloadTemplate={() => modals.setIsTemplateHubOpen(true)}
              onOpenReferralHub={() => modals.setIsReferralHubOpen(true)}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onNavigateToMembers={handleNavigateFromDashboard}
              onOpenCardModal={modals.openCardModal}
              onAddMembers={(newMembers) => {
                crud.handleImportSuccess(newMembers, newMembers.length);
              }}
              onOpenTerritorialMatrix={handleNavigateToTerritory}
            />
          )}

          {/* Tab 1.2: Pusat Analisis & Visualisasi Data */}
          {activeTab === 'analytics' && canAccessAnalytics(session) && (
            <SulutAnalyticsPage
              members={members}
              session={session}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              initialScreen={cleanScreenParam}
              isCleanMode={false}
            />
          )}

          {/* Tab 1.5: Portal Mandiri Pengurus (DPW, DPD, DPC, DPRt) / Profil Saya (Anggota) */}
          {activeTab === 'portal' && (
            <PengurusPortalPage
              members={accessibleMembers}
              session={session}
              onAddMember={crud.handleAddMember}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={modals.openCardModal}
            />
          )}

          {/* Tab 2: Pengurus DPW */}
          {activeTab === 'dpw' && (session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW') && (
            <TerritorialStructurePage
              level="DPW"
              members={accessibleMembers}
              session={session}
              onSaveMembersBatch={crud.handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={crud.handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={modals.openCardModal}
              onOpenDetailModal={modals.openDetailModal}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 3: Pengurus DPD */}
          {activeTab === 'dpd' && (
            <TerritorialStructurePage
              level="DPD"
              members={accessibleMembers}
              session={session}
              initialDpd={session?.dpdAccess && session?.dpdAccess !== 'ALL' ? session.dpdAccess : matrixInitialDpd}
              onTerritoryChange={handleTerritoryChange}
              onSaveMembersBatch={crud.handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={crud.handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={modals.openCardModal}
              onOpenDetailModal={modals.openDetailModal}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 4: Pengurus DPC */}
          {activeTab === 'dpc' && (
            <TerritorialStructurePage
              level="DPC"
              members={accessibleMembers}
              session={session}
              initialDpd={session?.dpdAccess && session?.dpdAccess !== 'ALL' ? session.dpdAccess : matrixInitialDpd}
              initialDpc={
                (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') &&
                session?.dpcAccess &&
                session?.dpcAccess !== 'ALL' &&
                session?.dpcAccess !== 'Umum (DPD)'
                  ? session.dpcAccess
                  : matrixInitialDpc
              }
              onTerritoryChange={handleTerritoryChange}
              onSaveMembersBatch={crud.handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={crud.handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={modals.openCardModal}
              onOpenDetailModal={modals.openDetailModal}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {/* Tab 5: Pengurus DPRt */}
          {activeTab === 'dprt' && (
            <TerritorialStructurePage
              level="DPRt"
              members={accessibleMembers}
              session={session}
              initialDpd={session?.dpdAccess && session?.dpdAccess !== 'ALL' ? session.dpdAccess : matrixInitialDpd}
              initialDpc={
                (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') &&
                session?.dpcAccess &&
                session?.dpcAccess !== 'ALL' &&
                session?.dpcAccess !== 'Umum (DPD)'
                  ? session.dpcAccess
                  : matrixInitialDpc
              }
              initialDprt={
                session?.role === 'ADMIN_DPRT' &&
                session?.dprtAccess &&
                session?.dprtAccess !== 'ALL' &&
                session?.dprtAccess !== 'Pusat/Umum'
                  ? session.dprtAccess
                  : matrixInitialDprt
              }
              onTerritoryChange={handleTerritoryChange}
              onSaveMembersBatch={crud.handleBatchSaveTerritorialMembers}
              onDeleteMembersBatch={crud.handleBatchDeleteTerritorialMembers}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
              onOpenCardModal={modals.openCardModal}
              onOpenDetailModal={modals.openDetailModal}
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
              onOpenAddModal={() => modals.setIsAddModalOpen(true)}
              onOpenStatusModal={modals.openStatusModal}
              onOpenCardModal={modals.openCardModal}
              onOpenEditModal={modals.openEditModal}
              onOpenDetailModal={modals.openDetailModal}
              onOpenDeletionRequest={modals.openDeletionRequest}
              onDirectDelete={crud.handleDirectDeleteMember}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onOpenPrintWithMembers={modals.openPrintWithMembers}
            />
          )}
          </div>
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200/90 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-5 text-slate-500 text-xs transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-300">DPW Partai NasDem Sulut</span>
              <span>·</span>
              <span>Sistem Manajemen kepengurusan dan keanggotaan Realtime</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="hidden md:inline font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {members.filter((m) => m.status === 'Aktif').length} Kader Aktif
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Render All Application Modals via Container */}
      <AppModalsContainer
        modals={modals}
        members={members}
        auditLogs={auditLogs}
        deletionRequests={deletionRequests}
        session={session}
        onSelectSession={handleSelectSession}
        onAddMember={crud.handleAddMember}
        onEditMember={crud.handleEditMember}
        onSaveStatus={crud.handleSaveStatus}
        onSubmitDeletionRequest={crud.handleSubmitDeletionRequest}
        onApproveDeletionRequest={crud.handleApproveDeletionRequest}
        onRejectDeletionRequest={crud.handleRejectDeletionRequest}
        onRecordAuditLog={crud.recordAuditLog}
        onNavigateToTerritory={handleNavigateToTerritory}
        onClearAuditLogs={() => setAuditLogs([])}
      />
    </div>
  );
}
