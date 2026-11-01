import React from 'react';
import {
  ArrowLeft,
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  Users,
  AlertCircle,
} from 'lucide-react';
import { SulutRegion } from '../../types';

interface TerritorySelectorBarProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  selectedDpd: string;
  setSelectedDpd: (dpd: string) => void;
  selectedDpc: string;
  setSelectedDpc: (dpc: string) => void;
  selectedDprt: string;
  setSelectedDprt: (dprt: string) => void;
  availableRegions: SulutRegion[];
  availableSubdistricts: Array<{ name: string; villages: string[] }>;
  availableVillages: string[];
  completionPercentage: number;
  filledCount: number;
  emptyCount: number;
  totalRows: number;
  onBackToDashboard?: () => void;
}

export const TerritorySelectorBar: React.FC<TerritorySelectorBarProps> = ({
  level,
  selectedDpd,
  setSelectedDpd,
  selectedDpc,
  setSelectedDpc,
  selectedDprt,
  setSelectedDprt,
  availableRegions,
  availableSubdistricts,
  availableVillages,
  completionPercentage,
  filledCount,
  emptyCount,
  totalRows,
  onBackToDashboard,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-2xs">
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer mb-2.5 transition-colors"
          title="Kembali ke Dashboard Utama"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Dashboard</span>
        </button>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-[#1A3282]/10 dark:bg-slate-800 text-[#1A3282] dark:text-slate-200 border border-[#1A3282]/20 dark:border-slate-700 flex items-center gap-1 uppercase tracking-wider">
              {level === 'DPW' && <Building2 className="w-3 h-3 text-[#1A3282] dark:text-[#FDB813]" />}
              {level === 'DPD' && <Building className="w-3 h-3 text-[#1A3282] dark:text-[#FDB813]" />}
              {level === 'DPC' && <MapPin className="w-3 h-3 text-[#1A3282] dark:text-[#FDB813]" />}
              {level === 'DPRt' && <Home className="w-3 h-3 text-[#1A3282] dark:text-[#FDB813]" />}
              <span>STRUKTUR {level}</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
              DPW Sulawesi Utara
            </span>
          </div>
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {level === 'DPW' && 'Pengurus DPW Sulawesi Utara'}
            {level === 'DPD' && `Pengurus DPD ${selectedDpd}`}
            {level === 'DPC' && `Pengurus DPC Kec. ${selectedDpc}`}
            {level === 'DPRt' && `Pengurus DPRt ${selectedDprt}`}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {level === 'DPW' &&
              'Struktur resmi DPW terdiri dari 70 jabatan: Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Wilayah.'}
            {level === 'DPD' &&
              'Struktur resmi DPD terdiri dari 44 jabatan kuota standar (Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Daerah).'}
            {level === 'DPC' &&
              `Struktur resmi DPC terdiri dari 25 jabatan kuota standar di wilayah ${selectedDpd}.`}
            {level === 'DPRt' &&
              `Struktur resmi DPRt terdiri dari 9 jabatan inti ranting desa/kelurahan di Kec. ${selectedDpc}.`}
          </p>
        </div>

        {/* Territory Selectors - Responsive Grid on Mobile/Tablet, Flex on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-stretch lg:items-center gap-2">
          {level !== 'DPW' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih DPD (Kab/Kota)
                </span>
                <select
                  value={selectedDpd}
                  disabled={availableRegions.length <= 1}
                  onChange={(e) => {
                    const newDpd = e.target.value;
                    setSelectedDpd(newDpd);
                    const reg = availableRegions.find((r) => r.name === newDpd);
                    if (reg && reg.subdistricts.length > 0) {
                      setSelectedDpc(reg.subdistricts[0].name);
                      setSelectedDprt(reg.subdistricts[0].villages[0] || 'Pusat');
                    }
                  }}
                  className={`w-full bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none truncate ${
                    availableRegions.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                  }`}
                >
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.name} className="dark:bg-slate-900">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(level === 'DPC' || level === 'DPRt') && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih DPC (Kecamatan)
                </span>
                <select
                  value={selectedDpc}
                  disabled={availableSubdistricts.length <= 1}
                  onChange={(e) => {
                    const newDpc = e.target.value;
                    setSelectedDpc(newDpc);
                    const sub = availableSubdistricts.find((s) => s.name === newDpc);
                    if (sub && sub.villages.length > 0) {
                      setSelectedDprt(sub.villages[0]);
                    }
                  }}
                  className={`w-full bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none truncate ${
                    availableSubdistricts.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                  }`}
                >
                  {availableSubdistricts.map((s) => (
                    <option key={s.name} value={s.name} className="dark:bg-slate-900">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {level === 'DPRt' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0 sm:col-span-2 lg:col-span-1">
              <Home className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih DPRt (Desa/Kel.)
                </span>
                <select
                  value={selectedDprt}
                  disabled={availableVillages.length <= 1}
                  onChange={(e) => setSelectedDprt(e.target.value)}
                  className={`w-full bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none truncate ${
                    availableVillages.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                  }`}
                >
                  {availableVillages.map((v) => (
                    <option key={v} value={v} className="dark:bg-slate-900">
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Metrics KPI Cards (Compact 3-Col Grid even on Mobile/Tablet) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-lg p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
              Keterisian
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {completionPercentage}%
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    completionPercentage >= 100 ? 'bg-emerald-500' : 'bg-[#FDB813]'
                  }`}
                />
                {completionPercentage >= 100 ? 'Lengkap' : 'Proses'}
              </span>
            </div>
          </div>
          <CheckCircle2 className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-lg p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
              Terisi
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {filledCount}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                /{totalRows}
              </span>
            </div>
          </div>
          <Users className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-lg p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
              Lowong
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {emptyCount}
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">posisi</span>
            </div>
          </div>
          <AlertCircle className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Slim Monochrome Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            completionPercentage >= 100
              ? 'bg-emerald-500'
              : 'bg-[#1A3282] dark:bg-[#21409A]'
          }`}
          style={{ width: `${Math.max(2, Math.min(completionPercentage, 100))}%` }}
        />
      </div>
    </div>
  );
};
