import React from 'react';
import { UserSession } from '../../types';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';
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
  Shield,
  Printer,
  Moon,
  Sun,
  LogOut,
  X,
  Sparkles,
  KeyRound,
  UserCheck,
} from 'lucide-react';

export type MainNavTab = 'dashboard' | 'portal' | 'dpw' | 'dpd' | 'dpc' | 'dprt' | 'members' | 'sync';

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

  const canAccessDpw = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW';
  const canAccessDpd =
    session?.role === 'SUPER_ADMIN' ||
    session?.role === 'ADMIN_DPW' ||
    session?.role === 'ADMIN_DPD';
  const canAccessDpc =
    session?.role === 'SUPER_ADMIN' ||
    session?.role === 'ADMIN_DPW' ||
    session?.role === 'ADMIN_DPD' ||
    session?.role === 'ADMIN_DPC';
  const canAccessDprt = true;

  const navItemClass = (isActive: boolean) =>
    `group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;

  const iconContainerClass = (isActive: boolean, defaultColor: string) =>
    `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      isActive
        ? 'bg-white/20 text-white'
        : defaultColor
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-900 p-1.5 flex items-center justify-center shadow-xs">
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
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block tracking-wider">
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
              <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Struktur & Tata Kelola
              </span>
              <div className="space-y-1">
                {/* 1. Dashboard Utama */}
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={navItemClass(activeTab === 'dashboard')}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={iconContainerClass(
                        activeTab === 'dashboard',
                        'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      )}
                    >
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
                          : session?.dpdAccess}
                      </span>
                    </div>
                  </div>
                </button>

                {/* 1.5 Portal Mandiri Pengurus & Rekrutmen (DPW s/d DPRt) */}
                <button
                  onClick={() => handleNavClick('portal')}
                  className={navItemClass(activeTab === 'portal')}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={iconContainerClass(
                        activeTab === 'portal',
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      )}
                    >
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
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    KTA/SK
                  </span>
                </button>

                {/* 2. Pengurus DPW (HANYA SUPER_ADMIN & ADMIN_DPW) */}
                {canAccessDpw && (
                  <button
                    onClick={() => handleNavClick('dpw')}
                    className={navItemClass(activeTab === 'dpw')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={iconContainerClass(
                          activeTab === 'dpw',
                          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        )}
                      >
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

                {/* 3. Pengurus DPD (SUPER_ADMIN, ADMIN_DPW, ADMIN_DPD) */}
                {canAccessDpd && (
                  <button
                    onClick={() => handleNavClick('dpd')}
                    className={navItemClass(activeTab === 'dpd')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={iconContainerClass(
                          activeTab === 'dpd',
                          'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                        )}
                      >
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

                {/* 4. Pengurus DPC (SUPER_ADMIN, ADMIN_DPW, ADMIN_DPD, ADMIN_DPC) */}
                {canAccessDpc && (
                  <button
                    onClick={() => handleNavClick('dpc')}
                    className={navItemClass(activeTab === 'dpc')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={iconContainerClass(
                          activeTab === 'dpc',
                          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
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

                {/* 5. Pengurus DPRt (Semua Role dapat akses ke ranting wilayahnya) */}
                {canAccessDprt && (
                  <button
                    onClick={() => handleNavClick('dprt')}
                    className={navItemClass(activeTab === 'dprt')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={iconContainerClass(
                          activeTab === 'dprt',
                          'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        )}
                      >
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

            {/* Section 2: Database Kader & ID */}
            <div>
              <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Database Anggota
              </span>
              <div className="space-y-1">
                {/* Kader Daerah */}
                <button
                  onClick={() => handleNavClick('members')}
                  className={navItemClass(activeTab === 'members')}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={iconContainerClass(
                        activeTab === 'members',
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      )}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none">Kader Daerah</span>
                      <span
                        className={`text-[10px] block mt-0.5 leading-none ${
                          activeTab === 'members'
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Semua Anggota & e-KTA
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

                {/* Sinkronisasi ID */}
                <button
                  onClick={() => handleNavClick('sync')}
                  className={navItemClass(activeTab === 'sync')}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={iconContainerClass(
                        activeTab === 'sync',
                        'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                      )}
                    >
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
                        KTA & NIK Rekonsiliasi
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: Operasional Cepat */}
            <div>
              <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                Operasional Cepat
              </span>
              <div className="space-y-1">
                {onOpenReferralHub && (
                  <button
                    onClick={() => {
                      onOpenReferralHub();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent hover:from-amber-500/25 hover:to-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 transition-all cursor-pointer shadow-xs mb-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none font-bold">Kode Referral Saya</span>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium mt-0.5 block">
                          Rekrutmen &amp; Ketua Langsung
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.5 rounded">
                      REKRUT
                    </span>
                  </button>
                )}
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      {pendingDeletionCount}
                    </span>
                  )}
                </button>

                {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      onOpenUserManagement();
                      onCloseMobile();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer shadow-xs mt-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block leading-none">Manajemen Akun</span>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-normal mt-0.5 block">
                          Hak Akses Admin
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase">
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
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full text-white font-extrabold flex items-center justify-center text-xs shadow-2xs shrink-0 ${
                session?.role === 'SUPER_ADMIN'
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-600 ring-2 ring-amber-400/50'
                  : session?.role === 'ADMIN_DPW'
                  ? 'bg-blue-600'
                  : 'bg-slate-700'
              }`}>
                {session?.adminName ? session.adminName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="leading-tight overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate block max-w-[110px]">
                    {session?.adminName || 'Admin'}
                  </span>
                  {session?.role === 'SUPER_ADMIN' && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white uppercase tracking-wider shrink-0">
                      SUPER
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block truncate max-w-[130px]">
                  {session?.adminNik ? `NIK: ${session.adminNik}` : (session?.jabatan || 'Super Admin')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
                <button
                  onClick={onOpenUserManagement}
                  title="Manajemen Akun & Hak Akses Admin"
                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onOpenRoleModal}
                title="Ganti Peran Hak Akses"
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'light' ? 'Mode Malam' : 'Mode Terang'}
              className="btn-white flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Print Report PDF */}
            <button
              onClick={onOpenPrintReport}
              title="Cetak Laporan PDF Atasan"
              className="btn-white flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-blue-600 dark:text-blue-400"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Keluar / Ganti Akun"
              className="btn-white flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default AppSidebar;
