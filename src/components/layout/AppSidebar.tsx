import React from 'react';
import { UserSession } from '../../types';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';
import {
  canAccessDashboard,
  canManageUsers,
  isReferralApplicable,
  canAccessStructureTab,
  canAccessAnalytics,
} from '../../utils/permissionUtils';
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
  Printer,
  Moon,
  Sun,
  LogOut,
  X,
  Sparkles,
  KeyRound,
  UserCheck,
  BarChart3,
  Tv,
} from 'lucide-react';

export type MainNavTab = 'dashboard' | 'analytics' | 'portal' | 'dpw' | 'dpd' | 'dpc' | 'dprt' | 'members' | 'sync';

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
  onOpenBulkImport: () => void;
  onOpenAuditModal: () => void;
  onOpenDeletionApproval: () => void;
  onOpenUserManagement?: () => void;
  onOpenReferralHub?: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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
  onOpenBulkImport,
  onOpenAuditModal,
  onOpenDeletionApproval,
  onOpenUserManagement,
  onOpenReferralHub,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: MainNavTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  // Hak Akses Berdasarkan Peran & Posisi Jabatan
  const hasDashboard = canAccessDashboard(session);
  const showAnalytics = canAccessAnalytics(session);
  const showReferral = isReferralApplicable(session);
  const showUserMgmt = canManageUsers(session);

  const canAccessDpw = canAccessStructureTab('dpw', session);
  const canAccessDpd = canAccessStructureTab('dpd', session);
  const canAccessDpc = canAccessStructureTab('dpc', session);
  const canAccessDprt = canAccessStructureTab('dprt', session);

  // Label Menu Pencarian Sesuai Tingkat Kewenangan Wilayah
  let membersNavTitle = 'Database Kader';
  let membersNavSubtitle = 'Semua Anggota & e-KTA';

  if (session?.role === 'ADMIN_DPRT') {
    membersNavTitle = 'Pencarian Anggota DPRt';
    membersNavSubtitle = session.dprtAccess && session.dprtAccess !== 'ALL'
      ? `Desa ${session.dprtAccess}`
      : 'Ranting Desa Saya';
  } else if (session?.role === 'ADMIN_DPC') {
    membersNavTitle = 'Pencarian Anggota DPC';
    membersNavSubtitle = session.dpcAccess && session.dpcAccess !== 'ALL'
      ? `Kec. ${session.dpcAccess}`
      : 'Tiap DPRt Kecamatan Saya';
  } else if (session?.role === 'ADMIN_DPD') {
    membersNavTitle = 'Pencarian Anggota DPD';
    membersNavSubtitle = session.dpdAccess && session.dpdAccess !== 'ALL'
      ? session.dpdAccess
      : 'Semua DPC & DPRt Daerah';
  } else if (session?.role === 'ADMIN_DPW') {
    membersNavTitle = 'Pencarian Anggota Wilayah';
    membersNavSubtitle = 'Seluruh DPD, DPC & DPRt Sulut';
  }

  // Kelas Desain Minimal & Bersih (Tanpa Warna-Warni Mencolok)
  const navItemClass = (isActive: boolean) =>
    `group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-blue-700 text-white shadow-xs'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;

  const iconContainerClass = (isActive: boolean) =>
    `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      isActive
        ? 'bg-white/20 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
    }`;

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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002B49] p-1.5 flex items-center justify-center shadow-xs">
                <img
                  src={nasdemLogo}
                  alt="Partai NasDem"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block">
                  PARTAI NASDEM
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block tracking-wider">
                  DPW SULAWESI UTARA
                </span>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="px-3 py-3 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">
            {/* Section 1: Dashboard & Struktur Organisasi */}
            <div>
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Struktur &amp; Tata Kelola
              </span>
              <div className="space-y-1">
                {/* 1. Dashboard Utama (HANYA untuk Super Admin, Ketua DPW, Ketua DPD, Ketua DPC) */}
                {hasDashboard && (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={navItemClass(activeTab === 'dashboard')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dashboard')}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Dashboard Utama</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dashboard'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW'
                            ? 'Ringkasan Eksekutif'
                            : `Wilayah ${session?.dpdAccess || session?.dpcAccess}`}
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
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'analytics')}>
                        <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Visualisasi &amp; Analitik</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'analytics'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Monitoring 15 Kab/Kota
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        activeTab === 'analytics'
                          ? 'bg-amber-400 text-slate-900 font-extrabold'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <Tv className="w-2.5 h-2.5" />
                      WAR ROOM
                    </span>
                  </button>
                )}

                {/* 2. Portal Mandiri Pengurus & Rekrutmen (DPW s/d DPRt) */}
                <button
                  onClick={() => handleNavClick('portal')}
                  className={navItemClass(activeTab === 'portal')}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={iconContainerClass(activeTab === 'portal')}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none">Portal Pengurus</span>
                      <span
                        className={`text-[10px] block mt-0.5 leading-none ${
                          activeTab === 'portal'
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Profil &amp; Rekrutmen
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeTab === 'portal'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    SK/KTA
                  </span>
                </button>

                {/* 3. Pengurus DPW (HANYA SUPER_ADMIN & ADMIN_DPW) */}
                {canAccessDpw && (
                  <button
                    onClick={() => handleNavClick('dpw')}
                    className={navItemClass(activeTab === 'dpw')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpw')}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Pengurus DPW</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpw'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          Tingkat Provinsi Sulut
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpd')}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Pengurus DPD</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpd'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {session?.role === 'ADMIN_DPD' ? session.dpdAccess : '15 Kab / Kota'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dpc')}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Pengurus DPC</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dpc'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {session?.role === 'ADMIN_DPC'
                            ? `Kec. ${session.dpcAccess}`
                            : 'Tingkat Kecamatan'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'dprt')}>
                        <Home className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Pengurus DPRt</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'dprt'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {session?.role === 'ADMIN_DPRT'
                            ? `Desa ${session.dprtAccess}`
                            : 'Ranting Desa / Kelurahan'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeTab === 'dprt'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      9 / Ranting
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Section 2: Database & Pencarian Anggota */}
            <div>
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Pencarian &amp; Data Anggota
              </span>
              <div className="space-y-1">
                {/* Pencarian Anggota / Database Kader */}
                <button
                  onClick={() => handleNavClick('members')}
                  className={navItemClass(activeTab === 'members')}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={iconContainerClass(activeTab === 'members')}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none">{membersNavTitle}</span>
                      <span
                        className={`text-[10px] block mt-0.5 leading-none ${
                          activeTab === 'members'
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {membersNavSubtitle}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      activeTab === 'members'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {totalMembersCount}
                  </span>
                </button>

                {/* Sinkronisasi ID (HANYA SUPER ADMIN & DPW) */}
                {(session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW') && (
                  <button
                    onClick={() => handleNavClick('sync')}
                    className={navItemClass(activeTab === 'sync')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={iconContainerClass(activeTab === 'sync')}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Sinkronisasi ID</span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-none ${
                            activeTab === 'sync'
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          KTA &amp; NIK Rekonsiliasi
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Section 3: Alat Operasional */}
            <div>
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Alat Operasional
              </span>
              <div className="space-y-1">
                {/* Kode Referral Saya (HANYA UNTUK PENGURUS - SUPER ADMIN TIDAK PERLU REFERRAL) */}
                {showReferral && onOpenReferralHub && (
                  <button
                    onClick={() => {
                      onOpenReferralHub();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none font-semibold">Kode Referral Saya</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                          Rekrutmen &amp; Ketua Langsung
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      KODE
                    </span>
                  </button>
                )}

                {/* Import Massal Excel */}
                {(session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW' || session?.role === 'ADMIN_DPD') && (
                  <button
                    onClick={() => {
                      onOpenBulkImport();
                      onCloseMobile();
                    }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span>Import Massal Excel</span>
                  </button>
                )}

                {/* Riwayat Audit (SUPER ADMIN & DPW) */}
                {(session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW') && (
                  <button
                    onClick={() => {
                      onOpenAuditModal();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <History className="w-4 h-4" />
                      </div>
                      <span>Riwayat Audit</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      {auditLogsCount}
                    </span>
                  </button>
                )}

                {/* Status Hapus / Permohonan Hapus */}
                {(session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW' || session?.role === 'ADMIN_DPD') && (
                  <button
                    onClick={() => {
                      onOpenDeletionApproval();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>
                        {session?.role === 'SUPER_ADMIN' ? 'Permohonan Hapus' : 'Status Hapus'}
                      </span>
                    </div>
                    {pendingDeletionCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white animate-pulse">
                        {pendingDeletionCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Manajemen Akun Admin: HANYA SUPER ADMIN (KETUA DPW TIDAK BISA MEMBUAT AKUN) */}
                {showUserMgmt && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      onOpenUserManagement();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors cursor-pointer mt-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Manajemen Akun</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 block">
                          Kelola Akses Admin
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold uppercase">
                      SUPER
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          {/* User Info Card */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {session?.adminName?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                    {session?.adminName || 'Admin'}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {session?.jabatan || session?.role}
                  </span>
                </div>
              </div>

              {/* Role Switcher button (Untuk simulasi / testing oleh admin) */}
              <button
                onClick={onOpenRoleModal}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Ganti Peran Sesi / Simulasi Role"
              >
                Ganti
              </button>
            </div>
          </div>

          {/* Quick Action Footer Buttons */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={onToggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'light' ? 'Beralih ke Mode Malam' : 'Beralih ke Mode Terang'}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">Terang</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenPrintReport}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cetak Laporan PDF Ringkasan Atasan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px]">Cetak</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Keluar dari Sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
