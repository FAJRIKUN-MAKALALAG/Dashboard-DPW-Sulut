import React from 'react';
import { AnalyticsData, AnalyticsScreenId } from '../types';
import { Users, Maximize2, ExternalLink } from 'lucide-react';

interface DemographicsChartProps {
  analyticsData: AnalyticsData;
  fmt: (n: number) => string;
  isSolo?: boolean;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId) => void;
}

export const DemographicsChart: React.FC<DemographicsChartProps> = ({
  analyticsData,
  fmt,
  isSolo = false,
  onOpenFullscreen,
  onOpenStandalone,
}) => {
  const { totalMembers, maleCount, femaleCount, activeCount, withKtaCount, verifiedKtpCount } = analyticsData;
  const malePct = totalMembers > 0 ? (maleCount / totalMembers) * 100 : 0;
  const femalePct = totalMembers > 0 ? (femaleCount / totalMembers) * 100 : 0;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Demografi &amp; Status Verifikasi
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rasio Gender, e-KTA Resmi, dan Keaktifan Status Anggota
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Layar Penuh Demografi"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          <button
            onClick={() => onOpenStandalone('status_gender')}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors cursor-pointer"
            title="Buka di Jendela / Monitor Eksternal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
        {/* Gender Ratio Card */}
        <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800">
          <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider font-mono">
            Rasio Gender Kader
          </span>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-blue-400">Laki-laki</span>
                <span className="font-mono text-white">{fmt(maleCount)} ({malePct.toFixed(1)}%)</span>
              </div>
              <div className="h-2.5 bg-zinc-950 rounded overflow-hidden p-0.5 border border-zinc-800">
                <div className="h-full bg-blue-600 rounded-xs transition-all duration-300" style={{ width: `${malePct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-amber-400">Perempuan</span>
                <span className="font-mono text-white">{fmt(femaleCount)} ({femalePct.toFixed(1)}%)</span>
              </div>
              <div className="h-2.5 bg-zinc-950 rounded overflow-hidden p-0.5 border border-zinc-800">
                <div className="h-full bg-amber-500 rounded-xs transition-all duration-300" style={{ width: `${femalePct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Verification & e-KTA Card */}
        <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800">
          <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider font-mono">
            Validasi Dokumen Identitas
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400">Nomor e-KTA Resmi:</span>
              <span className="font-mono font-bold text-emerald-400">{fmt(withKtaCount)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400">KTP Terverifikasi:</span>
              <span className="font-mono font-bold text-blue-400">{fmt(verifiedKtpCount)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400">Status Keaktifan:</span>
              <span className="font-mono font-bold text-amber-400">{fmt(activeCount)} Aktif</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
        AUDIT VALIDASI DATA KADER NASDEM SULUT
      </div>
    </div>
  );
};
