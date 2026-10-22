import React from 'react';
import { AnalyticsData } from '../types';

interface AnalyticsQuickKpiBarProps {
  analyticsData: AnalyticsData;
  fmt: (n: number) => string;
}

export const AnalyticsQuickKpiBar: React.FC<AnalyticsQuickKpiBarProps> = ({
  analyticsData,
  fmt,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
          Total Kader Terdaftar
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {fmt(analyticsData.totalMembers)}
          </span>
          <span className="text-xs font-mono font-bold text-blue-400">
            15 DPD
          </span>
        </div>
      </div>

      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800">
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
          Pengurus Ber-SK
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {fmt(analyticsData.pengurusCount)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {analyticsData.totalMembers > 0 ? ((analyticsData.pengurusCount / analyticsData.totalMembers) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800">
        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
          Anggota Basis KTP
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
            {fmt(analyticsData.anggotaBiasaCount)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {analyticsData.totalMembers > 0 ? ((analyticsData.anggotaBiasaCount / analyticsData.totalMembers) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
          e-KTA Resmi Terbit
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {fmt(analyticsData.withKtaCount)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            Tervalidasi
          </span>
        </div>
      </div>

      <div className="hidden lg:block p-4 rounded-md bg-zinc-950 border border-zinc-800">
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
          Kader Tertinggi
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold text-white truncate max-w-[140px]" title={analyticsData.topPerformer?.label}>
            {analyticsData.topPerformer?.label || '-'}
          </span>
          <span className="text-xs font-mono font-bold text-amber-400">
            {fmt(analyticsData.topPerformer?.total || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
