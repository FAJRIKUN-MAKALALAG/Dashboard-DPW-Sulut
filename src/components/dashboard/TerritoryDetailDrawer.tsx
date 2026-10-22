import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  getDpdPimpinanCompliance,
  computeDpcReadinessForDpd,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import { isJobTitleMatch } from '../../utils/jobMatchingUtils';
import {
  X,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Table,
  ShieldCheck,
  Search,
  ArrowRight,
  ExternalLink,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface TerritoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string | null;
  members: Member[];
  session?: UserSession;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const TerritoryDetailDrawer: React.FC<TerritoryDetailDrawerProps> = ({
  isOpen,
  onClose,
  regionName,
  members,
  session,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const [activeTab, setActiveTab] = useState<'dpd' | 'dpc' | 'dprt'>('dpd');
  const [dpdSlotFilter, setDpdSlotFilter] = useState<'ALL' | 'FILLED' | 'VACANT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const regionInfo = useMemo(() => {
    if (!regionName) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, regionName));
  }, [regionName]);

  // Data calculations for selected DPD
  const activeMembersInRegion = useMemo(() => {
    if (!regionName) return [];
    return members.filter((m) => isDpdMatch(m.dpd, regionName) && m.status === 'Aktif');
  }, [regionName, members]);

  const pengurusInRegion = useMemo(() => {
    return activeMembersInRegion.filter((m) => m.isPengurus);
  }, [activeMembersInRegion]);

  const compliance = useMemo(() => {
    if (!regionName) return null;
    return getDpdPimpinanCompliance(regionName, members);
  }, [regionName, members]);

  const dpcReadinessList = useMemo(() => {
    if (!regionName) return [];
    return computeDpcReadinessForDpd(regionName, members);
  }, [regionName, members]);

  // Core leadership (Ketua, Sekretaris, Bendahara)
  const leaders = useMemo(() => {
    if (!compliance) {
      return { ketua: null, sekretaris: null, bendahara: null };
    }
    const ketuaSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Ketua') && !s.jabatan.toLowerCase().includes('wakil')
    );
    const sekretarisSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Sekretaris') && !s.jabatan.toLowerCase().includes('wakil')
    );
    const bendaharaSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Bendahara') && !s.jabatan.toLowerCase().includes('wakil')
    );

    return {
      ketua: ketuaSlot?.member || null,
      sekretaris: sekretarisSlot?.member || null,
      bendahara: bendaharaSlot?.member || null,
    };
  }, [compliance]);

  // Council organs
  const pertimbanganMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN');
  }, [pengurusInRegion]);

  const pakarMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => getMemberSubOrgCategory(m) === 'PAKAR');
  }, [pengurusInRegion]);

  // Filtered DPD 36 slots
  const filteredSlots = useMemo(() => {
    if (!compliance) return [];
    return compliance.slots.filter((slot) => {
      if (dpdSlotFilter === 'FILLED' && !slot.isFilled) return false;
      if (dpdSlotFilter === 'VACANT' && slot.isFilled) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchJabatan = slot.jabatan.toLowerCase().includes(query);
        const matchName = slot.member?.namaLengkap?.toLowerCase().includes(query);
        const matchNik = slot.member?.nik?.toLowerCase().includes(query);
        return matchJabatan || matchName || matchNik;
      }
      return true;
    });
  }, [compliance, dpdSlotFilter, searchTerm]);

  // DPRt total stats
  const totalDprtTarget = useMemo(() => {
    if (!regionInfo) return 0;
    return regionInfo.subdistricts.reduce((sum, sub) => sum + sub.villages.length, 0);
  }, [regionInfo]);

  const countDprtMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => m.tingkatKepengurusan === 'DPRt').length;
  }, [pengurusInRegion]);

  if (!isOpen || !regionName || !regionInfo || !compliance) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
        <div className="w-screen max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          
          {/* 1. Header Drawer */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 sticky top-0 z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Zona: {regionInfo.zone || 'Sulawesi Utara'}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    compliance.isComplete
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : compliance.filledCount > 0
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {compliance.isComplete
                    ? 'Lengkap 36/36'
                    : compliance.filledCount > 0
                    ? `${compliance.filledCount}/36 Terisi`
                    : 'Belum Ada SK'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {regionInfo.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat data terpadu struktur kepengurusan DPD, DPC kecamatan, dan DPRt desa.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Top Summary & Quick Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Kader Aktif</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {activeMembersInRegion.length}
                </span>
                <span className="text-[10px] text-slate-500">Basis KTP Wilayah</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Formasi DPD</span>
                <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {compliance.filledCount} / {compliance.totalRequired}
                </span>
                <span className="text-[10px] text-slate-500">{compliance.percentage}% Terisi</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DPC Kecamatan</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {dpcReadinessList.filter((d) => d.totalFilled > 0).length} / {regionInfo.subdistricts.length}
                </span>
                <span className="text-[10px] text-slate-500">Kecamatan Aktif</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DPRt Ranting</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {countDprtMembers}
                </span>
                <span className="text-[10px] text-slate-500">Dari {totalDprtTarget} Desa</span>
              </div>
            </div>

            {/* Core Leadership Cards (KSB) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Ketua */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  K
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Ketua DPD</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                    {leaders.ketua?.namaLengkap || (
                      <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                    )}
                  </span>
                  {leaders.ketua?.nomorSK && (
                    <span className="text-[9.5px] text-slate-500 font-mono truncate block">
                      SK: {leaders.ketua.nomorSK}
                    </span>
                  )}
                </div>
              </div>

              {/* Sekretaris */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  S
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sekretaris DPD</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                    {leaders.sekretaris?.namaLengkap || (
                      <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Bendahara */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  B
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bendahara DPD</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                    {leaders.bendahara?.namaLengkap || (
                      <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {onOpenTerritorialMatrix && (
                <button
                  onClick={() => {
                    onOpenTerritorialMatrix(regionInfo.name, undefined, 'DPD');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Buka Tabel Matriks & Input Data</span>
                </button>
              )}

              {onOpenStructureModal && (
                <button
                  onClick={() => {
                    onOpenStructureModal(regionInfo.name, 'ALL');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Daftar {pengurusInRegion.length} Pengurus Ber-SK</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Navigation Tabs */}
          <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dpd')}
              className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${
                activeTab === 'dpd'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Formasi 36 Jabatan DPD</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {compliance.filledCount}/36
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dpc')}
              className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${
                activeTab === 'dpc'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>DPC Kecamatan ({regionInfo.subdistricts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dprt')}
              className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${
                activeTab === 'dprt'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Basis Ranting DPRt</span>
            </button>
          </div>

          {/* 4. Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: FORMASI 36 JABATAN DPD */}
            {activeTab === 'dpd' && (
              <div className="space-y-3">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    <button
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
                    filteredSlots.map((slot) => (
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
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {slot.member.namaLengkap}
                                </span>
                                {slot.member.nomorEKTA && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    · e-KTA: {slot.member.nomorEKTA}
                                  </span>
                                )}
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
                                  onClick={() => {
                                    onOpenTerritorialMatrix(regionInfo.name, undefined, 'DPD');
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
            )}

            {/* TAB 2: SEBARAN DPC KECAMATAN */}
            {activeTab === 'dpc' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Daftar {regionInfo.subdistricts.length} Kecamatan di wilayah {regionInfo.name}:
                  </span>
                  <span className="font-mono font-medium">Standar: 17 Jabatan Inti / DPC</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden bg-white dark:bg-slate-900">
                  {dpcReadinessList.map((dpc) => (
                    <div
                      key={dpc.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                          Kecamatan {dpc.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Formasi terisi: {dpc.totalFilled} dari {dpc.totalRequired} posisi
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            dpc.status === 'LENGKAP'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : dpc.status === 'SEBAGIAN'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {dpc.status === 'LENGKAP'
                            ? 'Lengkap'
                            : dpc.status === 'SEBAGIAN'
                            ? `${dpc.totalFilled}/17 Terisi`
                            : 'Belum Ada SK'}
                        </span>

                        {onOpenTerritorialMatrix && (
                          <button
                            onClick={() => {
                              onOpenTerritorialMatrix(regionInfo.name, dpc.name, 'DPC');
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 cursor-pointer"
                            title="Buka matriks DPC"
                          >
                            Kelola &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BASIS RANTING DPRT */}
            {activeTab === 'dprt' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Penetrasi DPRt Ranting Desa / Kelurahan
                  </span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Menampilkan cakupan desa/kelurahan di {regionInfo.name}. Setiap desa idealnya memiliki kepengurusan DPRt tingkat ranting untuk mengamankan saksi dan basis suara TPS.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {regionInfo.subdistricts.map((sub) => {
                    const subDprtMembers = pengurusInRegion.filter(
                      (m) =>
                        m.tingkatKepengurusan === 'DPRt' &&
                        (m.dpc?.toLowerCase() === sub.name.toLowerCase() ||
                          m.dpc?.toLowerCase().includes(sub.name.toLowerCase()))
                    );

                    return (
                      <div
                        key={sub.name}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Kec. {sub.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {sub.villages.length} Desa/Kel
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>Pengurus Terdata:</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                            {subDprtMembers.length} Org
                          </span>
                        </div>

                        {onOpenTerritorialMatrix && (
                          <button
                            onClick={() => {
                              onOpenTerritorialMatrix(regionInfo.name, sub.name, 'DPRt');
                              onClose();
                            }}
                            className="w-full mt-1 py-1 rounded text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-center cursor-pointer"
                          >
                            Buka DPRt Kec. {sub.name}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Menekan <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">ESC</kbd> untuk menutup
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
