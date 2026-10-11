import React, { useState } from 'react';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { Member } from '../types';
import {
  MapPin,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Layers,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  Maximize2,
  Minimize2,
} from 'lucide-react';

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
  // Expandable state for each region
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  // Expandable state for DPC within expanded regions
  const [expandedDpcs, setExpandedDpcs] = useState<Record<string, boolean>>({});
  // Expandable state for zones
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});
  // Global expand/collapse all
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => ({ ...prev, [regionId]: !prev[regionId] }));
  };

  const toggleDpc = (key: string) => {
    setExpandedDpcs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleZone = (zoneId: string) => {
    setCollapsedZones((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const toggleAll = () => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    const newExpanded: Record<string, boolean> = {};
    SULUT_REGIONS.forEach((r) => {
      newExpanded[r.id] = newState;
    });
    setExpandedRegions(newExpanded);
    if (!newState) setExpandedDpcs({});
  };

  // Aggregate stats per region
  const regionStats = SULUT_REGIONS.map((region) => {
    const regionMembers = members.filter((m) => m.dpd === region.name);
    const activeCount = regionMembers.filter((m) => m.status === 'Aktif').length;
    const inactiveCount = regionMembers.length - activeCount;
    const totalCount = regionMembers.length;
    const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    // DPC (Kecamatan) level stats
    const dpcStats = region.subdistricts.map((sub) => {
      const dpcMembers = regionMembers.filter((m) => m.dpc === sub.name);
      const dpcActive = dpcMembers.filter((m) => m.status === 'Aktif').length;
      const dpcInactive = dpcMembers.length - dpcActive;

      // Village (DPRt) level stats
      const villageStats = sub.villages.map((village) => {
        const vMembers = regionMembers.filter((m) => m.dpc === sub.name && m.dprt === village);
        const vActive = vMembers.filter((m) => m.status === 'Aktif').length;
        return {
          name: village,
          total: vMembers.length,
          active: vActive,
          inactive: vMembers.length - vActive,
        };
      }).filter((v) => v.total > 0);

      return {
        name: sub.name,
        total: dpcMembers.length,
        active: dpcActive,
        inactive: dpcInactive,
        activePercent: dpcMembers.length > 0 ? Math.round((dpcActive / dpcMembers.length) * 100) : 0,
        villages: villageStats,
        totalVillages: sub.villages.length,
      };
    });

    return {
      ...region,
      activeCount,
      inactiveCount,
      totalCount,
      activePercent,
      dpcStats,
    };
  });

  const totalAllMembers = members.length;
  const totalAllActive = members.filter((m) => m.status === 'Aktif').length;

  const zones = [
    {
      id: 'Daratan Minahasa',
      title: 'Zona Daratan Minahasa',
      description: 'Manado, Bitung, Tomohon, Minahasa Raya',
      regions: regionStats.filter((r) => r.zone === 'Daratan Minahasa'),
      color: 'teal',
    },
    {
      id: 'BMR',
      title: 'Zona Bolaang Mongondow Raya',
      description: 'Kotamobagu, Bolmong, Bolmut, Bolsel, Boltim',
      regions: regionStats.filter((r) => r.zone === 'BMR'),
      color: 'amber',
    },
    {
      id: 'Kepulauan',
      title: 'Zona Kepulauan Nusa Utara',
      description: 'Kep. Sangihe, Kep. Talaud, Sitaro',
      regions: regionStats.filter((r) => r.zone === 'Kepulauan'),
      color: 'blue',
    },
  ];

  const getStatusColor = (percent: number) => {
    if (percent >= 80) return { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', badge: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50' };
    if (percent >= 60) return { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', badge: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50' };
    return { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', badge: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50' };
  };

  const getZoneHeaderStyle = (color: string) => {
    switch (color) {
      case 'teal': return 'text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30';
      case 'amber': return 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30';
      case 'blue': return 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      {/* Header */}
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Klik <strong className="text-blue-600 dark:text-blue-400">▶ Detail</strong> pada setiap DPD untuk melihat rincian anggota di setiap DPC (Kecamatan) & DPRt (Desa/Kelurahan).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
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

          {/* Expand / Collapse All */}
          <button
            onClick={toggleAll}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {allExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{allExpanded ? 'Tutup Semua' : 'Buka Semua'}</span>
          </button>
        </div>
      </div>

      {/* 3 Geographic Zones */}
      <div className="space-y-5">
        {zones.map((zone) => {
          const isZoneCollapsed = !!collapsedZones[zone.id];
          const zoneTotal = zone.regions.reduce((s, r) => s + r.totalCount, 0);
          const zoneActive = zone.regions.reduce((s, r) => s + r.activeCount, 0);
          const zonePercent = zoneTotal > 0 ? Math.round((zoneActive / zoneTotal) * 100) : 0;

          return (
            <div key={zone.id} className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 overflow-hidden transition-colors">
              {/* Zone Header - Clickable to collapse/expand */}
              <button
                onClick={() => toggleZone(zone.id)}
                className={`w-full text-left p-3.5 border-b border-slate-200 dark:border-slate-800/60 ${getZoneHeaderStyle(zone.color)} cursor-pointer transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold tracking-wide uppercase">{zone.title}</h4>
                      <span className="text-[10px] opacity-70">({zone.regions.length} Wilayah)</span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">{zone.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono">{zoneActive.toLocaleString('id-ID')} Aktif</div>
                      <div className="text-[10px] opacity-70">{zoneTotal.toLocaleString('id-ID')} Total · {zonePercent}%</div>
                    </div>
                    {isZoneCollapsed ? (
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    ) : (
                      <ChevronUp className="w-4 h-4 opacity-60" />
                    )}
                  </div>
                </div>

                {/* Zone Progress Bar */}
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="h-full bg-current rounded-full transition-all duration-500"
                    style={{ width: `${zonePercent}%`, opacity: 0.6 }}
                  ></div>
                </div>
              </button>

              {/* Zone Regions - Collapsible */}
              {!isZoneCollapsed && (
                <div className="p-3.5 space-y-2">
                  {zone.regions.map((region) => {
                    const isExpanded = !!expandedRegions[region.id];
                    const isSelected = selectedDpd === region.name;
                    const statusColors = getStatusColor(region.activePercent);

                    return (
                      <div
                        key={region.id}
                        className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-blue-500 border-blue-400 dark:border-blue-500 shadow-md'
                            : isExpanded
                            ? 'border-slate-300 dark:border-slate-700 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Region Header Row */}
                        <div className="flex items-center gap-0">
                          {/* Select as filter */}
                          <button
                            onClick={() => onSelectDpd(isSelected ? 'ALL' : region.name)}
                            className="flex-1 text-left p-3 flex items-center gap-3 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColors.dot} shrink-0 shadow-xs`}></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                  {region.name}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-medium shrink-0">
                                    Terpilih
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{region.activeCount} Aktif</span>
                                <span>·</span>
                                <span className="text-rose-500 dark:text-rose-400">{region.inactiveCount} Non-Aktif</span>
                                <span>·</span>
                                <span>{region.subdistricts.length} DPC</span>
                              </div>
                            </div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border shrink-0 ${statusColors.badge}`}>
                              {region.activePercent}%
                            </span>
                          </button>

                          {/* Expand Details toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRegion(region.id);
                            }}
                            className={`px-3 py-3 h-full border-l transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                              isExpanded
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-blue-600'
                            }`}
                            title={isExpanded ? 'Tutup rincian DPC' : 'Lihat rincian DPC & DPRt'}
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tutup</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Detail</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Active Percentage Mini Bar */}
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950">
                          <div
                            className={`h-full transition-all duration-500 ${
                              region.activePercent >= 80 ? 'bg-emerald-500' : region.activePercent >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${region.activePercent}%` }}
                          ></div>
                        </div>

                        {/* Expanded DPC Detail Panel */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-3 animate-[fadeSlideIn_200ms_ease-out]">
                            {/* DPC Summary Header */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                <span>Rincian {region.dpcStats.length} DPC (Kecamatan) di {region.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {region.dpcStats.filter((d) => d.total > 0).length} DPC Memiliki Anggota
                              </span>
                            </div>

                            {/* DPC Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {region.dpcStats.map((dpc) => {
                                const dpcKey = `${region.id}-${dpc.name}`;
                                const isDpcExpanded = !!expandedDpcs[dpcKey];
                                const dpcStatusColors = getStatusColor(dpc.activePercent);

                                return (
                                  <div
                                    key={dpcKey}
                                    className={`bg-white dark:bg-slate-900 border rounded-lg overflow-hidden transition-all ${
                                      isDpcExpanded
                                        ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    {/* DPC Header */}
                                    <button
                                      onClick={() => toggleDpc(dpcKey)}
                                      className="w-full text-left p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                          Kec. {dpc.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {dpc.total > 0 ? (
                                          <>
                                            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                              {dpc.active}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-600">/</span>
                                            <span className="font-mono text-slate-500 dark:text-slate-400">
                                              {dpc.total}
                                            </span>
                                            <span className={`px-1 py-0.5 rounded text-[10px] font-mono font-semibold border ${dpcStatusColors.badge}`}>
                                              {dpc.activePercent}%
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">Kosong</span>
                                        )}
                                        {isDpcExpanded ? (
                                          <ChevronUp className="w-3 h-3 text-indigo-500" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3 text-slate-400" />
                                        )}
                                      </div>
                                    </button>

                                    {/* DPC Mini Progress Bar */}
                                    <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-950">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          dpc.activePercent >= 80 ? 'bg-emerald-400' : dpc.activePercent >= 60 ? 'bg-blue-400' : 'bg-amber-400'
                                        }`}
                                        style={{ width: `${dpc.total > 0 ? dpc.activePercent : 0}%` }}
                                      ></div>
                                    </div>

                                    {/* Expanded: Village (DPRt) List */}
                                    {isDpcExpanded && (
                                      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                          <span className="flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-indigo-400" />
                                            <span className="font-semibold">DPRt (Desa/Kelurahan)</span>
                                          </span>
                                          <span className="font-mono">{dpc.totalVillages} Desa Total · {dpc.villages.length} Terisi</span>
                                        </div>

                                        {dpc.villages.length === 0 ? (
                                          <div className="text-[10px] text-slate-400 italic text-center py-2">
                                            Belum ada anggota terdaftar di kecamatan ini
                                          </div>
                                        ) : (
                                          dpc.villages.map((v) => (
                                            <div
                                              key={v.name}
                                              className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900 text-[11px] border border-slate-100 dark:border-slate-800"
                                            >
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                  v.total > 0 && v.active === v.total ? 'bg-emerald-500' : v.active > 0 ? 'bg-blue-500' : 'bg-slate-300'
                                                }`}></span>
                                                <span className="text-slate-700 dark:text-slate-300 truncate">{v.name}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{v.active} Aktif</span>
                                                {v.inactive > 0 && (
                                                  <>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-rose-500">{v.inactive} NA</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* DPC with no members info */}
                            {region.dpcStats.filter((d) => d.total === 0).length > 0 && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                                {region.dpcStats.filter((d) => d.total === 0).length} DPC belum memiliki anggota terdaftar:
                                {' '}
                                {region.dpcStats.filter((d) => d.total === 0).map((d) => d.name).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <p className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Klik daerah untuk filter data. Klik <strong>Detail</strong> untuk melihat rincian DPC & DPRt.</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            Total: <strong className="text-emerald-600">{totalAllActive.toLocaleString('id-ID')}</strong> / {totalAllMembers.toLocaleString('id-ID')} Anggota
          </span>
          {selectedDpd !== 'ALL' && (
            <button
              onClick={() => onSelectDpd('ALL')}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold underline text-xs cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
