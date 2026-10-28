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
  isReferralApplicable,
  getDefaultActiveTab,
  canAccessStructureTab,
  canAccessAnalytics,
} from './utils/permissionUtils';
import { LoginPage } from './components/LoginPage';
import { useAppModals } from './hooks/useAppModals';
import { useAppRealtimeSync } from './hooks/useAppRealtimeSync';
import { useMemberCrudHandlers } from './hooks/useMemberCrudHandlers';
import {
  Printer,
  RotateCcw,
  CheckCircle2,
  Sun,
  Moon,
  Menu,
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
  const [cleanScreenParam] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('screen');
  });
  const [isCleanMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('clean') === 'true';
  });
  const [activeTab, setActiveTab] = useState<MainNavTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'analytics') return 'analytics';
    return getDefaultActiveTab(loadSession());
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);

  // Filter overrides when navigating from dashboard
  const [navDpdFilter, setNavDpdFilter] = useState<string | undefined>(undefined);
  const [navStatusFilter, setNavStatusFilter] = useState<MemberStatus | undefined>(undefined);
  const [navMembershipFilter, setNavMembershipFilter] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');

  // Initial territory selector for territorial pages
  const [matrixInitialDpd, setMatrixInitialDpd] = useState<string | undefined>(undefined);
  const [matrixInitialDpc, setMatrixInitialDpc] = useState<string | undefined>(undefined);

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
    setActiveTab(getDefaultActiveTab(userSession));
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

  const pendingDeletionCount = deletionRequests.filter((r) => r.status === 'PENDING').length;

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
        if (session.dpcAccess && session.dpcAccess !== 'ALL') {
          if (!isDpcMatch(m.dpc, session.dpcAccess)) return false;
        }
      }
      if (session.role === 'ADMIN_DPRT') {
        if (session.dprtAccess && session.dprtAccess !== 'ALL') {
          if (!isDprtMatch(m.dprt, session.dprtAccess)) return false;
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

  const handleNavigateToTerritory = (
    dpd?: string,
    dpc?: string,
    level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt'
  ) => {
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
        onOpenPrintReport={() => modals.setIsPrintReportOpen(true)}
        onOpenRoleModal={() => modals.setIsRoleModalOpen(true)}
        onOpenAuditModal={() => modals.setIsAuditModalOpen(true)}
        onOpenDeletionApproval={() => modals.setIsDeletionApprovalOpen(true)}
        onOpenUserManagement={() => modals.setIsUserManagementOpen(true)}
        onOpenReferralHub={() => modals.setIsReferralHubOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Viewport Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Minimalist Top Bar: Mobile Hamburger + Breadcrumb + Quick Tools */}
        <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
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
                className="btn-white flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs shrink-0"
                title="Kembali ke Halaman Utama"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline shrink-0">
                Menu &raquo;
              </span>
              <span
                className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white truncate block"
                title={
                  activeTab === 'dashboard'
                    ? 'Dashboard Eksekutif'
                    : activeTab === 'analytics'
                    ? 'Pusat Analisis & Visualisasi Data Teritorial'
                    : activeTab === 'portal'
                    ? 'Portal Kerja Mandiri Pengurus & Rekrutmen'
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
                {activeTab === 'portal' && 'Portal Kerja Mandiri Pengurus'}
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

          <div className="flex items-center gap-2">
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

            {isReferralApplicable(session) && (
              <button
                onClick={() => modals.setIsReferralHubOpen(true)}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Pusat Kode Referral & Rekrutmen Kader Partai NasDem Sulut"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Kode Referral</span>
              </button>
            )}

            <button
              onClick={() => modals.setIsTemplateHubOpen(true)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Pusat Unduh Template Excel Resmi Partai NasDem (DPW, DPD, DPC, DPRt)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Unduh Template Excel</span>
              <span className="sm:hidden">Template</span>
            </button>

            <button
              onClick={() => modals.setIsPrintReportOpen(true)}
              className="btn-white hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer shadow-2xs text-blue-600 dark:text-blue-400"
              title="Cetak Laporan PDF Ringkasan Atasan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Laporan PDF</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 w-full mx-auto ${
            activeTab === 'analytics'
              ? 'max-w-[1850px] px-2 sm:px-4 py-4'
              : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
          }`}
        >
          <div key={activeTab} className="animate-page-enter">
            {/* Tab 1: Executive Dashboard */}
            {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              members={accessibleMembers}
              session={session}
              onOpenPrintReport={() => modals.setIsPrintReportOpen(true)}
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

          {/* Tab 1.5: Portal Mandiri Pengurus (DPW, DPD, DPC, DPRt) */}
          {activeTab === 'portal' && (
            <PengurusPortalPage
              members={accessibleMembers}
              session={session}
              onAddMember={crud.handleAddMember}
              onRefreshCloud={handleRefreshFromSupabase}
              isRefreshingCloud={isRefreshingCloud}
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
                  : undefined
              }
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
              <span>Sistem Manajemen Keanggotaan Terpadu Realtime</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="hidden md:inline font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {members.filter((m) => m.status === 'Aktif').length} Kader Aktif Riil
              </span>
              <button
                onClick={crud.handleResetDemoData}
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
      />
    </div>
  );
}
