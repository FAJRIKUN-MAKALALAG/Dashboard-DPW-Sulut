import React from 'react';
import { UserSession } from '../../types';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';
import {
  canAccessDashboard,
  canManageUsers,
  canAccessStructureTab,
  canAccessAnalytics,
  canAccessInventory,
  canAccessFinance,
  canApproveDeletionRequest,
  canViewDeletionQueue,
  isDpdScopedRole,
  isDpcScopedRole,
  isDprtScopedRole,
  isGlobalTerritoryRole,
} from '../../utils/permissionUtils';
import { REQUIRED_POSITIONS } from '../../utils/structureReadinessUtils';
import {
  LayoutDashboard,
  Building2,
  Building,
  MapPin,
  Home,
  Users,
  CheckCircle2,
  Upload,
  History,
  ShieldCheck,
  LogOut,
  X,
  KeyRound,
  UserCheck,
  BarChart3,
  Tv,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Globe,
  Smartphone,
  Download,
  MessageSquare,
  Package,
  Wallet,
} from 'lucide-react';

export type MainNavTab =
  | 'dashboard'
  | 'analytics'
  | 'portal'
  | 'rekrutmen'
  | 'ekta_dpp'
  | 'dpw'
  | 'dpd'
  | 'dpc'
  | 'dprt'
  | 'members'
  | 'inventory'
  | 'finance'
  | 'users';

interface AppSidebarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  session?: UserSession;
  totalMembersCount: number;
  auditLogsCount: number;
  pendingDeletionCount: number;
  isCloudConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenPrintReport: () => void;
  onOpenRoleModal: () => void;
  onOpenAuditModal: () => void;
  onOpenDeletionApproval: () => void;
  onOpenUserManagement?: () => void;
  onOpenReferralHub?: () => void;
  onOpenInstallPwa?: () => void;
  onOpenSuperAdminInbox?: () => void;
  onOpenPengurusChat?: () => void;
  unreadChatCount?: number;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  session,
  totalMembersCount,
  auditLogsCount,
  pendingDeletionCount,
  isCloudConnected,
  theme,
  onToggleTheme,
  onOpenPrintReport,
  onOpenRoleModal,
  onOpenAuditModal,
  onOpenDeletionApproval,
  onOpenUserManagement,
  onOpenInstallPwa,
  onOpenSuperAdminInbox,
  onOpenPengurusChat,
  unreadChatCount = 0,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const handleNavClick = (tab: MainNavTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  // Hak Akses Berdasarkan Peran & Posisi Jabatan
  const hasDashboard = canAccessDashboard(session);
  const showAnalytics = canAccessAnalytics(session);
  const showUserMgmt = canManageUsers(session);

  const canAccessDpw = canAccessStructureTab('dpw', session);
  const canAccessDpd = canAccessStructureTab('dpd', session);
  const canAccessDpc = canAccessStructureTab('dpc', session);
  const canAccessDprt = canAccessStructureTab('dprt', session);
  // Menu Keuangan DPW disembunyikan sementara dari sidebar hingga dilanjutkan kembali
  const showFinance = false && canAccessFinance(session);
  const showInventory = canAccessInventory(session);
  const isOperationalOnlyRole =
    session?.role === 'ADMIN_INVENTORY' || session?.role === 'WAKIL_BENDAHARA';
  const showAuditHistory = isGlobalTerritoryRole(session?.role) && session?.role !== 'PENGURUS_DPW';
  const showDeletionQueue = canViewDeletionQueue(session) && !isOperationalOnlyRole;
  const isDeletionApprover = canApproveDeletionRequest(session);
  const hasOperationalTools =
    showFinance || showInventory || showAuditHistory || showDeletionQueue || showUserMgmt;

  // Label Menu Pencarian Sesuai Tingkat Kewenangan Wilayah
  let membersNavTitle = 'Database Kader';
  let membersNavSubtitle = 'Semua Anggota & e-KTA';

  if (isDprtScopedRole(session?.role)) {
    membersNavTitle = 'Pencarian Anggota DPRt';
    membersNavSubtitle = session?.dprtAccess && session.dprtAccess !== 'ALL'
      ? `Desa ${session.dprtAccess}`
      : 'Ranting Desa Saya';
  } else if (isDpcScopedRole(session?.role)) {
    membersNavTitle = 'Pencarian Anggota DPC';
    membersNavSubtitle = session?.dpcAccess && session.dpcAccess !== 'ALL'
      ? `Kec. ${session.dpcAccess}`
      : 'Tiap DPRt Kecamatan Saya';
  } else if (isDpdScopedRole(session?.role)) {
    membersNavTitle = 'Pencarian Anggota DPD';
    membersNavSubtitle = session?.dpdAccess && session.dpdAccess !== 'ALL'
      ? session.dpdAccess
      : 'Semua DPC & DPRt Daerah';
  } else if (isGlobalTerritoryRole(session?.role) && session?.role !== 'SUPER_ADMIN') {
    membersNavTitle = 'Pencarian Anggota Wilayah';
    membersNavSubtitle = 'Seluruh DPD, DPC & DPRt Sulut';
  }

  // Kelas Desain Minimal & Bersih (Tanpa Warna-Warni Mencolok)
  const navItemClass = (isActive: boolean) =>
    `group flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer w-full ${
      isActive
        ? 'bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] text-white border-l-[3px] border-l-[#FFDD00] shadow-xs'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;

  const iconContainerClass = (isActive: boolean) =>
    `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      isActive
        ? 'bg-white/15 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
    }`;

  const textHiddenIfCollapsed = isCollapsed ? 'lg:hidden' : '';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className={`p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#1A3282] p-1.5 flex items-center justify-center shadow-xs shrink-0 border border-[#FDB813]/40">
                <img
                  src={nasdemLogo}
                  alt="Partai NasDem"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className={`leading-tight truncate ${textHiddenIfCollapsed}`}>
                <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white block truncate">
                  PARTAI NASDEM
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block tracking-wider truncate">
                  DPW SULAWESI UTARA
                </span>
              </div>
            </div>

            {/* Collapse Toggle on Desktop: HANYA tampil saat sidebar sedang TERBUKA */}
            {onToggleCollapse && !isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Perkecil Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isCollapsed && onToggleCollapse && (
            <div className="hidden lg:flex justify-center py-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Perluas Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links Scrollable Area */}
          <div className="px-2.5 py-3 space-y-5 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* Section 1: Dashboard & Struktur Organisasi (Disembunyikan untuk role operasional non-kader) */}
            {!isOperationalOnlyRole && (
              <div>
                <span className={`px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5 ${textHiddenIfCollapsed}`}>
                  {session?.role === 'ANGGOTA' ? 'Profil Keanggotaan' : 'Struktur & Tata Kelola'}
                </span>
                <div className="space-y-1">
                {/* 1. Dashboard Utama (HANYA untuk Super Admin, Ketua DPW, Ketua DPD, Ketua DPC) */}
                {hasDashboard && (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={navItemClass(activeTab === 'dashboard')}
                    title="Dashboard Utama"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dashboard')}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Dashboard Utama</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dashboard'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isGlobalTerritoryRole(session?.role)
                            ? 'Ringkasan Eksekutif'
                            : isDpcScopedRole(session?.role)
                            ? `Kec. ${session?.dpcAccess || ''}`
                            : isDprtScopedRole(session?.role)
                            ? `Mini Dashboard ${session?.dprtAccess || 'DPRt'}`
                            : `Wilayah ${session?.dpdAccess || ''}`}
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* 1.5 Pusat Visualisasi & Monitoring (HANYA SUPER ADMIN & KETUA DPW) */}
                {showAnalytics && (
                  <button
                    onClick={() => handleNavClick('analytics')}
                    className={navItemClass(activeTab === 'analytics')}
                    title="Visualisasi & Analitik (Monitoring 15 Kab/Kota)"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'analytics')}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Visualisasi &amp; Analitik</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'analytics'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Monitoring 15 Kab/Kota
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${textHiddenIfCollapsed} ${
                        activeTab === 'analytics'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Tv className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  </button>
                )}

                {/* 2. Portal Mandiri Pengurus (atau Profil Saya untuk Anggota Biasa) */}
                <button
                  onClick={() => handleNavClick('portal')}
                  className={navItemClass(activeTab === 'portal')}
                  title={session?.role === 'ANGGOTA' ? 'Profil Saya' : 'Portal Pengurus'}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={iconContainerClass(activeTab === 'portal')}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className={`text-left ${textHiddenIfCollapsed}`}>
                      <span className="block leading-none">
                        {session?.role === 'ANGGOTA' ? 'Profil Saya' : 'Portal Pengurus'}
                      </span>
                      <span
                        className={`text-[10px] block mt-0.5 leading-none ${
                          activeTab === 'portal'
                            ? 'text-white/75'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {session?.role === 'ANGGOTA' ? 'Data Identitas & Profil' : 'Profil & Rekrutmen'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${textHiddenIfCollapsed} ${
                      activeTab === 'portal'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {session?.role === 'ANGGOTA' ? 'KADER' : 'SK/KTA'}
                  </span>
                </button>

                {/* 3. Pengurus DPW (HANYA SUPER_ADMIN & ADMIN_DPW) */}
                {canAccessDpw && (
                  <button
                    onClick={() => handleNavClick('dpw')}
                    className={navItemClass(activeTab === 'dpw')}
                    title="Pengurus DPW (Tingkat Provinsi Sulut)"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpw')}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Pengurus DPW</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpw'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Tingkat Provinsi Sulut
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textHiddenIfCollapsed} ${
                        activeTab === 'dpw'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      70 Kuota
                    </span>
                  </button>
                )}

                {/* 4. Pengurus DPD (SUPER_ADMIN, ADMIN_DPW, ADMIN_DPD) */}
                {canAccessDpd && (
                  <button
                    onClick={() => handleNavClick('dpd')}
                    className={navItemClass(activeTab === 'dpd')}
                    title="Pengurus DPD (15 Kab/Kota)"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpd')}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Pengurus DPD</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpd'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isDpdScopedRole(session?.role) ? session?.dpdAccess : '15 Kab / Kota'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textHiddenIfCollapsed} ${
                        activeTab === 'dpd'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      44 / DPD
                    </span>
                  </button>
                )}

                {/* 5. Pengurus DPC (SUPER_ADMIN, ADMIN_DPW, ADMIN_DPD, ADMIN_DPC) */}
                {canAccessDpc && (
                  <button
                    onClick={() => handleNavClick('dpc')}
                    className={navItemClass(activeTab === 'dpc')}
                    title="Pengurus DPC (Tingkat Kecamatan)"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpc')}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Pengurus DPC</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpc'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isDpcScopedRole(session?.role)
                            ? `Kec. ${session?.dpcAccess}`
                            : 'Tingkat Kecamatan'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textHiddenIfCollapsed} ${
                        activeTab === 'dpc'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      25 / DPC
                    </span>
                  </button>
                )}

                {/* 6. Pengurus DPRt (Semua Role dapat akses ranting wilayahnya) */}
                {canAccessDprt && (
                  <button
                    onClick={() => handleNavClick('dprt')}
                    className={navItemClass(activeTab === 'dprt')}
                    title="Pengurus DPRt (Ranting Desa / Kelurahan)"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dprt')}>
                        <Home className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Pengurus DPRt</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dprt'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isDprtScopedRole(session?.role)
                            ? `Desa ${session?.dprtAccess}`
                            : 'Ranting Desa / Kelurahan'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textHiddenIfCollapsed} ${
                        activeTab === 'dprt'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {REQUIRED_POSITIONS.DPRt} / Ranting
                    </span>
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Section: Pendaftaran Mandiri & e-KTA DPP (Hanya Pengurus & Admin) */}
            {session?.role !== 'ANGGOTA' && !isOperationalOnlyRole && (
              <div>
                <span className={`px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5 ${textHiddenIfCollapsed}`}>
                  Pendaftaran &amp; e-KTA
                </span>
                <div className="space-y-1">
                  {/* 1. Pendaftaran Anggota Baru (Kader DPW Sulut) */}
                  <button
                    onClick={() => handleNavClick('rekrutmen')}
                    className={navItemClass(activeTab === 'rekrutmen')}
                    title="Pendaftaran Anggota Baru & Rekrutmen Kader"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'rekrutmen')}>
                        <UserPlus className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">Daftar Anggota Baru</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'rekrutmen'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Scan KTP &amp; Rekrutmen
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${textHiddenIfCollapsed} ${
                        activeTab === 'rekrutmen'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      FORM
                    </span>
                  </button>

                  {/* 2. Pendaftaran & Penerbitan e-KTA Pusat (DPP) */}
                  <button
                    onClick={() => handleNavClick('ekta_dpp')}
                    className={navItemClass(activeTab === 'ekta_dpp')}
                    title="Pusat Pendaftaran & Penerbitan e-KTA Resmi DPP"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'ekta_dpp')}>
                        <Globe className="w-4 h-4 text-[#FFDD00]" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">e-KTA Pusat (DPP)</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'ekta_dpp'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          digital.partainasdem.id
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${textHiddenIfCollapsed} ${
                        activeTab === 'ekta_dpp'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#1A3282]/20 dark:bg-blue-900/40 text-[#21409A] dark:text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      PUSAT
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Database & Pencarian Anggota (Hanya Pengurus Ber-SK & Admin) */}
            {session?.role !== 'ANGGOTA' && !isOperationalOnlyRole && (
              <div>
                <span className={`px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5 ${textHiddenIfCollapsed}`}>
                  Pencarian &amp; Data Anggota
                </span>
                <div className="space-y-1">
                  {/* Pencarian Anggota / Database Kader */}
                  <button
                    onClick={() => handleNavClick('members')}
                    className={navItemClass(activeTab === 'members')}
                    title={membersNavTitle}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'members')}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed}`}>
                        <span className="block leading-none">{membersNavTitle}</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'members'
                              ? 'text-white/75'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {membersNavSubtitle}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${textHiddenIfCollapsed} ${
                        activeTab === 'members'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {totalMembersCount}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Alat Operasional (Hanya tampil jika ada item operasional yang boleh diakses) */}
            {session?.role !== 'ANGGOTA' && hasOperationalTools && (
              <div>
                <span className={`px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5 ${textHiddenIfCollapsed}`}>
                  Alat Operasional
                </span>
                <div className="space-y-1">
                  {/* Keuangan DPW: SUPER ADMIN & WAKIL BENDAHARA */}
                  {showFinance && (
                    <button
                      onClick={() => handleNavClick('finance')}
                      className={navItemClass(activeTab === 'finance')}
                      title="Keuangan DPW: Iuran Fraksi, Setoran DPP, & Kas Operasional"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={iconContainerClass(activeTab === 'finance')}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className={`text-left ${textHiddenIfCollapsed}`}>
                          <span className="block leading-none">Keuangan DPW</span>
                          <span
                            className={`text-[10px] block mt-0.5 leading-none ${
                              activeTab === 'finance'
                                ? 'text-white/75'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            Fraksi, DPP &amp; Kas Kantor
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${textHiddenIfCollapsed} ${
                          activeTab === 'finance'
                            ? 'bg-white/20 text-white'
                            : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        KAS
                      </span>
                    </button>
                  )}

                  {/* Inventaris Kantor DPW (5 Lantai): SUPER ADMIN, ADMIN INVENTORY & WAKIL BENDAHARA */}
                  {showInventory && (
                    <button
                      onClick={() => handleNavClick('inventory')}
                      className={navItemClass(activeTab === 'inventory')}
                      title="Inventaris & Aset Kantor DPW Sulut (5 Lantai)"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={iconContainerClass(activeTab === 'inventory')}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div className={`text-left ${textHiddenIfCollapsed}`}>
                          <span className="block leading-none">Inventaris Kantor</span>
                          <span
                            className={`text-[10px] block mt-0.5 leading-none ${
                              activeTab === 'inventory'
                                ? 'text-white/75'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            Aset Gedung 5 Lantai
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${textHiddenIfCollapsed} ${
                          activeTab === 'inventory'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        5 LT
                      </span>
                    </button>
                  )}

                  {/* Riwayat Audit (SUPER ADMIN, KETUA DPW & ADMIN DPW) */}
                  {showAuditHistory && (
                    <button
                      onClick={() => {
                        onOpenAuditModal();
                        onCloseMobile();
                      }}
                      title="Riwayat Audit"
                      className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'} w-full py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          <History className="w-4 h-4" />
                        </div>
                        <span className={textHiddenIfCollapsed}>Riwayat Audit</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono ${textHiddenIfCollapsed}`}>
                        {auditLogsCount}
                      </span>
                    </button>
                  )}

                  {/* Persetujuan Hapus (Tersembunyi untuk PENGURUS_* termasuk PENGURUS_DPW) */}
                  {showDeletionQueue && (
                    <button
                      onClick={() => {
                        onOpenDeletionApproval();
                        onCloseMobile();
                      }}
                      title={
                        isDeletionApprover
                          ? 'Persetujuan Hapus'
                          : 'Status Pengajuan Hapus'
                      }
                      className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'} w-full py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className={textHiddenIfCollapsed}>
                          {isDeletionApprover
                            ? 'Persetujuan Hapus'
                            : 'Status Pengajuan Hapus'}
                        </span>
                      </div>
                      {pendingDeletionCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-blue-600 text-white ${textHiddenIfCollapsed}`}>
                          {pendingDeletionCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Manajemen Akun Admin: HANYA SUPER ADMIN (1 Halaman Penuh) */}
                  {showUserMgmt && (
                    <button
                      onClick={() => {
                        handleNavClick('users');
                        if (onOpenUserManagement) onOpenUserManagement();
                      }}
                      title="Manajemen Akun & Hak Akses Pengguna"
                      className={`${navItemClass(activeTab === 'users')} mt-1`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={iconContainerClass(activeTab === 'users')}>
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div className={`text-left ${textHiddenIfCollapsed} min-w-0`}>
                          <span className="block leading-none font-semibold">
                            Manajemen Akun
                          </span>
                          <span
                            className={`text-[10px] font-normal mt-0.5 block leading-none ${
                              activeTab === 'users'
                                ? 'text-white/75'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            Kelola Akses Admin
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0 ${textHiddenIfCollapsed} ${
                          activeTab === 'users'
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100/80 dark:bg-blue-950/80 text-[#1A3282] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50'
                        }`}
                      >
                        SUPER
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Menu Chat Helpdesk Super Admin: Tampil untuk SEMUA peran (Super Admin, Pengurus DPW/DPD/DPC/DPRt, & Anggota) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span
                className={`px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5 ${textHiddenIfCollapsed}`}
              >
                Bantuan &amp; Pengaduan
              </span>

              {session?.role === 'SUPER_ADMIN' ? (
                onOpenSuperAdminInbox && (
                  <button
                    onClick={() => {
                      onOpenSuperAdminInbox();
                      onCloseMobile();
                    }}
                    title="Pusat Pesan & Laporan Pengurus (Helpdesk)"
                    className={`group flex items-center ${
                      isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'
                    } w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#9E6706] dark:text-amber-400 flex items-center justify-center font-bold border border-amber-200/70 dark:border-amber-900/50 shadow-2xs group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed} min-w-0`}>
                        <span className="block leading-none font-bold text-slate-900 dark:text-slate-100">
                          Pesan Pengurus
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 block leading-none">
                          Pusat Laporan &amp; Keluhan
                        </span>
                      </div>
                    </div>
                    {unreadChatCount && unreadChatCount > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 animate-bounce shadow-2xs">
                        {unreadChatCount}
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/80 text-[#9E6706] dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-900/50 uppercase shrink-0 ${textHiddenIfCollapsed}`}
                      >
                        HELPDESK
                      </span>
                    )}
                  </button>
                )
              ) : (
                onOpenPengurusChat && (
                  <button
                    onClick={() => {
                      onOpenPengurusChat();
                      onCloseMobile();
                    }}
                    title="Hubungi & Laporkan Masalah ke Admin DPW"
                    className={`group flex items-center ${
                      isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'
                    } w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#9E6706] dark:text-amber-400 flex items-center justify-center font-bold border border-amber-200/70 dark:border-amber-900/50 shadow-2xs group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className={`text-left ${textHiddenIfCollapsed} min-w-0`}>
                        <span className="block leading-none font-bold text-slate-900 dark:text-slate-100">
                          Chat Admin DPW
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 block leading-none">
                          Bantuan &amp; Lapor Kendala
                        </span>
                      </div>
                    </div>
                    {unreadChatCount && unreadChatCount > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 animate-bounce shadow-2xs">
                        {unreadChatCount}
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/80 text-[#9E6706] dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-900/50 uppercase shrink-0 ${textHiddenIfCollapsed}`}
                      >
                        CHAT
                      </span>
                    )}
                  </button>
                )
              )}
            </div>

            {/* Download / Pasang Shortcut Aplikasi HP & Desktop */}
            {onOpenInstallPwa && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    onOpenInstallPwa();
                    onCloseMobile();
                  }}
                  className={`group flex items-center ${
                    isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'
                  } w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer`}
                  title="Pasang Shortcut Aplikasi NasDem Sulut di HP (Android & iPhone) atau Komputer / Laptop"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1A3282] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/50 shadow-2xs group-hover:scale-105 transition-transform">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className={`text-left ${textHiddenIfCollapsed} min-w-0`}>
                      <span className="block leading-none truncate text-slate-900 dark:text-slate-100 font-bold">
                        Pasang Aplikasi di HP / Desktop
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 block leading-none truncate">
                        Android, iPhone &amp; Laptop (Shortcut)
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/80 dark:border-slate-700 uppercase shrink-0 ${textHiddenIfCollapsed}`}
                  >
                    PWA
                  </span>
                </button>
              </div>
            )}

            {/* Section 3: Sesi Akun (Tombol Logout Tunggal Selaras Tema Dasar) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onLogout();
                  onCloseMobile();
                }}
                className={`group flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between px-3.5'} w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer`}
                title="Keluar dari sesi dan kembali ke halaman login"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className={`text-left ${textHiddenIfCollapsed}`}>
                    <span className="block leading-none">Keluar / Logout</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 block leading-none">
                      Kembali ke halaman login
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Profile */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          {/* User Info Card */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} gap-2`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1A3282] dark:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-[#FDB813]/50">
                  {session?.adminName?.charAt(0) || 'A'}
                </div>
                <div className={`min-w-0 ${textHiddenIfCollapsed}`}>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                    {session?.adminName || 'Admin'}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {session?.jabatan || session?.role}
                  </span>
                </div>
              </div>

              {session?.role === 'SUPER_ADMIN' && onOpenRoleModal && (
                <button
                  onClick={() => {
                    onOpenRoleModal();
                    onCloseMobile();
                  }}
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ${textHiddenIfCollapsed}`}
                  title="Simulasi Peran / Switch Role (Super Admin)"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
