import React from 'react';
import { UserSession } from '../../types';
import { FileSpreadsheet, Printer, KeyRound, Download, RefreshCw, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  session?: UserSession;
  onExportExcel: () => void;
  onOpenPrintReport: () => void;
  onOpenUserManagement?: () => void;
  onOpenDownloadTemplate?: () => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onOpenReferralHub?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  session,
  onExportExcel,
  onOpenPrintReport,
  onOpenUserManagement,
  onOpenDownloadTemplate,
  onRefreshCloud,
  isRefreshingCloud = false,
  onOpenReferralHub,
}) => {
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const isDpc = session?.role === 'ADMIN_DPC';
  const isDpd = session?.role === 'ADMIN_DPD';

  let dashboardTitle = 'Dashboard Keanggotaan & Struktur Partai NasDem Sulawesi Utara';
  let dashboardSubtitle = 'Pusat komando eksekutif DPW Partai NasDem Sulut: memantau kekuatan kader aktif riil dan kelengkapan struktur (DPW → DPD → DPC → DPRt).';

  if (isDpc && session.dpcAccess) {
    dashboardTitle = `Dashboard Teritorial DPC Kec. ${session.dpcAccess}`;
    dashboardSubtitle = `Memantau kader aktif dan kelengkapan struktur pengurus DPC & DPRt di wilayah Kec. ${session.dpcAccess} (${session.dpdAccess}).`;
  } else if (isDpd && session.dpdAccess) {
    dashboardTitle = `Dashboard Keanggotaan DPD ${session.dpdAccess}`;
    dashboardSubtitle = `Memantau kekuatan kader aktif riil, sebaran anggota per kecamatan (DPC), dan kelengkapan pengurus di wilayah ${session.dpdAccess}.`;
  } else if (session?.role === 'ADMIN_DPW') {
    dashboardTitle = 'Dashboard Eksekutif Ketua DPW Partai NasDem Sulawesi Utara';
    dashboardSubtitle = 'Memantau seluruh pergerakan kader dan struktur organisasi dari tingkat DPD, DPC, hingga DPRt se-Sulawesi Utara.';
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-colors">
      <div>
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 uppercase tracking-wider">
              SUPER ADMIN
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Monitoring Teritorial &bull; {session?.jabatan}
            </span>
          )}
          <span className="text-slate-300 dark:text-slate-700">&bull;</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {isSuperAdmin
              ? (session?.adminNik ? `NIK: ${session.adminNik} (Akses Penuh)` : 'Akses Penuh 15 Kab/Kota')
              : (session?.dpdAccess && session.dpdAccess !== 'ALL' ? session.dpdAccess : 'Sulawesi Utara')}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          {dashboardTitle}
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          {dashboardSubtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {session?.role !== 'SUPER_ADMIN' && onOpenReferralHub && (
          <button
            onClick={onOpenReferralHub}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 text-white cursor-pointer shadow-xs transition-colors"
            title="Buka panel kode referral pengurus, bagikan ke WhatsApp, dan pantau rekrutmen"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kode Referral Saya</span>
          </button>
        )}
        {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer shadow-xs transition-colors"
            title="Buka panel manajemen akun & hak akses admin se-Sulut"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Kelola Akun Admin</span>
          </button>
        )}
        {onOpenDownloadTemplate && (
          <button
            onClick={onOpenDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
            title="Unduh format template resmi Excel untuk DPW, DPD, DPC, atau DPRt"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Unduh Template</span>
          </button>
        )}
        {onRefreshCloud && (
          <button
            onClick={onRefreshCloud}
            disabled={isRefreshingCloud}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white cursor-pointer shadow-xs transition-colors"
            title="Tarik & sinkronkan ulang seluruh data kader dan pengurus langsung dari Supabase live"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
            <span>{isRefreshingCloud ? 'Menarik Data...' : 'Sinkron Supabase'}</span>
          </button>
        )}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs transition-colors"
          title="Unduh seluruh data anggota aktif dalam format Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>Ekspor Excel</span>
        </button>
        <button
          onClick={onOpenPrintReport}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs transition-colors"
          title="Buka laporan eksekutif resmi untuk dicetak / PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>Cetak Laporan</span>
        </button>
      </div>
    </div>
  );
};
