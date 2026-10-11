import React from 'react';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { Member } from '../types';
import { MapPin, Users, CheckCircle2, ChevronRight } from 'lucide-react';

interface SulutMapVisualProps {
  members: Member[];
  selectedDpd: string;
  onSelectDpd: (dpdName: string) => void;
}

export const SulutMapVisual: React.FC<SulutMapVisualProps> = ({
  members,
  selectedDpd,
  onSelectDpd,
}) => {
  // Aggregate stats per region
  const regionStats = SULUT_REGIONS.map((region) => {
    const regionMembers = members.filter((m) => m.dpd === region.name);
    const activeCount = regionMembers.filter((m) => m.status === 'Aktif').length;
    const inactiveCount = regionMembers.length - activeCount;
    const totalCount = regionMembers.length;
    const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    return {
      ...region,
      activeCount,
      inactiveCount,
      totalCount,
      activePercent,
    };
  });

  const zones = [
    {
      id: 'Daratan Minahasa',
      title: 'Zona Daratan Minahasa (7 Wilayah)',
      description: 'Manado, Bitung, Tomohon, Minahasa Raya',
      regions: regionStats.filter((r) => r.zone === 'Daratan Minahasa'),
    },
    {
      id: 'BMR',
      title: 'Zona Bolaang Mongondow Raya (5 Wilayah)',
      description: 'Kotamobagu, Bolmong, Bolmut, Bolsel, Boltim',
      regions: regionStats.filter((r) => r.zone === 'BMR'),
    },
    {
      id: 'Kepulauan',
      title: 'Zona Kepulauan Nusa Utara (3 Wilayah)',
      description: 'Kep. Sangihe, Kep. Talaud, Sitaro',
      regions: regionStats.filter((r) => r.zone === 'Kepulauan'),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wider uppercase">Peta Geografis Teritorial</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">15 DPD Kabupaten/Kota Sulut</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Sebaran Densitas & Keaktifan Teritorial Daerah
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Tinggi (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-xs"></span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Sedang (60-80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
            <span className="text-amber-700 dark:text-amber-400 font-medium">Evaluasi (&lt;60%)</span>
          </div>
        </div>
      </div>

      {/* 3 Geographic Zones in Sulut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {zones.map((zone, zIdx) => {
          const zoneColorHeader =
            zIdx === 0
              ? 'text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30'
              : zIdx === 1
              ? 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30'
              : 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30';

          return (
            <div key={zone.id} className="flex flex-col rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3.5 transition-colors">
              <div className={`mb-3 p-2.5 rounded-lg border ${zoneColorHeader}`}>
                <h4 className="text-xs font-bold tracking-wide uppercase">{zone.title}</h4>
                <p className="text-[11px] opacity-80 mt-0.5">{zone.description}</p>
              </div>

              <div className="space-y-2 flex-1">
                {zone.regions.map((region) => {
                  const isSelected = selectedDpd === region.name;
                  const statusBadgeStyle =
                    region.activePercent >= 80
                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                      : region.activePercent >= 60
                      ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50';

                  return (
                    <button
                      key={region.id}
                      onClick={() => onSelectDpd(isSelected ? 'ALL' : region.name)}
                      className={`btn-white w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400 font-semibold shadow-xs'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{region.name}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-medium">
                              Terpilih
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{region.activeCount} Aktif</span>
                          <span>·</span>
                          <span className="text-rose-500 dark:text-rose-400">{region.inactiveCount} Non-Aktif</span>
                          <span>·</span>
                          <span className="text-slate-500 dark:text-slate-400">{region.subdistricts.length} DPC</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${statusBadgeStyle}`}>
                          {region.activePercent}%
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <p className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Klik salah satu daerah untuk memfilter instan seluruh data keanggotaan dan laporan atasan.</span>
        </p>
        {selectedDpd !== 'ALL' && (
          <button
            onClick={() => onSelectDpd('ALL')}
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold underline text-xs cursor-pointer"
          >
            Reset Filter (Tampilkan Semua Sulut)
          </button>
        )}
      </div>
    </div>
  );
};
