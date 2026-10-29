import React from 'react';
import { UserSession } from '../../types';
import {
  FileSpreadsheet,
  Printer,
  KeyRound,
  Download,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface DashboardHeaderProps {
  session?: UserSession;
  onExportExcel: () => void;
  onOpenPrintReport: () => void;
  onOpenUserManagement?: () => void;
  onOpenDownloadTemplate?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  session,
  onExportExcel,
  onOpenPrintReport,
  onOpenUserManagement,
  onOpenDownloadTemplate,
}) => {
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const isDpc = session?.role === 'ADMIN_DPC';
  const isDpd = session?.role === 'ADMIN_DPD';
  const isDpwAdmin = session?.role === 'ADMIN_DPW';

  let dashboardTitle = 'Dashboard Struktur & Keanggotaan Partai NasDem Sulawesi Utara';
  let dashboardSubtitle =
    'Pusat komando eksekutif DPW Partai NasDem Sulut: memantau kekuatan kader aktif riil dan kelengkapan struktur.';

  if (isDpc && session.dpcAccess) {
    dashboardTitle = `Dashboard Teritorial DPC Kec. ${session.dpcAccess}`;
    dashboardSubtitle = `Memantau kader aktif dan kelengkapan struktur pengurus DPC & DPRt di wilayah Kec. ${session.dpcAccess} (${session.dpdAccess}).`;
  } else if (isDpd && session.dpdAccess) {
    dashboardTitle = `Dashboard Keanggotaan DPD ${session.dpdAccess}`;
    dashboardSubtitle = `Memantau kekuatan kader aktif riil, sebaran anggota per kecamatan (DPC), dan kelengkapan pengurus di wilayah ${session.dpdAccess}.`;
  } else if (isDpwAdmin) {
    dashboardTitle = 'Dashboard Eksekutif Ketua DPW Partai NasDem Sulawesi Utara';
    dashboardSubtitle =
      'Memantau seluruh pergerakan kader dan struktur organisasi dari tingkat DPD, DPC, hingga DPRt se-Sulawesi Utara.';
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 md:p-6 xl:p-7 shadow-xs transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      {/* ========================================================================= */}
      {/* LEFT SECTION: BRANDING, TITLE & RESPONSIVE SUBTITLE                       */}
      {/* ========================================================================= */}
      <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
        {/* Top Badges & Role Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              SUPER ADMIN
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {session?.jabatan || 'Pengurus DPW'}
            </span>
          )}

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>

          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            {isSuperAdmin
              ? session?.adminNik
                ? `NIK: ${session.adminNik}`
                : 'Akses Penuh 15 Kab/Kota'
              : session?.dpdAccess && session.dpdAccess !== 'ALL'
              ? session.dpdAccess
              : 'Provinsi Sulawesi Utara'}
          </span>

          {/* Quick Territorial Counts Pill (Tablet & PC Landscape) */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Building2 className="w-3 h-3 text-blue-500" />
            <span>15 DPD &bull; 171 DPC &bull; 1.602 DPRt</span>
          </span>
        </div>

        {/* Responsive Heading */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug break-words">
          {dashboardTitle}
        </h2>

        {/* Responsive Subtitle */}
        <p className="text-xs sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
          {dashboardSubtitle}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: RESPONSIVE ACTIONS (MOBILE vs TABLET vs PC LANDSCAPE)     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
        {/* PRIMARY ACTIONS: ADMIN (Super Admin only) */}
        {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Super Admin User Management */}
          {(
            <button
              onClick={onOpenUserManagement}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
              title="Buka panel manajemen akun & hak akses admin se-Sulut"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Kelola Akun</span>
            </button>
          )}
        </div>
        )}

        {/* ROW 2 (Mobile) / SECONDARY ACTIONS (Tablet & Desktop): TEMPLATE, EXCEL, PRINT */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenDownloadTemplate && (
            <button
              onClick={onOpenDownloadTemplate}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
              title="Unduh format template resmi Excel untuk DPW, DPD, DPC, atau DPRt"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate">Template</span>
            </button>
          )}

          <button
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
            title="Unduh seluruh data anggota aktif dalam format Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">
              <span className="hidden xs:inline">Ekspor </span>Excel
            </span>
          </button>

          <button
            onClick={onOpenPrintReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
            title="Buka laporan eksekutif resmi untuk dicetak / PDF"
          >
            <Printer className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate">
              <span className="hidden xs:inline">Cetak </span>PDF
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
