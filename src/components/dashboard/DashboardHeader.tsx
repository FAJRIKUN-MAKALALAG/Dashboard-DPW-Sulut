import React, { useState, useMemo } from 'react';
import { UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../../utils/structureReadinessUtils';
import {
  FileSpreadsheet,
  Printer,
  KeyRound,
  Download,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
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
  const [showActions, setShowActions] = useState<boolean>(false);

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const isDpc = session?.role === 'ADMIN_DPC';
  const isDpd = session?.role === 'ADMIN_DPD';
  const isDpwAdmin = session?.role === 'ADMIN_DPW';
  const isDprt = session?.role === 'ADMIN_DPRT';

  // Hitung jumlah DPC dan DPRt kontekstual sesuai wilayah akun
  const currentRegion = useMemo(() => {
    if (!session?.dpdAccess || session.dpdAccess === 'ALL') return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, session.dpdAccess)) || null;
  }, [session?.dpdAccess]);

  const currentSub = useMemo(() => {
    if (!currentRegion || !session?.dpcAccess || session.dpcAccess === 'ALL' || session.dpcAccess === 'Umum (DPD)') return null;
    return currentRegion.subdistricts.find((s) => isDpcMatch(s.name, session.dpcAccess)) || null;
  }, [currentRegion, session?.dpcAccess]);

  const regionDpcCount = currentRegion ? currentRegion.subdistricts.length : 0;
  const regionDprtCount = currentRegion
    ? currentRegion.subdistricts.reduce((acc, s) => acc + s.villages.length, 0)
    : 0;
  const dpcVillagesCount = currentSub ? currentSub.villages.length : 0;

  let dashboardTitle = 'Dashboard Struktur & Keanggotaan Partai NasDem Sulut';
  let dashboardSubtitle =
    'Pusat komando eksekutif DPW Partai NasDem Sulut: memantau kekuatan kader aktif riil dan kelengkapan struktur.';

  if (isDpc && session.dpcAccess && session.dpcAccess !== 'ALL') {
    dashboardTitle = `Dashboard Teritorial DPC Kec. ${session.dpcAccess}`;
    dashboardSubtitle = `Memantau kader aktif dan kelengkapan struktur pengurus DPC & DPRt di wilayah Kec. ${session.dpcAccess} (${session.dpdAccess}).`;
  } else if (isDpd && session.dpdAccess && session.dpdAccess !== 'ALL') {
    dashboardTitle = `Dashboard Keanggotaan DPD ${session.dpdAccess}`;
    dashboardSubtitle = `Memantau kekuatan kader aktif riil, sebaran anggota per kecamatan (DPC), dan kelengkapan pengurus di wilayah ${session.dpdAccess}.`;
  } else if (isDprt && session.dprtAccess && session.dprtAccess !== 'ALL') {
    dashboardTitle = `Dashboard Teritorial DPRt ${session.dprtAccess}`;
    dashboardSubtitle = `Memantau kader aktif dan kelengkapan struktur pengurus DPRt di wilayah ${session.dprtAccess} (Kec. ${session.dpcAccess}).`;
  } else if (isDpwAdmin) {
    dashboardTitle = 'Dashboard Eksekutif Ketua DPW Partai NasDem Sulut';
    dashboardSubtitle =
      'Memantau seluruh pergerakan kader dan struktur organisasi dari tingkat DPD, DPC, hingga DPRt se-Sulawesi Utara.';
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      {/* ========================================================================= */}
      {/* LEFT SECTION: BRANDING, TITLE & RESPONSIVE SUBTITLE                       */}
      {/* ========================================================================= */}
      <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
        {/* Top Badges & Role Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              SUPER ADMIN
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {session?.jabatan || 'Pengurus DPW'}
            </span>
          )}

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>

          <span className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            {isSuperAdmin
              ? session?.adminNik
                ? `NIK: ${session.adminNik}`
                : 'Akses Penuh 15 Kab/Kota'
              : isDpc && session?.dpcAccess && session.dpcAccess !== 'ALL'
              ? `Kec. ${session.dpcAccess} (${session?.dpdAccess || ''})`
              : isDprt && session?.dprtAccess && session.dprtAccess !== 'ALL'
              ? `DPRt ${session.dprtAccess} (${session?.dpcAccess || ''})`
              : session?.dpdAccess && session.dpdAccess !== 'ALL'
              ? session.dpdAccess
              : 'Provinsi Sulawesi Utara'}
          </span>

          {/* Quick Territorial Counts Pill (Tablet & PC Landscape) */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Building2 className="w-3 h-3 text-blue-500" />
            {isDpc && session?.dpcAccess && session.dpcAccess !== 'ALL' ? (
              <span>1 DPC Kec. {session.dpcAccess} &bull; {dpcVillagesCount} DPRt (Desa/Kelurahan)</span>
            ) : isDprt && session?.dprtAccess && session.dprtAccess !== 'ALL' ? (
              <span>1 DPRt {session.dprtAccess} (Desa/Kelurahan)</span>
            ) : isDpd && session?.dpdAccess && session.dpdAccess !== 'ALL' ? (
              <span>1 DPD &bull; {regionDpcCount} DPC &bull; {regionDprtCount} DPRt</span>
            ) : (
              <span>15 DPD &bull; 171 DPC &bull; 1.602 DPRt</span>
            )}
          </span>
        </div>

        {/* Responsive Heading - Scaled down for sleek readability */}
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug break-words">
          {dashboardTitle}
        </h2>

        {/* Responsive Subtitle - Hidden on mobile to remove micro-text clutter */}
        <p className="hidden sm:block text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
          {dashboardSubtitle}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: ACTIONS WITH HIDE/SHOW TOGGLE                              */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* PRIMARY ACTIONS: ADMIN (Super Admin only) */}
        {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
            title="Buka panel manajemen akun & hak akses admin se-Sulut"
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Kelola Akun</span>
          </button>
        )}

        {/* Hide / Show Toggle Button */}
        <button
          type="button"
          onClick={() => setShowActions(!showActions)}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer transition-colors shadow-2xs ${
            showActions
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
              : 'btn-white text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={showActions ? 'Sembunyikan tombol ekspor dan aksi' : 'Tampilkan tombol ekspor dan dokumen'}
        >
          {showActions ? (
            <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{showActions ? 'Hide Tombol' : 'Aksi & Ekspor'}</span>
        </button>

        {/* Secondary Actions Collapsible */}
        {showActions && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 animate-in fade-in duration-150">
            {onOpenDownloadTemplate && (
              <button
                onClick={onOpenDownloadTemplate}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
                title="Unduh format template resmi Excel"
              >
                <Download className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                <span>Template</span>
              </button>
            )}

            <button
              onClick={onExportExcel}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
              title="Unduh data anggota aktif dalam format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={onOpenPrintReport}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
              title="Cetak laporan eksekutif resmi / PDF"
            >
              <Printer className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Cetak PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
