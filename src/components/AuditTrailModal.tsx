import React, { useState, useMemo } from 'react';
import { AuditLog, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  X,
  History,
  Clock,
  ArrowRight,
  Search,
  Filter,
  RotateCcw,
  Download,
  ShieldCheck,
  User,
  FileSpreadsheet,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  FileEdit,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { AuditService } from '../services/auditService';
import { saveAuditLogs } from '../utils/storage';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  session?: UserSession;
  onClearLogs?: () => void;
}

type ActionFilterType = 'ALL' | 'STATUS_CHANGE' | 'CREATE' | 'IMPORT_MASSAL' | 'UPDATE' | 'DELETE' | 'DELETE_REQUEST';
type TimeFilterType = 'ALL' | 'TODAY' | '7DAYS' | '30DAYS';

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  logs,
  session,
  onClearLogs,
}) => {
  // Clear All Audit State (Khusus Super Admin)
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string | null>(null);
  const [clearErrorMsg, setClearErrorMsg] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDpd, setSelectedDpd] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<ActionFilterType>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTime, setSelectedTime] = useState<TimeFilterType>('ALL');
  const [selectedActor, setSelectedActor] = useState<string>('ALL');

  const handleExecuteClearAll = async () => {
    setIsClearing(true);
    setClearErrorMsg(null);
    try {
      await AuditService.clearAll();
      saveAuditLogs([]);
      if (onClearLogs) onClearLogs();
      setShowConfirmClear(false);
      setClearSuccessMsg('Seluruh riwayat audit berhasil dibersihkan dari server database.');
      setTimeout(() => setClearSuccessMsg(null), 4000);
    } catch (err: any) {
      setClearErrorMsg(err.message || 'Gagal menghapus riwayat audit.');
    } finally {
      setIsClearing(false);
    }
  };

  // Set default DPD filter if user is local admin
  React.useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.dpdAccess && session.dpdAccess !== 'ALL') {
      setSelectedDpd(session.dpdAccess);
    }
  }, [session]);

  // Unique list of actors/operators from logs
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.actor) set.add(l.actor);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filter computation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search (Name, NIK, Actor, Reason, DPD)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = log.memberName.toLowerCase().includes(q);
        const matchNik = log.memberNik.toLowerCase().includes(q);
        const matchActor = log.actor?.toLowerCase().includes(q);
        const matchReason = log.reason?.toLowerCase().includes(q);
        const matchDpd = log.dpd?.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchActor && !matchReason && !matchDpd) {
          return false;
        }
      }

      // 2. DPD Filter
      if (selectedDpd !== 'ALL' && log.dpd !== selectedDpd) {
        return false;
      }

      // 3. Action Filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      // 4. Status Filter (matches newStatus or previousStatus)
      if (selectedStatus !== 'ALL') {
        const matchesNew = log.newStatus === selectedStatus;
        const matchesPrev = log.previousStatus === selectedStatus;
        if (!matchesNew && !matchesPrev) {
          return false;
        }
      }

      // 5. Actor Filter
      if (selectedActor !== 'ALL' && log.actor !== selectedActor) {
        return false;
      }

      // 6. Time Filter
      if (selectedTime !== 'ALL' && log.timestamp) {
        const logDate = new Date(log.timestamp.replace(' ', 'T'));
        if (!isNaN(logDate.getTime())) {
          const now = new Date();
          const diffMs = now.getTime() - logDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (selectedTime === 'TODAY' && diffDays > 1) return false;
          if (selectedTime === '7DAYS' && diffDays > 7) return false;
          if (selectedTime === '30DAYS' && diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedDpd, selectedAction, selectedStatus, selectedActor, selectedTime]);

  const hasActiveFilter =
    searchQuery.trim() !== '' ||
    selectedDpd !== 'ALL' ||
    selectedAction !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedTime !== 'ALL' ||
    selectedActor !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    if (!session || session.role === 'SUPER_ADMIN') {
      setSelectedDpd('ALL');
    }
    setSelectedAction('ALL');
    setSelectedStatus('ALL');
    setSelectedTime('ALL');
    setSelectedActor('ALL');
  };

  // Export filtered logs to CSV
  const handleExportCsv = () => {
    const headers = ['Timestamp', 'DPD Wilayah', 'Operator', 'NIK Kader', 'Nama Kader', 'Jenis Tindakan', 'Status Awal', 'Status Baru', 'Alasan/Keterangan'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.dpd}"`,
      `"${l.actor || '-'}"`,
      `'${l.memberNik}`,
      `"${l.memberName}"`,
      `"${l.action}"`,
      `"${l.previousStatus || '-'}"`,
      `"${l.newStatus || '-'}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AUDIT_LOG_NASDEM_SULUT_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return {
          label: 'Mutasi Status',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: RefreshCw,
        };
      case 'CREATE':
        return {
          label: 'Kader Baru',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: UserPlus,
        };
      case 'IMPORT_MASSAL':
        return {
          label: 'Import Excel',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          icon: FileSpreadsheet,
        };
      case 'UPDATE':
        return {
          label: 'Update Data',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: FileEdit,
        };
      case 'DELETE':
        return {
          label: 'Hapus Data',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: Trash2,
        };
      case 'DELETE_REQUEST':
        return {
          label: 'Permohonan Hapus',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: AlertTriangle,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
          icon: ShieldCheck,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl sm:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <History className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Log Riwayat Audit & Mutasi Keanggotaan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rekam jejak setiap mutasi, soft-delete, operator, dan alasan operasional lapangan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session?.role === 'SUPER_ADMIN' && logs.length > 0 && (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    disabled={isClearing}
                    className="btn-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                    title="Hapus Seluruh Riwayat Audit (Khusus Super Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span className="hidden sm:inline">Hapus Seluruh Riwayat</span>
                  </button>
                )}
                <button
                  onClick={handleExportCsv}
                  className="btn-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-emerald-400"
                  title="Ekspor Hasil Audit ke CSV/Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Ekspor CSV</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dialog Konfirmasi Hapus Seluruh Riwayat Audit (Khusus Super Admin) */}
            {showConfirmClear && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-100">
                      Konfirmasi Penghapusan Seluruh Riwayat Audit
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      Tindakan ini akan menghapus permanen <strong>{logs.length} catatan log audit mutasi</strong> dari server database. Apakah Anda yakin ingin membersihkan seluruh riwayat audit?
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={() => setShowConfirmClear(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleExecuteClearAll}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Seluruhnya</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {clearSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{clearSuccessMsg}</span>
              </div>
            )}

            {clearErrorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{clearErrorMsg}</span>
              </div>
            )}

            {/* FILTER TOOLBAR SECTION */}
            <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 space-y-3">
              {/* Row 1: Search Input & Time Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Search Bar */}
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama kader, NIK, operator, DPD, atau alasan mutasi..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Waktu */}
                <div className="sm:col-span-4 relative">
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value as TimeFilterType)}
                    className="w-full py-2 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Waktu</option>
                    <option value="TODAY">Hari Ini (24 Jam)</option>
                    <option value="7DAYS">7 Hari Terakhir</option>
                    <option value="30DAYS">30 Hari Terakhir</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Dropdown Filters (DPD, Jenis Tindakan, Status Mutasi, Operator) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. DPD Filter */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Wilayah DPD
                  </label>
                  <select
                    value={selectedDpd}
                    onChange={(e) => setSelectedDpd(e.target.value)}
                    disabled={Boolean(session && session.role !== 'SUPER_ADMIN' && session.dpdAccess && session.dpdAccess !== 'ALL')}
                    className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                  >
                    <option value="ALL">Semua Wilayah (15 DPD)</option>
                    {SULUT_REGIONS.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Action Filter */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Jenis Tindakan
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as ActionFilterType)}
                    className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Tindakan</option>
                    <option value="STATUS_CHANGE">Mutasi Status</option>
                    <option value="CREATE">Kader Baru</option>
                    <option value="IMPORT_MASSAL">Import Excel Massal</option>
                    <option value="UPDATE">Pembaruan Data</option>
                    <option value="DELETE">Penghapusan Data</option>
                    <option value="DELETE_REQUEST">Permohonan Hapus</option>
                  </select>
                </div>

                {/* 3. Status Filter */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Status Kader
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif (Pindah Partai/Mundur)">Pindah Partai / Mundur</option>
                    <option value="Non-Aktif (Pindah Domisili)">Pindah Domisili</option>
                    <option value="Non-Aktif (Meninggal)">Meninggal Dunia</option>
                    <option value="Non-Aktif (Ganda/Duplikat)">Duplikat / Ganda</option>
                  </select>
                </div>

                {/* 4. Operator Filter */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Operator / Aktor
                  </label>
                  <select
                    value={selectedActor}
                    onChange={(e) => setSelectedActor(e.target.value)}
                    className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Operator</option>
                    {uniqueActors.map((actor) => (
                      <option key={actor} value={actor}>
                        {actor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Bar & Reset Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Menampilkan <strong className="text-blue-600 dark:text-blue-400 font-mono">{filteredLogs.length}</strong> dari {logs.length} catatan
                  </span>
                  {hasActiveFilter && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/50">
                      Filter Aktif
                    </span>
                  )}
                </div>

                {hasActiveFilter && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Semua Filter</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content List of Audit Logs */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Filter className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Tidak Ada Catatan Audit yang Cocok
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Kriteria filter yang Anda terapkan tidak menemukan catatan riwayat. Silakan ubah filter atau reset.
                  </p>
                </div>
                {hasActiveFilter && (
                  <button
                    onClick={resetAllFilters}
                    className="btn-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const actionBadge = getActionBadge(log.action);
                const ActionIcon = actionBadge.icon;

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/90 text-xs space-y-2.5 transition-all shadow-xs hover:shadow-md"
                  >
                    {/* Top Row: Timestamp, DPD, Operator, Action Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.timestamp}</span>
                        <span>·</span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-300">
                          {log.dpd}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Action Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${actionBadge.color}`}
                        >
                          <ActionIcon className="w-3 h-3" />
                          <span>{actionBadge.label}</span>
                        </span>

                        {/* Operator */}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Oleh: <strong className="text-slate-800 dark:text-slate-200">{log.actor || 'Sistem'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Member Info & Status Mutation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {log.memberName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-2">
                          NIK: {log.memberNik}
                        </span>
                      </div>

                      {log.previousStatus && log.newStatus && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          <span className="text-emerald-700 dark:text-emerald-400 line-through opacity-75">
                            {log.previousStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {log.newStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Reason Statement */}
                    {log.reason && (
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 mt-1">
                        <span className="text-slate-500 font-semibold mr-1.5 uppercase text-[10px] tracking-wider">
                          Alasan:
                        </span>
                        <span className="italic">{log.reason}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <span className="font-mono">
              Total {filteredLogs.length} catatan ditampilkan
            </span>
            <button
              onClick={onClose}
              className="btn-white px-5 py-2 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
