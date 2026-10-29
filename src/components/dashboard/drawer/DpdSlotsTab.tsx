import React from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Member } from '../../../types';
import { DpdComplianceInfo } from '../../../utils/structureReadinessUtils';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../../utils/imageUtils';

interface DpdSlotsTabProps {
  filteredSlots: DpdComplianceInfo['slots'];
  compliance: DpdComplianceInfo;
  dpdSlotFilter: 'ALL' | 'FILLED' | 'VACANT';
  setDpdSlotFilter: (filter: 'ALL' | 'FILLED' | 'VACANT') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pertimbanganMembers: Member[];
  pakarMembers: Member[];
  regionName: string;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onClose: () => void;
}

export const DpdSlotsTab: React.FC<DpdSlotsTabProps> = ({
  filteredSlots,
  compliance,
  dpdSlotFilter,
  setDpdSlotFilter,
  searchTerm,
  setSearchTerm,
  pertimbanganMembers,
  pakarMembers,
  regionName,
  onOpenTerritorialMatrix,
  onClose,
}) => {
  return (
    <div className="space-y-3">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setDpdSlotFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              dpdSlotFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua (36)
          </button>
          <button
            type="button"
            onClick={() => setDpdSlotFilter('FILLED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              dpdSlotFilter === 'FILLED'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Terisi ({compliance.filledCount})
          </button>
          <button
            type="button"
            onClick={() => setDpdSlotFilter('VACANT')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              dpdSlotFilter === 'VACANT'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lowong ({compliance.vacantCount})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari jabatan atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Slots List */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden bg-white dark:bg-slate-900">
        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada posisi jabatan yang sesuai dengan filter.
          </div>
        ) : (
          filteredSlots.map((slot: any) => (
            <div
              key={slot.no}
              className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 w-5 pt-0.5 shrink-0">
                  #{slot.no}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                    {slot.jabatan}
                  </span>
                  {slot.isFilled && slot.member ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-6 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                        {slot.member.fotoProfilUrl ? (
                          <img
                            src={resolveImageUrl(slot.member.fotoProfilUrl)}
                            alt={slot.member.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center text-[8px] font-bold font-mono ${getAvatarColor(slot.member.namaLengkap).bgClass} ${getAvatarColor(slot.member.namaLengkap).textClass}`}
                          >
                            {getInitials(slot.member.namaLengkap)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {slot.member.namaLengkap}
                        </span>
                        {slot.member.nomorEKTA && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            · e-KTA: {slot.member.nomorEKTA}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Belum ada pengurus yang diplot pada posisi ini
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {slot.isFilled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Terisi</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <span>Lowong</span>
                    </span>
                    {onOpenTerritorialMatrix && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTerritorialMatrix(regionName, undefined, 'DPD');
                          onClose();
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                        title="Plot pengurus di matriks"
                      >
                        Isi &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Dewan Pertimbangan & Dewan Pakar */}
      {(pertimbanganMembers.length > 0 || pakarMembers.length > 0) && (
        <div className="pt-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
            Organ Penasehat Wilayah
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Dewan Pertimbangan ({pertimbanganMembers.length} Org)
              </span>
              <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto">
                {pertimbanganMembers.length > 0 ? (
                  pertimbanganMembers.map((m) => (
                    <div key={m.nik} className="truncate">
                      &bull; {m.namaLengkap} <span className="text-slate-400">({m.jabatan})</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Belum terisi</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Dewan Pakar ({pakarMembers.length} Org)
              </span>
              <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto">
                {pakarMembers.length > 0 ? (
                  pakarMembers.map((m) => (
                    <div key={m.nik} className="truncate">
                      &bull; {m.namaLengkap} <span className="text-slate-400">({m.jabatan})</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Belum terisi</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
