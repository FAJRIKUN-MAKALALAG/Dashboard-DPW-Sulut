import React from 'react';
import { UserSession } from '../../types';
import { UserCheck, TrendingUp, Building2, ChevronRight } from 'lucide-react';

interface ExecutiveKpiCardsProps {
  session?: UserSession;
  totalActive: number;
  totalRegistered: number;
  activePercentage: number;
  totalPengurusBerSk: number;
  totalAnggotaBiasa: number;
  countPengurusDpw: number;
  selectedDpdFilter: string;
  onNavigateToMembers: () => void;
  onOpenStructureModal: (level: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({
  session,
  totalActive,
  totalRegistered,
  activePercentage,
  totalPengurusBerSk,
  totalAnggotaBiasa,
  countPengurusDpw,
  selectedDpdFilter,
  onNavigateToMembers,
  onOpenStructureModal,
}) => {
  const isSuperAdmin = !session || session.role === 'SUPER_ADMIN';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Anggota Aktif Riil */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
            Kekuatan Riil Lapangan
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight"
            data-tabular="true"
          >
            {totalActive.toLocaleString('id-ID')}
          </span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Kader Aktif Riil
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Terverifikasi aktif di lapangan: <strong>{totalPengurusBerSk}</strong> Pengurus Struktural + <strong>{totalAnggotaBiasa}</strong> Anggota Basis.
        </p>
        <button
          onClick={onNavigateToMembers}
          className="btn-white w-full justify-between mt-3.5 text-xs font-semibold px-3 py-2 rounded-xl flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
        >
          <span>Buka Daftar Anggota Aktif</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      </div>

      {/* Metric 2: Tingkat Keaktifan & Keterisian Struktur */}
      <div
        onClick={() => onOpenStructureModal('ALL')}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        title="Klik untuk membuka rincian kelengkapan struktur organisasi"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>Tingkat Keaktifan Riil</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 opacity-80 group-hover:underline">
              (Klik Rincian)
            </span>
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight"
            data-tabular="true"
          >
            {activePercentage}%
          </span>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            Rasio Aktif Riil
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${activePercentage}%` }}
          ></div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed flex items-center justify-between">
          <span>{totalActive} dari {totalRegistered} data terverifikasi aktif</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[11px]">
            Lihat Detail &raquo;
          </span>
        </p>
      </div>

      {/* Metric 3: Struktur DPW & Pengurus Ber-SK */}
      <div
        onClick={() => onOpenStructureModal('DPW')}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        title="Klik untuk melihat susunan pengurus DPW"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
            Struktur DPW & Legalitas SK
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs group-hover:scale-110 transition-transform">
            <Building2 className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight"
            data-tabular="true"
          >
            {countPengurusDpw > 0 ? countPengurusDpw : (isSuperAdmin ? '15' : '1')}
          </span>
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {countPengurusDpw > 0 ? 'Pengurus DPW Ber-SK' : (!isSuperAdmin ? 'DPD Yurisdiksi' : 'DPD Kab/Kota')}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            15 DPD &middot; 167 DPC &middot; DPRt Basis Desa
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 group-hover:underline text-[10px] font-semibold">
            Klik untuk melihat susunan pengurus DPW &raquo;
          </p>
        </div>
        <div className="mt-3 pt-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 p-2 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
          <span>Total Pengurus Ber-SK:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{totalPengurusBerSk} Orang</span>
        </div>
      </div>
    </div>
  );
};
