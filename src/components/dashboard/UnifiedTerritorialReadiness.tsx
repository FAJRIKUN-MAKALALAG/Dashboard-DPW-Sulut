import React, { useState, useMemo } from 'react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { DPRT_STRUCTURE_TEMPLATE } from '../../data/structureTemplates';
import {
  computeStructureReadiness,
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getDpdPimpinanCompliance,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import {
  isJobTitleMatch,
  sortMembersByHierarchy,
  isDefinitiveLeader,
} from '../../utils/jobMatchingUtils';
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
  Search,
} from 'lucide-react';

interface UnifiedTerritorialReadinessProps {
  members: Member[];
  session?: UserSession;
  selectedDpdFilter?: string;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const UnifiedTerritorialReadiness: React.FC<UnifiedTerritorialReadinessProps> = ({
  members,
  session,
  selectedDpdFilter,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG'>('ALL');
  const [dprtSearchTerm, setDprtSearchTerm] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  
  // Selected DPD for slide-over Micro-Page drawer
  const [selectedDrawerRegion, setSelectedDrawerRegion] = useState<string | null>(null);
  const [selectedDrawerInitialTab, setSelectedDrawerInitialTab] = useState<'dpd' | 'dpc' | 'dprt'>('dpd');
  const [selectedDrawerInitialDpc, setSelectedDrawerInitialDpc] = useState<string | null>(null);

  const isSuperAdminOrDpw = !session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
  const isDpcScoped = session?.role === 'ADMIN_DPC' || (Boolean(session?.dpcAccess && session.dpcAccess !== 'ALL') && session?.role !== 'SUPER_ADMIN' && session?.role !== 'ADMIN_DPW');
  const isDprtScoped = session?.role === 'ADMIN_DPRT';
  const isDpdScoped = session?.role === 'ADMIN_DPD';
  const isRegionalScoped = !isSuperAdminOrDpw;

  // Active DPD scope (either from role access or Super Admin selection)
  const activeDpdScope = useMemo(() => {
    if (isRegionalScoped && session?.dpdAccess && session.dpdAccess !== 'ALL') {
      return session.dpdAccess;
    }
    if (selectedDpdFilter && selectedDpdFilter !== 'ALL') {
      return selectedDpdFilter;
    }
    return null;
  }, [isRegionalScoped, session, selectedDpdFilter]);

  // Scoped list of regions
  const regionsToDisplay = useMemo(() => {
    let list = SULUT_REGIONS;
    if (activeDpdScope) {
      const filtered = list.filter((r) => isDpdMatch(r.name, activeDpdScope));
      if (filtered.length > 0) list = filtered;
    }
    return list;
  }, [activeDpdScope]);

  // Current active region object if scoped
  const currentRegion = useMemo(() => {
    if (activeDpdScope) {
      const found = SULUT_REGIONS.find((r) => isDpdMatch(r.name, activeDpdScope));
      if (found) return found;
    }
    if (session?.dpcAccess && session.dpcAccess !== 'ALL') {
      const found = SULUT_REGIONS.find((r) =>
        r.subdistricts.some((s) => isDpcMatch(s.name, session.dpcAccess))
      );
      if (found) return found;
    }
    return regionsToDisplay[0] || null;
  }, [activeDpdScope, regionsToDisplay, session]);

  // Current active subdistrict if DPC scoped
  const currentSubdistrict = useMemo(() => {
    const dpcName = session?.dpcAccess;
    if (!dpcName || dpcName === 'ALL') return null;
    if (currentRegion) {
      const sub = currentRegion.subdistricts.find((s) => isDpcMatch(s.name, dpcName));
      if (sub) return sub;
    }
    for (const r of SULUT_REGIONS) {
      const sub = r.subdistricts.find((s) => isDpcMatch(s.name, dpcName));
      if (sub) return sub;
    }
    return null;
  }, [session, currentRegion]);

  // Filtered members by current territorial scope
  const scopedMembers = useMemo(() => {
    let list = members;
    if (isDprtScoped && session?.dprtAccess && activeDpdScope) {
      list = list.filter(
        (m) =>
          isDpdMatch(m.dpd, activeDpdScope) &&
          (!session.dpcAccess || isDpcMatch(m.dpc, session.dpcAccess)) &&
          isDprtMatch(m.dprt, session.dprtAccess)
      );
    } else if (isDpcScoped && session?.dpcAccess && activeDpdScope) {
      list = list.filter((m) => isDpdMatch(m.dpd, activeDpdScope) && isDpcMatch(m.dpc, session.dpcAccess));
    } else if (activeDpdScope) {
      list = list.filter((m) => isDpdMatch(m.dpd, activeDpdScope));
    }
    return list;
  }, [members, activeDpdScope, isDpcScoped, isDprtScoped, session]);

  // Active scoped members & committee breakdown
  const activeScopedMembers = useMemo(
    () => scopedMembers.filter((m) => m.status === 'Aktif'),
    [scopedMembers]
  );
  const activePengurus = useMemo(
    () => activeScopedMembers.filter((m) => m.isPengurus),
    [activeScopedMembers]
  );
  const totalAnggotaBiasa = activeScopedMembers.length - activePengurus.length;

  const dewanPimpinanCount = useMemo(
    () => activePengurus.filter((m) => getMemberSubOrgCategory(m) === 'PIMPINAN').length,
    [activePengurus]
  );
  const dewanPertimbanganCount = useMemo(
    () => activePengurus.filter((m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN').length,
    [activePengurus]
  );
  const dewanPakarCount = useMemo(
    () => activePengurus.filter((m) => getMemberSubOrgCategory(m) === 'PAKAR').length,
    [activePengurus]
  );

  // Fallback provincial readiness summary for Super Admin / DPW
  const readinessSummary = useMemo(() => computeStructureReadiness(members), [members]);

  // DPD Compliance for the scoped DPD
  const dpdCompliance = useMemo(() => {
    if (!currentRegion) return null;
    return getDpdPimpinanCompliance(currentRegion.name, members);
  }, [currentRegion, members]);

  // DPC & DPRt Penetration for the scoped DPD (counts only within this DPD)
  const regionalTerritoryStats = useMemo(() => {
    if (!currentRegion) return null;
    const totalDpcs = currentRegion.subdistricts.length;
    const totalDprts = currentRegion.subdistricts.reduce((sum, s) => sum + s.villages.length, 0);

    const filledDpcs = currentRegion.subdistricts.filter((sub) =>
      activeScopedMembers.some((m) => isDpcMatch(m.dpc, sub.name))
    ).length;

    let filledDprts = 0;
    currentRegion.subdistricts.forEach((sub) => {
      sub.villages.forEach((v) => {
        if (activeScopedMembers.some((m) => isDpcMatch(m.dpc, sub.name) && isDprtMatch(m.dprt, v))) {
          filledDprts++;
        }
      });
    });

    return {
      totalDpcs,
      totalDprts,
      filledDpcs,
      filledDprts,
    };
  }, [currentRegion, activeScopedMembers]);

  // DPC Scope Stats (if logged in as ADMIN_DPC)
  const dpcScopedStats = useMemo(() => {
    if (!isDpcScoped || !currentSubdistrict) return null;
    const totalVillages = currentSubdistrict.villages.length;
    const filledVillages = currentSubdistrict.villages.filter((v) =>
      activeScopedMembers.some((m) => isDprtMatch(m.dprt, v))
    ).length;
    const dpcPengurusCount = activePengurus.filter(
      (m) =>
        m.tingkatKepengurusan === 'DPC' ||
        (m.jabatan && (m.jabatan.toLowerCase().includes('dpc') || m.jabatan.toLowerCase().includes('cabang')))
    ).length;

    return {
      totalVillages,
      filledVillages,
      dpcPengurusCount,
    };
  }, [isDpcScoped, currentSubdistrict, activeScopedMembers, activePengurus]);

  // DPRt Scope Stats (if logged in as ADMIN_DPRT)
  const dprtScopedStats = useMemo(() => {
    if (!isDprtScoped || !session?.dprtAccess) return null;
    const dprtPengurus = activePengurus.filter(
      (m) =>
        m.tingkatKepengurusan === 'DPRt' ||
        (m.jabatan && (m.jabatan.toLowerCase().includes('dprt') || m.jabatan.toLowerCase().includes('ranting')))
    );
    const dprtPengurusCount = dprtPengurus.length;
    const hasKetua = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('ketua'));
    const hasSekretaris = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('sekretaris'));
    const hasBendahara = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('bendahara'));

    return {
      villageName: session.dprtAccess,
      dprtPengurusCount,
      ksbStatus: {
        ketua: hasKetua,
        sekretaris: hasSekretaris,
        bendahara: hasBendahara,
      },
    };
  }, [isDprtScoped, session, activePengurus]);

  // DPRt Villages Stats for DPC-scoped / DPRt-scoped view
  const dpcVillagesStats = useMemo(() => {
    if (!currentSubdistrict) return [];

    let targetVillages = currentSubdistrict.villages;
    if (isDprtScoped && session?.dprtAccess) {
      targetVillages = targetVillages.filter((v) => isDprtMatch(v, session.dprtAccess));
    }

    return targetVillages.map((villageName) => {
      // Find members in this specific village
      const villageMembers = activeScopedMembers.filter((m) => isDprtMatch(m.dprt, villageName));
      const villagePengurus = villageMembers.filter((m) => m.isPengurus || m.tingkatKepengurusan === 'DPRt');

      // Check filled slots out of 9 from DPRT_STRUCTURE_TEMPLATE
      const filledSlots = DPRT_STRUCTURE_TEMPLATE.filter((slot) =>
        villagePengurus.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
      );
      const filledCount = filledSlots.length;
      const percentage = Math.round((filledCount / 9) * 100);

      // Key personnel
      const sortedCadres = sortMembersByHierarchy(villageMembers);
      const ketuaDprt = sortedCadres.find((c) => isDefinitiveLeader(c.jabatan));
      const sekretarisDprt = sortedCadres.find((c) => (c.jabatan || '').toLowerCase().includes('sekretaris'));
      const bendaharaDprt = sortedCadres.find((c) => (c.jabatan || '').toLowerCase().includes('bendahara'));

      let status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' = 'KOSONG';
      if (filledCount >= 9) {
        status = 'LENGKAP';
      } else if (filledCount > 0 || villageMembers.length > 0) {
        status = 'SEBAGIAN';
      }

      return {
        name: villageName,
        totalCadres: villageMembers.length,
        totalPengurus: villagePengurus.length,
        filledCount,
        percentage,
        status,
        ketuaDprt,
        sekretarisDprt,
        bendaharaDprt,
        cadres: villageMembers,
      };
    });
  }, [currentSubdistrict, activeScopedMembers, isDprtScoped, session]);

  // Filtered DPRt villages by tab and search
  const filteredDprtVillages = useMemo(() => {
    return dpcVillagesStats.filter((v) => {
      if (filterTab !== 'ALL' && v.status !== filterTab) return false;
      if (dprtSearchTerm.trim() && !v.name.toLowerCase().includes(dprtSearchTerm.trim().toLowerCase())) return false;
      return true;
    });
  }, [dpcVillagesStats, filterTab, dprtSearchTerm]);

  // Compute readiness stats per region once for efficiency (used in bottom cards)
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs space-y-5 sm:space-y-6 transition-colors">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
              Kesiapan Struktur & Teritorial
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
              {isDprtScoped
                ? `DPRt Desa ${session?.dprtAccess}`
                : isDpcScoped
                ? `Kecamatan ${session?.dpcAccess}`
                : activeDpdScope
                ? `Wilayah ${activeDpdScope}`
                : '15 Kab/Kota Se-Sulut'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Status Kepengurusan & Keterisian Wilayah
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {isDprtScoped
              ? `Pemantauan keterisian 9 jabatan formasi DPRt di Desa/Kelurahan ${session?.dprtAccess}, Kecamatan ${session?.dpcAccess || ''}.`
              : isDpcScoped
              ? `Pemantauan keterisian 17 jabatan DPC dan penetrasi DPRt desa di Kecamatan ${session?.dpcAccess}, ${activeDpdScope || 'Sulut'}.`
              : activeDpdScope
              ? `Pemantauan keterisian 36 jabatan DPD, penetrasi DPC kecamatan, dan DPRt desa di ${activeDpdScope}.`
              : 'Pemantauan keterisian 36 jabatan DPD, penetrasi DPC kecamatan, dan DPRt desa se-Sulawesi Utara.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lihat standar data yang wajib dilengkapi"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{showGuidelines ? 'Tutup Panduan' : 'Panduan SK'}</span>
            {showGuidelines ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          {onOpenStructureModal && (
            <button
              onClick={() =>
                onOpenStructureModal(
                  activeDpdScope || 'ALL',
                  isDprtScoped ? 'DPRt' : isDpcScoped ? 'DPC' : activeDpdScope ? 'DPD' : 'ALL'
                )
              }
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengurus Ber-SK</span>
            </button>
          )}

          {onOpenTerritorialMatrix && (
            <button
              onClick={() =>
                onOpenTerritorialMatrix(
                  activeDpdScope || undefined,
                  isDpcScoped || isDprtScoped ? session?.dpcAccess || undefined : undefined,
                  isDprtScoped ? 'DPRt' : isDpcScoped ? 'DPC' : activeDpdScope ? 'DPD' : undefined
                )
              }
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Lengkap</span>
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
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              1. Jumlah Anggota Aktif
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {(activeDpdScope ? activeScopedMembers.length : readinessSummary.totalMembersActive).toLocaleString('id-ID')}
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
                {activeDpdScope ? activePengurus.length : readinessSummary.totalPengurusBerSk} Org
              </span>
            </div>

            {/* Rincian Ringkas Dewan (Hidden on mobile to keep minimalist) */}
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Dewan Pimpinan:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {activeDpdScope
                  ? dewanPimpinanCount
                  : members.filter((m) => m.status === 'Aktif' && m.isPengurus && getMemberSubOrgCategory(m) === 'PIMPINAN').length} Org
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pertimbangan & Pakar:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {activeDpdScope
                  ? dewanPertimbanganCount + dewanPakarCount
                  : members.filter((m) => m.status === 'Aktif' && m.isPengurus && (getMemberSubOrgCategory(m) === 'PERTIMBANGAN' || getMemberSubOrgCategory(m) === 'PAKAR')).length} Org
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Anggota Biasa (Basis KTP):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {(activeDpdScope ? totalAnggotaBiasa : readinessSummary.totalAnggotaBiasa).toLocaleString('id-ID')} Org
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kesiapan Formasi (Adaptif DPRt / DPC / DPD / Provinsi) */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              {isDprtScoped
                ? '2. Kesiapan Formasi DPRt'
                : isDpcScoped
                ? '2. Kesiapan Formasi DPC'
                : activeDpdScope
                ? '2. Kesiapan Formasi DPD'
                : '2. Kesiapan 15 DPD Kab/Kota'}
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          {isDprtScoped && dprtScopedStats ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {dprtScopedStats.dprtPengurusCount}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / 9</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    dprtScopedStats.dprtPengurusCount >= 9
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : dprtScopedStats.dprtPengurusCount > 0
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {dprtScopedStats.dprtPengurusCount >= 9
                    ? 'Lengkap 100%'
                    : dprtScopedStats.dprtPengurusCount > 0
                    ? 'Sebagian Terisi'
                    : 'Belum Ada SK'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Target Formasi DPRt:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    9 Jabatan Inti
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Pengurus Terdaftar:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dprtScopedStats.dprtPengurusCount} Pengurus
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Status KSB Ranting:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    K: {dprtScopedStats.ksbStatus.ketua ? '✓' : '—'} · S: {dprtScopedStats.ksbStatus.sekretaris ? '✓' : '—'} · B: {dprtScopedStats.ksbStatus.bendahara ? '✓' : '—'}
                  </span>
                </div>
              </div>
            </>
          ) : isDpcScoped && dpcScopedStats ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {dpcScopedStats.dpcPengurusCount}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / 17</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    dpcScopedStats.dpcPengurusCount >= 17
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : dpcScopedStats.dpcPengurusCount > 0
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {dpcScopedStats.dpcPengurusCount >= 17
                    ? 'Lengkap 100%'
                    : dpcScopedStats.dpcPengurusCount > 0
                    ? 'Sebagian Terisi'
                    : 'Belum Ada SK'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Target Formasi DPC:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    17 Jabatan Inti
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Pengurus Terdaftar:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dpcScopedStats.dpcPengurusCount} Pengurus
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    Kekosongan Jabatan:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {Math.max(0, 17 - dpcScopedStats.dpcPengurusCount)} Jabatan
                  </span>
                </div>
              </div>
            </>
          ) : activeDpdScope && dpdCompliance ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {dpdCompliance.filledCount}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / 36</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    dpdCompliance.isComplete
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : dpdCompliance.filledCount > 0
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {dpdCompliance.isComplete
                    ? 'Lengkap 100%'
                    : dpdCompliance.filledCount > 0
                    ? 'Sebagian Terisi'
                    : 'Belum Terisi SK'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Dewan Pimpinan (36 Posisi):
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dpdCompliance.filledCount} / 36 Terisi
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Pertimbangan & Pakar:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dewanPertimbanganCount + dewanPakarCount} Org
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Status KSB Inti:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    K: {dpdCompliance?.ksbStatus?.ketua ? '✓' : '—'} · S: {dpdCompliance?.ksbStatus?.sekretaris ? '✓' : '—'} · B: {dpdCompliance?.ksbStatus?.bendahara ? '✓' : '—'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Global Prov. 15 DPD */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {readinessSummary.fullyCompletedDpds.length}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / 15</span>
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
            </>
          )}
        </div>

        {/* Card 3: Penetrasi DPC & DPRt (Adaptif DPRt / DPC / DPD / Provinsi) */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              {isDprtScoped
                ? '3. Basis Teritorial DPRt'
                : isDpcScoped
                ? '3. Penetrasi DPRt Desa'
                : '3. Penetrasi DPC & DPRt'}
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          {isDprtScoped ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeScopedMembers.length}
                </span>
                <span className="text-xs text-slate-500">Kader Terdata di Desa</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Yurisdiksi:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Desa {session?.dprtAccess}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Kecamatan:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {session?.dpcAccess || '-'}
                  </span>
                </div>
                <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tingkat Kepengurusan:</span>
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">DPRt Basis Desa</span>
                </div>
              </div>
            </>
          ) : isDpcScoped && dpcScopedStats ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {dpcScopedStats.filledVillages}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / {dpcScopedStats.totalVillages}</span>
                </span>
                <span className="text-xs text-slate-500">DPRt Basis Desa</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Target Desa/Kel:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dpcScopedStats.totalVillages} Desa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Ber-Kader:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dpcScopedStats.filledVillages} Desa
                  </span>
                </div>
                <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
                  <span>Standar Formasi:</span>
                  <span className="font-mono">9 Jabatan Inti / DPRt</span>
                </div>
              </div>
            </>
          ) : activeDpdScope && regionalTerritoryStats ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {regionalTerritoryStats.filledDpcs}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / {regionalTerritoryStats.totalDpcs}</span>
                </span>
                <span className="text-xs text-slate-500">DPC Kecamatan Terdata</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Target DPC di {currentRegion?.name || 'Daerah'}:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {regionalTerritoryStats.totalDpcs} Kecamatan
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Basis Desa:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {regionalTerritoryStats.filledDprts} / {regionalTerritoryStats.totalDprts} Desa
                  </span>
                </div>
                <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
                  <span>Standar Formasi:</span>
                  <span className="font-mono">17 Jabatan Inti / DPC</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Global Prov. */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {readinessSummary.completedDpcCount}
                  <span className="text-sm sm:text-base text-slate-400 font-normal"> / {readinessSummary.totalDpcCount}</span>
                </span>
                <span className="text-xs text-slate-500">DPC Ber-SK Lengkap</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Target DPC:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    167 Kecamatan
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Basis Desa:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {readinessSummary.completedDprtCount} DPRt
                  </span>
                </div>
                <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
                  <span>Standar Formasi:</span>
                  <span className="font-mono">17 Jabatan Inti / DPC</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Filter Tabs & Grid (DPRt Grid for DPC/DPRt Admin; DPD Grid for DPW/DPD Admin) */}
      <div className="space-y-3 sm:space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isDprtScoped
                  ? `Wilayah Kerja DPRt Desa ${session?.dprtAccess}:`
                  : isDpcScoped
                  ? `Wilayah Kerja Kecamatan ${session?.dpcAccess || currentSubdistrict?.name || 'Amurang'}:`
                  : activeDpdScope
                  ? `Status Teritorial ${activeDpdScope}:`
                  : 'Status 15 DPD Kab/Kota:'}
              </h4>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400">
              {isDpcScoped || isDprtScoped
                ? `(Daftar ${dpcVillagesStats.length} DPRt Basis Desa / Kelurahan di Kec. ${session?.dpcAccess || currentSubdistrict?.name || 'Amurang'})`
                : '(Klik kartu untuk melihat rincian & audit formasi)'}
            </span>
          </div>

          {/* Action on Header Right */}
          {isDpcScoped || isDprtScoped ? (
            <div className="flex items-center gap-2">
              {onOpenTerritorialMatrix && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenTerritorialMatrix(
                      currentRegion?.name || activeDpdScope || 'Kabupaten Minahasa Selatan',
                      session?.dpcAccess || currentSubdistrict?.name || 'Amurang',
                      'DPRt'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Buka Matriks Struktur DPRt untuk input & import Excel"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Matriks DPRt Kec. {session?.dpcAccess || currentSubdistrict?.name || 'Amurang'}</span>
                </button>
              )}
            </div>
          ) : regionsToDisplay.length > 1 ? (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs overflow-x-auto max-w-full shrink-0">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  filterTab === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({regionStats.length})
              </button>
              <button
                onClick={() => setFilterTab('LENGKAP')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'LENGKAP'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Lengkap ({regionStats.filter((r) => r.status === 'LENGKAP').length})</span>
              </button>
              <button
                onClick={() => setFilterTab('SEBAGIAN')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'SEBAGIAN'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Perlu Dilengkapi</span>
                  <span className="sm:hidden">Sebagian</span> ({regionStats.filter((r) => r.status === 'SEBAGIAN').length})
                </span>
              </button>
              <button
                onClick={() => setFilterTab('KOSONG')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'KOSONG'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Belum Terisi</span>
                  <span className="sm:hidden">Kosong</span> ({regionStats.filter((r) => r.status === 'KOSONG').length})
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                1 Wilayah Terverifikasi
              </span>
            </div>
          )}
        </div>

        {/* DPRt Filter Bar & Search (For DPC/DPRt Admin) */}
        {(isDpcScoped || isDprtScoped) && dpcVillagesStats.length > 1 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            {/* Filter Pills for DPRt */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs overflow-x-auto max-w-full shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  filterTab === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({dpcVillagesStats.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('LENGKAP')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'LENGKAP'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Lengkap ({dpcVillagesStats.filter((r) => r.status === 'LENGKAP').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('SEBAGIAN')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'SEBAGIAN'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Perlu Dilengkapi</span>
                  <span className="sm:hidden">Sebagian</span> ({dpcVillagesStats.filter((r) => r.status === 'SEBAGIAN').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('KOSONG')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  filterTab === 'KOSONG'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Belum Terisi</span>
                  <span className="sm:hidden">Kosong</span> ({dpcVillagesStats.filter((r) => r.status === 'KOSONG').length})
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={`Cari nama desa / kelurahan...`}
                value={dprtSearchTerm}
                onChange={(e) => setDprtSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* 4A. DPRt Villages Grid (For DPC & DPRt Admin) */}
        {isDpcScoped || isDprtScoped ? (
          <div key={`dprt-grid-${filterTab}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 animate-tab-enter">
            {filteredDprtVillages.map((village) => (
              <div
                key={village.name}
                onClick={() => {
                  setSelectedDrawerInitialTab('dprt');
                  setSelectedDrawerInitialDpc(session?.dpcAccess || currentSubdistrict?.name || 'Amurang');
                  setSelectedDrawerRegion(currentRegion?.name || activeDpdScope || 'Kabupaten Minahasa Selatan');
                }}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs hover:shadow-sm cursor-pointer space-y-3 group flex flex-col justify-between"
              >
                {/* Header Card */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">DPRt {village.name}</span>
                      </h5>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block">
                        Kec. {session?.dpcAccess || currentSubdistrict?.name || 'Amurang'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        village.status === 'LENGKAP'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : village.status === 'SEBAGIAN'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {village.status === 'LENGKAP'
                        ? '✓ Lengkap 9/9'
                        : village.filledCount > 0
                        ? `${village.filledCount}/9 Terisi`
                        : village.totalCadres > 0
                        ? `${village.totalCadres} Kader`
                        : 'Belum Ada Kader'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Formasi DPRt (9 Inti) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-[11px]">
                    <span className="text-slate-500">Keterisian Formasi DPRt:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {village.percentage}% ({village.filledCount}/9)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        village.percentage >= 100
                          ? 'bg-emerald-500'
                          : village.percentage > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(village.percentage, village.totalCadres > 0 ? 6 : 2)}%` }}
                    />
                  </div>
                </div>

                {/* 3 Metric Chips */}
                <div className="grid grid-cols-3 gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                      Formasi
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {village.filledCount} / 9
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Jabatan</span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                      Kader
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {village.totalCadres} Org
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Aktif Riil</span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                      KSB
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {village.ketuaDprt ? 'K✓' : 'K—'} {village.sekretarisDprt ? 'S✓' : 'S—'}
                    </span>
                    <span className="text-[8.5px] text-slate-400 block truncate">Inti</span>
                  </div>
                </div>

                {/* Core Leader or Cadre Info */}
                <div className="text-[11px] text-slate-600 dark:text-slate-400 min-h-[22px] flex items-center">
                  {village.ketuaDprt ? (
                    <div className="flex items-center gap-1.5 text-[10.5px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 w-full truncate">
                      <span className="font-black text-[9px] font-mono px-1 rounded bg-amber-500 text-slate-950">#1</span>
                      <span className="font-bold truncate">Ketua: {village.ketuaDprt.namaLengkap}</span>
                    </div>
                  ) : village.totalCadres > 0 ? (
                    <div className="text-[10.5px] text-slate-500 truncate">
                      &bull; {village.cadres[0].namaLengkap} ({village.cadres[0].jabatan || 'Anggota'})
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum ada kader terdaftar</span>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 font-medium mt-auto">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Rincian DPRt</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {onOpenTerritorialMatrix && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTerritorialMatrix(
                          currentRegion?.name || activeDpdScope || 'Kabupaten Minahasa Selatan',
                          session?.dpcAccess || currentSubdistrict?.name || 'Amurang',
                          'DPRt'
                        );
                      }}
                      className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Buka matriks DPRt & import Excel"
                    >
                      <Table className="w-3 h-3" />
                      <span>Matriks DPRt</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredDprtVillages.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">Tidak ada DPRt desa/kelurahan yang cocok dengan filter atau kata kunci pencarian.</p>
              </div>
            )}
          </div>
        ) : (
          /* 4B. 15 Kab/Kota Grid Cards (For DPW, Super Admin, and DPD Admin) */
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
                  className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-xs hover:shadow-sm cursor-pointer space-y-2.5 sm:space-y-3 group"
                >
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {region.name}
                      </h5>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                        Zona: {region.zone || 'Sulut'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
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
                    <div className="flex justify-between text-[10px] sm:text-[11px]">
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
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Metric 1: DPC */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerInitialTab('dpc');
                        setSelectedDrawerInitialDpc(null);
                        setSelectedDrawerRegion(region.name);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group/stat"
                      title="Klik untuk membuka micro-page grid DPC Kecamatan"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                          DPC
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:text-blue-500 group-hover/stat:translate-x-0.5 transition-all" />
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block mt-0.5">
                        {filledDpcs} / {totalDpcs}
                      </span>
                      <span className="text-[9px] sm:text-[9.5px] text-slate-400 block truncate">Kecamatan</span>
                    </div>

                    {/* Metric 2: DPRt */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerInitialTab('dpc');
                        setSelectedDrawerInitialDpc(null);
                        setSelectedDrawerRegion(region.name);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group/stat"
                      title="Klik untuk melihat sebaran DPRt Desa/Kelurahan"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                          DPRt
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:text-blue-500 group-hover/stat:translate-x-0.5 transition-all" />
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block mt-0.5">
                        {filledDprts} / {totalDprts}
                      </span>
                      <span className="text-[9px] sm:text-[9.5px] text-slate-400 block truncate">Desa/Kel</span>
                    </div>

                    {/* Metric 3: Total Kader */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerInitialTab('dpd');
                        setSelectedDrawerInitialDpc(null);
                        setSelectedDrawerRegion(region.name);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                      title="Total kader riil ber-KTP di wilayah ini"
                    >
                      <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                        Kader
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block mt-0.5">
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
        )}
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
