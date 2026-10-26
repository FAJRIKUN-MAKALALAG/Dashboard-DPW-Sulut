import React, { useState, useMemo } from 'react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  computeStructureReadiness,
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getDpdPimpinanCompliance,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import { TerritoryDetailDrawer } from './TerritoryDetailDrawer';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  ShieldCheck,
  Building2,
  MapPin,
  Table,
  Filter,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface UnifiedTerritorialReadinessProps {
  members: Member[];
  session?: UserSession;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const UnifiedTerritorialReadiness: React.FC<UnifiedTerritorialReadinessProps> = ({
  members,
  session,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const readinessSummary = useMemo(() => computeStructureReadiness(members), [members]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG'>('ALL');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  
  // Selected DPD for slide-over Micro-Page drawer
  const [selectedDrawerRegion, setSelectedDrawerRegion] = useState<string | null>(null);
  const [selectedDrawerInitialTab, setSelectedDrawerInitialTab] = useState<'dpd' | 'dpc' | 'dprt'>('dpd');
  const [selectedDrawerInitialDpc, setSelectedDrawerInitialDpc] = useState<string | null>(null);

  const isRegionalScoped = session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW';

  // Scoped list of regions
  const regionsToDisplay = useMemo(() => {
    let list = SULUT_REGIONS;
    if (isRegionalScoped && session.dpdAccess && session.dpdAccess !== 'ALL') {
      const filtered = list.filter((r) => isDpdMatch(r.name, session.dpdAccess));
      if (filtered.length > 0) list = filtered;
    }
    return list;
  }, [isRegionalScoped, session]);

  // Compute readiness stats per region once for efficiency
  const regionStats = useMemo(() => {
    return regionsToDisplay.map((region) => {
      const compliance = getDpdPimpinanCompliance(region.name, members);
      const regMembers = members.filter((m) => isDpdMatch(m.dpd, region.name) && m.status === 'Aktif');
      const regPengurus = regMembers.filter((m) => m.isPengurus);
      
      const totalDpcs = region.subdistricts.length;
      const totalDprts = region.subdistricts.reduce((sum, sub) => sum + sub.villages.length, 0);

      // Check how many DPC subdistricts have active cadres or DPC committee members
      const filledDpcs = region.subdistricts.filter((sub) =>
        regMembers.some((m) => isDpcMatch(m.dpc, sub.name))
      ).length;

      // Check how many DPRt villages have active cadres
      let filledDprts = 0;
      region.subdistricts.forEach((sub) => {
        sub.villages.forEach((v) => {
          if (regMembers.some((m) => isDpcMatch(m.dpc, sub.name) && isDprtMatch(m.dprt, v))) {
            filledDprts++;
          }
        });
      });

      const pertimbanganCount = regPengurus.filter(
        (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN'
      ).length;
      const pakarCount = regPengurus.filter(
        (m) => getMemberSubOrgCategory(m) === 'PAKAR'
      ).length;

      let status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' = 'KOSONG';
      if (compliance.isComplete) {
        status = 'LENGKAP';
      } else if (compliance.filledCount > 0) {
        status = 'SEBAGIAN';
      }

      return {
        region,
        compliance,
        status,
        regMembersCount: regMembers.length,
        regPengurusCount: regPengurus.length,
        filledDpcs,
        totalDpcs,
        filledDprts,
        totalDprts,
        pertimbanganCount,
        pakarCount,
      };
    });
  }, [regionsToDisplay, members]);

  // Filter based on tab
  const filteredRegionStats = useMemo(() => {
    if (filterTab === 'ALL') return regionStats;
    return regionStats.filter((r) => r.status === filterTab);
  }, [regionStats, filterTab]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 transition-colors">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Kesiapan Struktur & Teritorial Organisasi
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {isRegionalScoped ? `Wilayah ${session.dpdAccess}` : '15 Kab/Kota Se-Sulut'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Status Kepengurusan & Keterisian Wilayah
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pemantauan keterisian 36 jabatan DPD, penetrasi DPC kecamatan, dan DPRt desa se-Sulawesi Utara.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lihat standar data yang wajib dilengkapi"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{showGuidelines ? 'Tutup Panduan SK' : 'Panduan Legalitas SK'}</span>
            {showGuidelines ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {onOpenStructureModal && (
            <button
              onClick={() => onOpenStructureModal('ALL', 'ALL')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Pengurus Ber-SK</span>
            </button>
          )}

          {onOpenTerritorialMatrix && (
            <button
              onClick={() => onOpenTerritorialMatrix()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Buka Matriks Lengkap</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Optional Guidelines (Clean, Minimalist Dropdown) */}
      {showGuidelines && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Standar Wajib Legalitas Kepengurusan Partai NasDem Sulut:
            </span>
            <span className="text-[10px] font-mono text-slate-400">Ketentuan DPW Sulut</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                1. Legalitas Formal SK
              </span>
              <p className="text-[11px] text-slate-500">Nomor SK resmi, tanggal penetapan, dan masa bakti pengurus.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                2. Formasi 36 Jabatan DPD
              </span>
              <p className="text-[11px] text-slate-500">KSB inti, 27 Wakil Ketua Bidang, Dewan Pertimbangan & Dewan Pakar.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                3. Penetrasi DPC & DPRt
              </span>
              <p className="text-[11px] text-slate-500">17 jabatan inti per kecamatan dan kepengurusan ranting basis desa.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                4. Validitas Biodata Kader
              </span>
              <p className="text-[11px] text-slate-500">NIK e-KTP 16 digit, e-KTA resmi, dan nomor kontak aktif.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Executive KPI Summary Cards (Direct Answers for Leadership) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Anggota Aktif & Komposisi */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              1. Jumlah Anggota Aktif
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {readinessSummary.totalMembersActive.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Kader Aktif Riil</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Pengurus Ber-SK:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {readinessSummary.totalPengurusBerSk} Org
              </span>
            </div>

            {/* Rincian Ringkas Dewan */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Dewan Pimpinan:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {members.filter((m) => m.status === 'Aktif' && m.isPengurus && getMemberSubOrgCategory(m) === 'PIMPINAN').length} Org
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pertimbangan & Pakar:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {members.filter((m) => m.status === 'Aktif' && m.isPengurus && (getMemberSubOrgCategory(m) === 'PERTIMBANGAN' || getMemberSubOrgCategory(m) === 'PAKAR')).length} Org
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Anggota Biasa (Basis KTP):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {readinessSummary.totalAnggotaBiasa.toLocaleString('id-ID')} Org
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kesiapan 15 DPD Kab/Kota */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              2. Kesiapan 15 DPD Kab/Kota
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {readinessSummary.fullyCompletedDpds.length}
              <span className="text-base text-slate-400 font-normal"> / 15</span>
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                readinessSummary.fullyCompletedDpds.length > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {readinessSummary.fullyCompletedDpds.length > 0 ? 'Lengkap 100%' : 'Dalam Proses'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Lengkap (36 Jabatan):
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {readinessSummary.fullyCompletedDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Sebagian Terisi:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {readinessSummary.partiallyFilledDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                Belum Terisi SK:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {readinessSummary.emptyDpds.length} DPD
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Penetrasi DPC & DPRt */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              3. Penetrasi DPC & DPRt
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {readinessSummary.completedDpcCount}
              <span className="text-base text-slate-400 font-normal"> / {readinessSummary.totalDpcCount}</span>
            </span>
            <span className="text-xs text-slate-500">DPC Ber-SK Lengkap</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Target DPC Se-Sulut:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                167 Kecamatan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Basis Desa Terdata:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {readinessSummary.completedDprtCount} DPRt
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Standar Formasi:</span>
              <span className="font-mono">17 Jabatan Inti / DPC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs & 15 Kab/Kota Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Status 15 DPD Kab/Kota:
            </h4>
            <span className="text-xs text-slate-400">
              (Klik kartu untuk melihat rincian & audit formasi)
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({regionStats.length})
            </button>
            <button
              onClick={() => setFilterTab('LENGKAP')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'LENGKAP'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lengkap ({regionStats.filter((r) => r.status === 'LENGKAP').length})</span>
            </button>
            <button
              onClick={() => setFilterTab('SEBAGIAN')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'SEBAGIAN'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Perlu Dilengkapi ({regionStats.filter((r) => r.status === 'SEBAGIAN').length})</span>
            </button>
            <button
              onClick={() => setFilterTab('KOSONG')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'KOSONG'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Belum Terisi ({regionStats.filter((r) => r.status === 'KOSONG').length})</span>
            </button>
          </div>
        </div>

        {/* 15 Kab/Kota Grid Cards - Clean, Spacious, Minimal Text */}
        <div key={filterTab} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-tab-enter">
          {filteredRegionStats.map((item) => {
            const {
              region,
              compliance,
              status,
              regMembersCount,
              filledDpcs,
              totalDpcs,
              filledDprts,
              totalDprts,
            } = item;

            return (
              <div
                key={region.id}
                onClick={() => {
                  setSelectedDrawerInitialTab('dpd');
                  setSelectedDrawerInitialDpc(null);
                  setSelectedDrawerRegion(region.name);
                }}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-xs hover:shadow-sm cursor-pointer space-y-3 group"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {region.name}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Zona: {region.zone || 'Sulut'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      status === 'LENGKAP'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : status === 'SEBAGIAN'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {status === 'LENGKAP'
                      ? '✓ Lengkap 36/36'
                      : status === 'SEBAGIAN'
                      ? `${compliance.filledCount}/36 Terisi`
                      : 'Belum Ada SK'}
                  </span>
                </div>

                {/* Single Clean Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Keterisian Formasi DPD:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {compliance.percentage}% ({compliance.filledCount}/36)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        compliance.percentage >= 100
                          ? 'bg-emerald-500'
                          : compliance.percentage > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(compliance.percentage, 2)}%` }}
                    />
                  </div>
                </div>

                {/* 3 Interactive Key Metrics: DPC, DPRt, Total Kader */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Metric 1: DPC */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDrawerInitialTab('dpc');
                      setSelectedDrawerInitialDpc(null);
                      setSelectedDrawerRegion(region.name);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group/stat"
                    title="Klik untuk membuka micro-page grid DPC Kecamatan"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                        DPC
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:text-blue-500 group-hover/stat:translate-x-0.5 transition-all" />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {filledDpcs} / {totalDpcs}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">Kecamatan</span>
                  </div>

                  {/* Metric 2: DPRt */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDrawerInitialTab('dpc');
                      setSelectedDrawerInitialDpc(null);
                      setSelectedDrawerRegion(region.name);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group/stat"
                    title="Klik untuk melihat sebaran DPRt Desa/Kelurahan"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                        DPRt
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:text-blue-500 group-hover/stat:translate-x-0.5 transition-all" />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {filledDprts} / {totalDprts}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">Desa/Kel</span>
                  </div>

                  {/* Metric 3: Total Kader */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDrawerInitialTab('dpd');
                      setSelectedDrawerInitialDpc(null);
                      setSelectedDrawerRegion(region.name);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                    title="Total kader riil ber-KTP di wilayah ini"
                  >
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                      Kader
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {regMembersCount} Org
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">Total Riil</span>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 font-medium">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Buka Rincian DPD</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {onOpenTerritorialMatrix && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTerritorialMatrix(region.name, undefined, 'DPD');
                      }}
                      className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Buka matriks DPD & import Excel"
                    >
                      <Table className="w-3 h-3" />
                      <span>Matriks & Import</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Slide-Over Micro-Page Drawer */}
      <TerritoryDetailDrawer
        isOpen={Boolean(selectedDrawerRegion)}
        onClose={() => setSelectedDrawerRegion(null)}
        regionName={selectedDrawerRegion}
        members={members}
        session={session}
        initialTab={selectedDrawerInitialTab}
        initialDpcName={selectedDrawerInitialDpc}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        onOpenStructureModal={onOpenStructureModal}
      />

    </div>
  );
};

export default UnifiedTerritorialReadiness;
