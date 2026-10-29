import React from 'react';
import {
  ArrowLeft,
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  Sparkles,
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs">
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="btn-white text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mb-2.5 self-start"
          title="Kembali ke Dashboard Utama"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Dashboard</span>
        </button>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              {level === 'DPW' && <Building2 className="w-3 h-3 text-blue-600" />}
              {level === 'DPD' && <Building className="w-3 h-3 text-blue-600" />}
              {level === 'DPC' && <MapPin className="w-3 h-3 text-blue-600" />}
              {level === 'DPRt' && <Home className="w-3 h-3 text-blue-600" />}
              <span>STRUKTUR {level}</span>
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              DPW Sulut
            </span>
          </div>
          <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {level === 'DPW' && 'Pengurus DPW Sulawesi Utara'}
            {level === 'DPD' && `Pengurus DPD ${selectedDpd}`}
            {level === 'DPC' && `Pengurus DPC Kec. ${selectedDpc}`}
            {level === 'DPRt' && `Pengurus DPRt ${selectedDprt}`}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1">
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

        {/* Territory Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {level !== 'DPW' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih DPD
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
                  className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
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
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
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
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Home className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih DPRt (Desa/Kel.)
                </span>
                <select
                  value={selectedDprt}
                  disabled={availableVillages.length <= 1}
                  onChange={(e) => setSelectedDprt(e.target.value)}
                  className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
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

      {/* Progress & Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tingkat Keterisian
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {completionPercentage}%
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  completionPercentage >= 100
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {completionPercentage >= 100 ? 'Lengkap' : 'Belum Lengkap'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Jabatan Terisi
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {filledCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                dari {totalRows} posisi kuota
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Jabatan Kosong / Tersisa
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {emptyCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {emptyCount === 0 ? 'Semua posisi terisi' : 'perlu diisi kader'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            completionPercentage >= 100
              ? 'bg-emerald-500'
              : completionPercentage >= 50
              ? 'bg-blue-600'
              : 'bg-amber-500'
          }`}
          style={{ width: `${Math.max(2, Math.min(completionPercentage, 100))}%` }}
        />
      </div>
    </div>
  );
};
