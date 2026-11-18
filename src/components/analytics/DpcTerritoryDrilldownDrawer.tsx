import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';
import { sortMembersByHierarchy } from '../../utils/jobMatchingUtils';
import {
  X,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface DpcTerritoryDrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dpdName: string | null;
  dpcName: string | null;
  members: Member[];
  session?: UserSession;
}

export const DpcTerritoryDrilldownDrawer: React.FC<DpcTerritoryDrilldownDrawerProps> = ({
  isOpen,
  onClose,
  dpdName,
  dpcName,
  members,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'COVERED' | 'EMPTY'>('ALL');
  const [expandedVillageName, setExpandedVillageName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExpandedVillageName(null);
      setSearchTerm('');
      setFilterMode('ALL');
    }
  }, [isOpen, dpdName, dpcName]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Find region and subdistrict info
  const region = useMemo(() => {
    if (!dpdName) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, dpdName));
  }, [dpdName]);

  const subdistrict = useMemo(() => {
    if (!region || !dpcName) return null;
    return region.subdistricts.find((s) => isDpcMatch(s.name, dpcName));
  }, [region, dpcName]);

  // Members in this specific DPC (termasuk yang menjabat via positions multi-jabatan)
  const dpcMembers = useMemo(() => {
    if (!dpdName || !dpcName) return [];
    return members.filter(
      (m) =>
        m.status === 'Aktif' &&
        ((isDpdMatch(m.dpd, dpdName) && isDpcMatch(m.dpc, dpcName)) ||
          m.positions?.some(
            (p) => isDpdMatch(p.dpd, dpdName) && isDpcMatch(p.dpc, dpcName)
          ))
    );
  }, [dpdName, dpcName, members]);

  // Map each village to its members & DPRt officers sorted by hierarchy
  const villageStats = useMemo(() => {
    if (!subdistrict) return [];

    return subdistrict.villages.map((villageName, idx) => {
      const villageMembersRaw = dpcMembers.filter(
        (m) =>
          isDprtMatch(m.dprt, villageName) ||
          m.positions?.some(
            (p) => isDpcMatch(p.dpc, dpcName || '') && isDprtMatch(p.dprt, villageName)
          )
      );

      const normalizedMembers = villageMembersRaw.map((m) => {
        const dprtPos = m.positions?.find(
          (p) =>
            p.tingkatKepengurusan === 'DPRt' &&
            isDpcMatch(p.dpc, dpcName || '') &&
            isDprtMatch(p.dprt, villageName)
        );
        return dprtPos
          ? { ...m, jabatan: dprtPos.jabatan || m.jabatan, tingkatKepengurusan: 'DPRt' as const }
          : m;
      });

      const sortedMembers = sortMembersByHierarchy(normalizedMembers);
      const pengurus = sortedMembers.filter(
        (m) => m.isPengurus || m.tingkatKepengurusan === 'DPRt'
      );

      return {
        no: idx + 1,
        name: villageName,
        totalMembers: sortedMembers.length,
        pengurusCount: pengurus.length,
        isCovered: sortedMembers.length > 0,
        members: sortedMembers,
        pengurus,
      };
    });
  }, [subdistrict, dpcMembers, dpcName]);

  // Filtered villages
  const filteredVillages = useMemo(() => {
    return villageStats.filter((v) => {
      if (filterMode === 'COVERED' && !v.isCovered) return false;
      if (filterMode === 'EMPTY' && v.isCovered) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = v.name.toLowerCase().includes(query);
        const matchCadre = v.members.some((m) => m.namaLengkap?.toLowerCase().includes(query));
        return matchName || matchCadre;
      }
      return true;
    });
  }, [villageStats, filterMode, searchTerm]);

  const coveredCount = villageStats.filter((v) => v.isCovered).length;
  const totalVillages = villageStats.length;

  if (!isOpen || !dpdName || !dpcName || !subdistrict) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-backdrop-fade cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container - Mentok ke pojok kanan layar */}
      <div className="fixed inset-y-0 right-0 max-w-full flex justify-end pl-0 sm:pl-10 pointer-events-none z-10">
        <div className="pointer-events-auto w-full sm:w-screen sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 shadow-2xl flex flex-col h-full animate-drawer-slide">
          
          {/* 1. Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90 flex items-start justify-between gap-3 sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                  Tingkat DPC Kecamatan
                </span>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-xs text-zinc-400 font-mono">
                  {region?.name || dpdName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Kecamatan {subdistrict.name}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rincian sebaran {totalVillages} Desa/Kelurahan (DPRt) resmi di wilayah {dpdName}.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Quick Stat Counters */}
          <div className="p-4 sm:p-5 bg-zinc-900/50 border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total DPRt</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {totalVillages}
              </span>
              <span className="text-[10px] text-zinc-500">Desa / Kelurahan</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Jumlah DPRt</span>
              <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                {coveredCount} <span className="text-xs text-zinc-500 font-normal">/ {totalVillages}</span>
              </span>
              <span className="text-[10px] text-zinc-500">
                {totalVillages > 0 ? ((coveredCount / totalVillages) * 100).toFixed(0) : 0}% Terisi
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Kader di DPC Ini</span>
              <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
                {dpcMembers.length}
              </span>
              <span className="text-[10px] text-zinc-500">Kader Aktif Riil</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Belum Terisi DPRt</span>
              <span className="text-base font-bold font-mono text-zinc-400 mt-0.5 block">
                {totalVillages - coveredCount}
              </span>
              <span className="text-[10px] text-rose-400/80"></span>
            </div>
          </div>

          {/* 3. Search & Filter Bar */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-zinc-800 text-white font-bold shadow-2xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua ({totalVillages})
              </button>
              <button
                onClick={() => setFilterMode('COVERED')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === 'COVERED'
                    ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80 shadow-2xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Terisi ({coveredCount})
              </button>
              <button
                onClick={() => setFilterMode('EMPTY')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === 'EMPTY'
                    ? 'bg-zinc-800 text-zinc-300 font-bold shadow-2xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                belum terisi ({totalVillages - coveredCount})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari desa/kelurahan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* 4. Villages List with Micro-animation */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div key={filterMode} className="animate-tab-enter space-y-2">
              {filteredVillages.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Tidak ada desa atau kelurahan yang cocok dengan pencarian.
              </div>
            ) : (
              filteredVillages.map((village) => {
                const isExpanded = expandedVillageName === village.name;
                return (
                  <div
                    key={village.name}
                    className={`rounded-lg border transition-colors text-xs overflow-hidden ${
                      isExpanded
                        ? 'border-amber-500/60 bg-zinc-900 shadow-lg'
                        : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedVillageName((prev) =>
                          prev === village.name ? null : village.name
                        )
                      }
                      aria-expanded={isExpanded}
                      className="w-full p-3 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 w-5 pt-0.5 shrink-0">
                          #{village.no}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block">
                            {village.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 mt-0.5 block">
                            DPRt Tingkat Basis Desa / Kelurahan
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                        {village.isCovered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{village.totalMembers} Kader Terdata</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                            <span>Belum Ada Kader</span>
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 bg-zinc-950/70 px-3.5 py-3 space-y-2 animate-tab-enter">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Daftar Kepengurusan &amp; Kader DPRt {village.name}</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {village.pengurusCount} Pengurus · {village.totalMembers} Total
                          </span>
                        </div>

                        {village.members.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 italic py-2">
                            Belum ada data pengurus maupun kader yang terdaftar di DPRt ini.
                          </p>
                        ) : (
                          <div className="divide-y divide-zinc-800/70 rounded-lg border border-zinc-800/80 bg-zinc-900/50">
                            {village.members.map((m, idx) => {
                              const isOfficer = m.isPengurus || m.tingkatKepengurusan === 'DPRt';
                              return (
                                <div
                                  key={`${m.nik}-${idx}`}
                                  className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 w-5 pt-0.5 shrink-0">
                                      {idx + 1}.
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-white truncate">
                                        {m.namaLengkap}
                                      </p>
                                      <p className="text-[11px] text-zinc-400 truncate">
                                        {m.jabatan || (isOfficer ? 'Pengurus DPRt' : 'Anggota Biasa')}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 pl-7 sm:pl-0">
                                    {m.nomorEKTA && (
                                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-700/70">
                                        e-KTA: {m.nomorEKTA}
                                      </span>
                                    )}
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        isOfficer
                                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/70'
                                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/70'
                                      }`}
                                    >
                                      {isOfficer && <ShieldCheck className="w-3 h-3" />}
                                      <span>{isOfficer ? 'Pengurus' : 'Anggota'}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* 5. Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px]">
              Menekan <kbd className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[10px]">ESC</kbd> untuk menutup
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default DpcTerritoryDrilldownDrawer;
