import React from 'react';
import { UserSession } from '../../types';
import { FileSpreadsheet, Printer, KeyRound } from 'lucide-react';

interface DashboardHeaderProps {
  session?: UserSession;
  onExportExcel: () => void;
  onOpenPrintReport: () => void;
  onOpenUserManagement?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  session,
  onExportExcel,
  onOpenPrintReport,
  onOpenUserManagement,
}) => {
  const isSuperAdmin = !session || session.role === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-colors">
      <div>
        <div className="flex items-center gap-2">
          {session?.role === 'SUPER_ADMIN' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-rose-600 text-white uppercase tracking-wider shadow-xs">
              SUPER ADMIN
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {!isSuperAdmin ? `Monitoring Teritorial · ${session?.jabatan}` : 'Executive Briefing & Monitoring'}
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {session?.role === 'SUPER_ADMIN'
              ? (session?.adminNik ? `NIK Super Admin: ${session.adminNik}` : 'Akses Penuh 15 Kab/Kota')
              : (!isSuperAdmin ? `DPD NasDem ${session?.dpdAccess}` : 'DPW Partai NasDem Sulut')}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          {!isSuperAdmin
            ? `Dashboard Keanggotaan DPD ${session.dpdAccess}`
            : 'Dashboard Keanggotaan dan struktur Partai NasDem Sulawesi Utara'}
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          {!isSuperAdmin
            ? `Memantau kekuatan kader aktif riil, sebaran anggota per kecamatan (DPC), dan kelengkapan pengurus di wilayah ${session.dpdAccess}.`
            : 'Pusat komando eksekutif DPW Partai NasDem Sulut: memantau kekuatan kader aktif riil, kelengkapan struktur (DPW → DPD → DPC → DPRt).'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {session?.role === 'SUPER_ADMIN' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 cursor-pointer shadow-xs transition-colors"
            title="Buka panel manajemen akun & hak akses admin se-Sulut"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Kelola Akun Admin</span>
          </button>
        )}
        <button
          onClick={onExportExcel}
          className="btn-white flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Unduh seluruh data anggota aktif dalam format Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
        <button
          onClick={onOpenPrintReport}
          className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Buka laporan eksekutif resmi untuk dicetak / PDF"
        >
          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Cetak Laporan Atasan</span>
        </button>
      </div>
    </div>
  );
};
