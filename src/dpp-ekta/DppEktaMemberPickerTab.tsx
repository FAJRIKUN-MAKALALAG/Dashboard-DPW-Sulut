import React from 'react';
import { Search, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { Member } from '../types';
import { dppEktaService } from './dppEktaService';

interface DppEktaMemberPickerTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  ektaFilter: 'ALL' | 'UNREGISTERED' | 'REGISTERED';
  setEktaFilter: (f: 'ALL' | 'UNREGISTERED' | 'REGISTERED') => void;
  stats: { total: number; registered: number; unregistered: number };
  filteredMembers: Member[];
  loadingMemberNik: string | null;
  onSelectMemberForForm: (m: Member) => void;
  onViewMemberCard: (m: Member) => void;
}

export const DppEktaMemberPickerTab: React.FC<DppEktaMemberPickerTabProps> = ({
  searchQuery,
  setSearchQuery,
  ektaFilter,
  setEktaFilter,
  stats,
  filteredMembers,
  loadingMemberNik,
  onSelectMemberForForm,
  onViewMemberCard,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kader, NIK, nomor e-KTA, atau Kabupaten/Kota..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEktaFilter('UNREGISTERED')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
              ektaFilter === 'UNREGISTERED'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Belum e-KTA DPP ({stats.unregistered})
          </button>
          <button
            type="button"
            onClick={() => setEktaFilter('REGISTERED')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
              ektaFilter === 'REGISTERED'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Sudah Terbit DPP ({stats.registered})
          </button>
          <button
            type="button"
            onClick={() => setEktaFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
              ektaFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua ({stats.total})
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada anggota yang sesuai dengan filter pencarian.
            </div>
          ) : (
            filteredMembers.map((m) => {
              const hasOfficial = dppEktaService.hasOfficialDppEkta(m);
              const isLoadingThis = loadingMemberNik === m.nik;
              return (
                <div
                  key={`${m.nik}_${m.id || ''}`}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {m.namaLengkap}
                      </span>
                      {hasOfficial ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          e-KTA DPP: {m.nomorEKTA}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Belum Terbit di DPP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-mono">NIK: {m.nik}</span>
                      <span>·</span>
                      <span>
                        {m.dpd} {m.dpc && m.dpc !== '-' ? `› Kec. ${m.dpc}` : ''}
                      </span>
                      <span>·</span>
                      <span>{m.jabatan}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasOfficial && (
                      <button
                        type="button"
                        onClick={() => onViewMemberCard(m)}
                        className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Lihat Kartu e-KTA</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => onSelectMemberForForm(m)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1A3282] hover:bg-[#21409A] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      <span>
                        {isLoadingThis
                          ? 'Memuat...'
                          : hasOfficial
                          ? 'Buka Data di Form'
                          : 'Proses Buat e-KTA DPP'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
