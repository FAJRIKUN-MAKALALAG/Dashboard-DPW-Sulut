import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';
import {
  X,
  MapPin,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
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
  session,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'COVERED' | 'EMPTY'>('ALL');

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

  // Members in this specific DPC
  const dpcMembers = useMemo(() => {
    if (!dpdName || !dpcName) return [];
    return members.filter(
      (m) =>
        isDpdMatch(m.dpd, dpdName) &&
        isDpcMatch(m.dpc, dpcName) &&
        m.status === 'Aktif'
    );
  }, [dpdName, dpcName, members]);

  // Map each village to its members
  const villageStats = useMemo(() => {
    if (!subdistrict) return [];

    return subdistrict.villages.map((villageName, idx) => {
      const villageMembers = dpcMembers.filter((m) => isDprtMatch(m.dprt, villageName));
      const pengurus = villageMembers.filter((m) => m.isPengurus || m.tingkatKepengurusan === 'DPRt');

      return {
        no: idx + 1,
        name: villageName,
        totalMembers: villageMembers.length,
        pengurusCount: pengurus.length,
        isCovered: villageMembers.length > 0,
        members: villageMembers,
        pengurus,
      };
    });
  }, [subdistrict, dpcMembers]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
        <div className="w-screen max-w-2xl sm:max-w-3xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          
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
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Terjangkau Kader</span>
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
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Belum Terisi</span>
              <span className="text-base font-bold font-mono text-zinc-400 mt-0.5 block">
                {totalVillages - coveredCount}
              </span>
              <span className="text-[10px] text-rose-400/80">Perlu Rekrutmen</span>
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
                Terjangkau ({coveredCount})
              </button>
              <button
                onClick={() => setFilterMode('EMPTY')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === 'EMPTY'
                    ? 'bg-zinc-800 text-zinc-300 font-bold shadow-2xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kosong ({totalVillages - coveredCount})
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

          {/* 4. Villages List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
            {filteredVillages.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Tidak ada desa atau kelurahan yang cocok dengan pencarian.
              </div>
            ) : (
              filteredVillages.map((village) => (
                <div
                  key={village.name}
                  className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
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

                      {/* Cadre names preview if present */}
                      {village.members.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {village.members.slice(0, 3).map((m) => (
                            <span
                              key={m.nik}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-medium truncate max-w-[180px]"
                              title={`${m.namaLengkap} (${m.jabatan})`}
                            >
                              &bull; {m.namaLengkap}
                            </span>
                          ))}
                          {village.members.length > 3 && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              +{village.members.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      )}
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
                  </div>
                </div>
              ))
            )}
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
    </div>
  );
};

export default DpcTerritoryDrilldownDrawer;
