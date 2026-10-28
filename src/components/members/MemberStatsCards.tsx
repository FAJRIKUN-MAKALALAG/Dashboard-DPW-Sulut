import React from 'react';
import { Users, ShieldCheck, UserCheck, Layers, Award } from 'lucide-react';

interface MemberStatsCardsProps {
  membershipFilter: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  setMembershipFilter: (f: 'ALL' | 'PENGURUS' | 'ANGGOTA') => void;
  selectedCouncilFilter: 'ALL' | 'PERTIMBANGAN' | 'PAKAR' | 'PIMPINAN';
  setSelectedCouncilFilter: (f: 'ALL' | 'PERTIMBANGAN' | 'PAKAR' | 'PIMPINAN') => void;
  setCurrentPage: (p: number) => void;
  territoryScopedTotal: number;
  countPengurusScope: number;
  countAnggotaScope: number;
  countPertimbanganScope: number;
  countPakarScope: number;
  countPimpinanScope: number;
}

export const MemberStatsCards: React.FC<MemberStatsCardsProps> = ({
  membershipFilter,
  setMembershipFilter,
  selectedCouncilFilter,
  setSelectedCouncilFilter,
  setCurrentPage,
  territoryScopedTotal,
  countPengurusScope,
  countAnggotaScope,
  countPertimbanganScope,
  countPakarScope,
  countPimpinanScope,
}) => {
  return (
    <div className="space-y-3">
      {/* SEPARATED TABS: PENGURUS STRUKTURAL VS ANGGOTA BIASA (BASIS KTP) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full shrink-0 py-0.5">
          {/* Tab 1: Semua Kader */}
          <button
            onClick={() => {
              setMembershipFilter('ALL');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              membershipFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Semua Kader</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'ALL'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {territoryScopedTotal}
            </span>
          </button>

          {/* Tab 2: Pengurus Ber-SK */}
          <button
            onClick={() => {
              setMembershipFilter('PENGURUS');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              membershipFilter === 'PENGURUS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Pengurus Struktural (Ber-SK)</span>
              <span className="sm:hidden">Pengurus Ber-SK</span>
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'PENGURUS'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
              }`}
            >
              {countPengurusScope}
            </span>
          </button>

          {/* Tab 3: Anggota Biasa (Basis KTP) */}
          <button
            onClick={() => {
              setMembershipFilter('ANGGOTA');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              membershipFilter === 'ANGGOTA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Anggota Biasa (Basis KTP)</span>
              <span className="sm:hidden">Anggota Biasa</span>
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'ANGGOTA'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {countAnggotaScope}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2">
          {membershipFilter === 'PENGURUS'
            ? 'Menampilkan pejabat struktural & dewan ber-SK'
            : membershipFilter === 'ANGGOTA'
            ? 'Menampilkan kader & anggota riil basis KTP (non-SK)'
            : 'Menampilkan gabungan seluruh kader & pengurus'}
        </div>
      </div>

      {/* SUB-ORGANISASI SEPARATION BAR: DEWAN PERTIMBANGAN, DEWAN PAKAR, DEWAN PIMPINAN */}
      {membershipFilter !== 'ANGGOTA' && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">Pemisahan Sub-Organisasi:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full shrink-0 py-0.5">
            <button
              onClick={() => {
                setSelectedCouncilFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCouncilFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({countPengurusScope})
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PERTIMBANGAN');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border shrink-0 whitespace-nowrap ${
                selectedCouncilFilter === 'PERTIMBANGAN'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <span className="hidden sm:inline">I. Dewan </span>Pertimbangan
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PERTIMBANGAN'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                }`}
              >
                {countPertimbanganScope}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PAKAR');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border shrink-0 whitespace-nowrap ${
                selectedCouncilFilter === 'PAKAR'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                <span className="hidden sm:inline">II. Dewan </span>Pakar
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PAKAR'
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-200/60 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200'
                }`}
              >
                {countPakarScope}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PIMPINAN');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border shrink-0 whitespace-nowrap ${
                selectedCouncilFilter === 'PIMPINAN'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                  : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <span className="hidden sm:inline">III. Dewan </span>Pimpinan
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PIMPINAN'
                    ? 'bg-white/25 text-white'
                    : 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200'
                }`}
              >
                {countPimpinanScope}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
