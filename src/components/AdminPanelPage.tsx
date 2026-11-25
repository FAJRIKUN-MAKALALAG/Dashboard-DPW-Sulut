import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Database,
  FileCheck2,
  History,
  MapPin,
  MessageSquare,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { AdminPanelService, AdminPanelTelemetry } from '../services/adminPanelService';

type PollIntervalOption = 5000 | 10000 | 30000 | 0;

const fmtNum = (val: number | undefined | null): string =>
  Number(val ?? 0).toLocaleString('id-ID');

const fmtTime = (date: Date | null): string => {
  if (!date) return '—';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tambah Kader',
  UPDATE: 'Ubah Data',
  STATUS_CHANGE: 'Mutasi Status',
  BULK_IMPORT: 'Impor Massal',
  DELETE: 'Hapus Kader',
  DELETE_REQUEST: 'Ajukan Hapus',
  DELETE_REJECT: 'Tolak Hapus',
};

const TABLE_LABELS: Array<{ key: keyof AdminPanelTelemetry['database']['tables']; label: string }> = [
  { key: 'members', label: 'members' },
  { key: 'positions', label: 'positions' },
  { key: 'structure_slots', label: 'structure_slots' },
  { key: 'app_users', label: 'app_users' },
  { key: 'audit_logs', label: 'audit_logs' },
  { key: 'deletion_requests', label: 'deletion_requests' },
  { key: 'support_messages', label: 'support_messages' },
  { key: 'inventory_items', label: 'inventory_items' },
];

export const AdminPanelPage: React.FC = () => {
  const [data, setData] = useState<AdminPanelTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollIntervalMs, setPollIntervalMs] = useState<PollIntervalOption>(10000);
  const [isDpdExpanded, setIsDpdExpanded] = useState<boolean>(true);

  const fetchTelemetry = useCallback(async (fresh = false) => {
    setIsRefreshing(true);
    try {
      const res = await AdminPanelService.getTelemetry(fresh);
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat telemetri real-time.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry(false);
  }, [fetchTelemetry]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        fetchTelemetry(false);
      }
    }, pollIntervalMs);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchTelemetry(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pollIntervalMs, fetchTelemetry]);

  if (isLoading && !data) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const sessions = data?.sessions;
  const members = data?.members;
  const territories = data?.territories;
  const records = data?.records;
  const database = data?.database;
  const isPaused = pollIntervalMs === 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar (selaras dengan DashboardHeader.tsx) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#1A3282] text-white flex items-center justify-center shrink-0 border border-[#FFDD00]/40 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1A3282] text-white dark:bg-[#21409A] uppercase tracking-wider font-mono">
                <ShieldCheck className="w-3 h-3 text-[#FFDD00]" />
                SUPER ADMIN
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase font-mono border ${
                  isPaused
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPaused ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                {isPaused ? 'JEDA' : 'LIVE'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Panel Admin — Telemetri Real-Time
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pantauan angka real-time seluruh wilayah, anggota, sesi login &amp; pencatatan database (non-keuangan).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <span
            className="text-[11px] text-slate-500 dark:text-slate-400 font-mono px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70"
            data-tabular="true"
          >
            Update: {fmtTime(lastUpdated)}
          </span>

          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700">
            {(
              [
                { value: 5000, label: '5d' },
                { value: 10000, label: '10d' },
                { value: 30000, label: '30d' },
                { value: 0, label: 'Jeda' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPollIntervalMs(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  pollIntervalMs === opt.value
                    ? 'bg-[#1A3282] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1A3282] hover:bg-[#21409A] text-white transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>Pembaruan sementara tertunda: {error}</span>
          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            className="font-semibold underline cursor-pointer shrink-0"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* 1. 4 Kartu Hero Utama (selaras dengan ExecutiveKpiCards.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Sedang Login / Online
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div
            className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight"
            data-tabular="true"
          >
            {fmtNum(sessions?.onlineNow)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            Aktif {sessions?.onlineWindowMinutes ?? 3} mnt terakhir ·{' '}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" data-tabular="true">
              {fmtNum(sessions?.activeToday)}
            </span>{' '}
            hari ini
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#1A3282] dark:border-t-[#21409A] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Total Keseluruhan Kader
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#1A3282] dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight"
            data-tabular="true"
          >
            {fmtNum(members?.total)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" data-tabular="true">
              {fmtNum(members?.aktif)}
            </span>{' '}
            Aktif ·{' '}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" data-tabular="true">
              {fmtNum(members?.nonAktif)}
            </span>{' '}
            Non-Aktif
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#21409A] dark:border-t-blue-500 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Anggota Biasa
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight"
            data-tabular="true"
          >
            {fmtNum(members?.anggotaBiasa)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" data-tabular="true">
              {fmtNum(members?.pengurus)}
            </span>{' '}
            Pengurus Struktural
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#1A3282] dark:border-t-[#21409A] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Total Record Database
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#1A3282] dark:text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight"
            data-tabular="true"
          >
            {fmtNum(database?.totalRecordsNonFinance)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            8 tabel inti (tanpa laporan keuangan)
          </p>
        </div>
      </div>

      {/* 2. Sesi & Akun Pengguna */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Sesi &amp; Akun Pengguna
          </h2>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            app_users · ≤ {sessions?.onlineWindowMinutes ?? 3} mnt
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Online Sekarang', val: sessions?.onlineNow, accent: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Aktif Hari Ini', val: sessions?.activeToday },
            { label: 'Total Akun', val: sessions?.totalAccounts },
            { label: 'Akun Aktif', val: sessions?.activeAccounts },
            { label: 'Akun Non-Aktif', val: sessions?.inactiveAccounts },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
              <div
                className={`mt-0.5 text-base sm:text-lg font-bold font-mono tracking-tight ${item.accent || 'text-slate-900 dark:text-white'}`}
                data-tabular="true"
              >
                {fmtNum(item.val)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            Sedang Online per Kategori Peran (Online / Total Akun)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(
              [
                { key: 'superAdmin', label: 'Super Admin' },
                { key: 'ketua', label: 'Ketua Wilayah' },
                { key: 'adminDelegasi', label: 'Admin Delegasi' },
                { key: 'pengurus', label: 'Pengurus' },
                { key: 'anggotaKhusus', label: 'Anggota / Khusus' },
              ] as const
            ).map((cat) => (
              <div
                key={cat.key}
                className="flex items-center justify-between rounded-xl px-3 py-2 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80"
              >
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                  {cat.label}
                </span>
                <span
                  className="text-xs font-bold font-mono text-slate-900 dark:text-white ml-2 shrink-0"
                  data-tabular="true"
                >
                  {fmtNum(sessions?.onlineByCategory[cat.key])} / {fmtNum(sessions?.accountsByCategory[cat.key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Data Kader, Kelengkapan Dokumen & Laju Rekrutmen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
            Komposisi &amp; Status Kader
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Pengurus SK', val: members?.pengurus },
              { label: 'Anggota Biasa', val: members?.anggotaBiasa },
              { label: 'Status Aktif', val: members?.aktif },
              { label: 'Status Non-Aktif', val: members?.nonAktif },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div
                  className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 tracking-tight"
                  data-tabular="true"
                >
                  {fmtNum(item.val)}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400">Meninggal</div>
              <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-200" data-tabular="true">
                {fmtNum(members?.meninggal)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Mundur / Pindah</div>
              <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-200" data-tabular="true">
                {fmtNum(members?.mundurPindahPartai)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Pindah Domisili</div>
              <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-200" data-tabular="true">
                {fmtNum(members?.pindahDomisili)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FileCheck2 className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
            Kelengkapan e-KTA &amp; Berkas
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Sudah Punya e-KTA', val: members?.withEkta },
              { label: 'Belum Ada e-KTA', val: members?.withoutEkta },
              { label: 'Ada Foto KTP', val: members?.withKtpPhoto },
              { label: 'Ada Foto Profil', val: members?.withProfilePhoto },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div
                  className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 tracking-tight"
                  data-tabular="true"
                >
                  {fmtNum(item.val)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
            Laju Rekrutmen &amp; Referral
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Masuk Hari Ini', val: members?.joinedToday },
              { label: '7 Hari Terakhir', val: members?.joinedLast7Days },
              { label: '30 Hari Terakhir', val: members?.joinedLast30Days },
              { label: 'Via Kode Referral', val: members?.viaReferral },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div
                  className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 tracking-tight"
                  data-tabular="true"
                >
                  {fmtNum(item.val)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Keseluruhan Wilayah, Jabatan Struktural & Slot Kepengurusan */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
            Keseluruhan Wilayah &amp; Struktur Kepengurusan
          </h2>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            positions · structure_slots
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'DPD Terdata', val: territories?.dpdCount },
            { label: 'DPC Terdata', val: territories?.dpcCount },
            { label: 'DPRt Terdata', val: territories?.dprtCount },
            { label: 'Total Jabatan SK', val: territories?.positionsTotal },
            { label: 'Total Slot Kursi', val: territories?.slots.total },
            { label: 'Slot Terisi', val: territories?.slots.filled },
            { label: 'Slot Lowong', val: territories?.slots.vacant },
            { label: 'Keterisian Slot', valStr: `${(territories?.slots.fillRate ?? 0).toLocaleString('id-ID')}%` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </div>
              <div
                className="mt-0.5 text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tracking-tight"
                data-tabular="true"
              >
                {'valStr' in item && item.valStr ? item.valStr : fmtNum(item.val)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {(['DPW', 'DPD', 'DPC', 'DPRt'] as const).map((lvl) => {
            const posCnt = territories?.positionsByLevel[lvl] ?? 0;
            const slotInfo = territories?.slots.byLevel[lvl] ?? { total: 0, filled: 0, vacant: 0 };
            return (
              <div
                key={lvl}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-heading font-bold text-[#1A3282] dark:text-blue-400">{lvl}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Jabatan:{' '}
                    <strong className="font-mono font-bold text-slate-800 dark:text-slate-200" data-tabular="true">
                      {fmtNum(posCnt)}
                    </strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                    {fmtNum(slotInfo.filled)} / {fmtNum(slotInfo.total)} slot
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono" data-tabular="true">
                    Lowong: {fmtNum(slotInfo.vacant)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Ringkasan Angka per 15 Kab/Kota (DPD) */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Angka Keseluruhan per Wilayah DPD (Kab/Kota)
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Total kader · Pengurus · Anggota Biasa · Aktif
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDpdExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <span>{isDpdExpanded ? 'Sembunyikan' : 'Tampilkan'}</span>
            {isDpdExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isDpdExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 pt-1">
            {(territories?.perDpd ?? []).map((row) => (
              <div
                key={row.dpd}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={row.dpd}>
                    {row.dpd}
                  </span>
                  <span
                    className="text-sm font-bold font-mono text-[#1A3282] dark:text-blue-400 shrink-0"
                    data-tabular="true"
                  >
                    {fmtNum(row.total)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                  <div>
                    <span className="block text-[9px] text-slate-400">Pengurus</span>
                    <strong className="font-mono font-bold text-slate-700 dark:text-slate-200" data-tabular="true">
                      {fmtNum(row.pengurus)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">Anggota</span>
                    <strong className="font-mono font-bold text-slate-700 dark:text-slate-200" data-tabular="true">
                      {fmtNum(row.anggotaBiasa)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">Aktif</span>
                    <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400" data-tabular="true">
                      {fmtNum(row.aktif)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Seluruh Pencatatan Sistem & Inventaris Kantor (Non-Keuangan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Audit Logs */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
              Jejak Audit
            </h2>
            <span className="text-[10px] font-mono text-slate-400">audit_logs</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-2.5 py-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                {fmtNum(records?.auditLogs.total)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-2.5 py-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Hari Ini</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                {fmtNum(records?.auditLogs.today)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-2.5 py-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">7 Hari</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                {fmtNum(records?.auditLogs.last7Days)}
              </div>
            </div>
          </div>
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            {Object.entries(records?.auditLogs.byAction ?? {}).map(([action, count]) => (
              <div key={action} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {AUDIT_ACTION_LABELS[action] || action}
                </span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200" data-tabular="true">
                  {fmtNum(count)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Deletion Requests */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
              Pengajuan Hapus
            </h2>
            <span className="text-[10px] font-mono text-slate-400">deletion_requests</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total Pengajuan', val: records?.deletionRequests.total },
              { label: 'Menunggu (Pending)', val: records?.deletionRequests.pending, highlight: 'text-amber-600 dark:text-amber-400' },
              { label: 'Disetujui', val: records?.deletionRequests.approved },
              { label: 'Ditolak', val: records?.deletionRequests.rejected },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
                <div
                  className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${item.highlight || 'text-slate-900 dark:text-white'}`}
                  data-tabular="true"
                >
                  {fmtNum(item.val)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Support Chat */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
              Live Support Chat
            </h2>
            <span className="text-[10px] font-mono text-slate-400">support_messages</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Total Pesan Tercatat', val: records?.supportChat.totalMessages },
              { label: 'Total Room / Thread', val: records?.supportChat.totalThreads },
              { label: 'Pesan Belum Dibaca', val: records?.supportChat.unreadMessages, highlight: 'text-rose-600 dark:text-rose-400' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                <span
                  className={`text-base sm:text-lg font-bold font-mono ${item.highlight || 'text-slate-900 dark:text-white'}`}
                  data-tabular="true"
                >
                  {fmtNum(item.val)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Inventory */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
              Inventaris Kantor
            </h2>
            <span className="text-[10px] font-mono text-slate-400">inventory_items</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Jenis Item</div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                {fmtNum(records?.inventory.totalItems)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2">
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total Unit</div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white" data-tabular="true">
                {fmtNum(records?.inventory.totalUnits)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-1.5">
              <div className="text-[10px] text-slate-400">Baik</div>
              <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400" data-tabular="true">
                {fmtNum(records?.inventory.baik)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-1.5">
              <div className="text-[10px] text-slate-400">Perbaikan</div>
              <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400" data-tabular="true">
                {fmtNum(records?.inventory.perbaikan)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-1.5">
              <div className="text-[10px] text-slate-400">Rusak</div>
              <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400" data-tabular="true">
                {fmtNum(records?.inventory.rusak)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
            {(['1', '2', '3', '4', '5'] as const).map((fl) => (
              <div key={fl}>
                <div className="text-[9px] text-slate-400">Lt.{fl}</div>
                <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200" data-tabular="true">
                  {fmtNum(records?.inventory.byFloor[fl])}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Ringkasan Jumlah Record 8 Tabel Non-Keuangan */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl px-4 sm:px-5 py-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Rincian Jumlah Baris Tabel Database (Non-Keuangan)
          </span>
          <span className="text-xs font-bold font-mono text-[#1A3282] dark:text-blue-400" data-tabular="true">
            Total: {fmtNum(database?.totalRecordsNonFinance)} baris
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TABLE_LABELS.map((tbl) => (
            <div
              key={tbl.key}
              className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 px-3 py-2"
            >
              <div className="text-[10px] font-mono text-slate-400 truncate">{tbl.label}</div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5" data-tabular="true">
                {fmtNum(database?.tables[tbl.key])}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
