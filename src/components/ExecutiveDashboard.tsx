import React, { useState, useMemo } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { SulutMapVisual } from './SulutMapVisual';
import { TerritorialGrowthModal } from './TerritorialGrowthModal';
import { GrowthInteractiveChart } from './GrowthInteractiveChart';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  AlertCircle,
  BarChart3,
  Filter,
  Calendar,
  Sparkles,
  MapPin,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Maximize2,
  IdCard,
  Award,
  Eye,
  EyeOff,
} from 'lucide-react';
import { exportMembersToExcel } from '../utils/excelUtils';
import {
  GrowthPeriod,
  computeGrowthAnalytics,
  generateTestScenarioMembers,
  formatDisplayDate,
} from '../utils/growthUtils';

interface ExecutiveDashboardProps {
  members: Member[];
  session?: UserSession;
  onOpenPrintReport: () => void;
  onNavigateToMembers: (filterDpd?: string, filterStatus?: MemberStatus) => void;
  onOpenCardModal?: (member: Member) => void;
  onAddMembers?: (newMembers: Member[]) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  members,
  session,
  onOpenPrintReport,
  onNavigateToMembers,
  onOpenCardModal,
  onAddMembers,
}) => {
  const [selectedDpdFilter, setSelectedDpdFilter] = useState<string>('ALL');

  // Growth Analytics State
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>('30days');
  const [pinnedDate, setPinnedDate] = useState<string | undefined>(undefined);
  const [filterRecruiter, setFilterRecruiter] = useState<string | undefined>(undefined);
  const [growthViewTab, setGrowthViewTab] = useState<'territory' | 'recruiters'>('territory');

  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [modalInitialDpd, setModalInitialDpd] = useState<string | undefined>(undefined);
  const [modalInitialDpc, setModalInitialDpc] = useState<string | undefined>(undefined);
  const [modalInitialDprt, setModalInitialDprt] = useState<string | undefined>(undefined);
  const [modalInitialRecruiter, setModalInitialRecruiter] = useState<string | undefined>(undefined);

  // Accordion state for territorial tree inline viewing
  const [expandedDpds, setExpandedDpds] = useState<Record<string, boolean>>({});
  const [expandedDpcs, setExpandedDpcs] = useState<Record<string, boolean>>({});

  // Bar chart expanded items
  const [expandedBars, setExpandedBars] = useState<Record<string, boolean>>({});

  const toggleBarExpansion = (regionId: string) => {
    setExpandedBars((prev) => ({ ...prev, [regionId]: !prev[regionId] }));
  };

  const toggleDpdAccordion = (dpdName: string) => {
    setExpandedDpds((prev) => ({ ...prev, [dpdName]: !prev[dpdName] }));
  };

  const toggleDpcAccordion = (dpcKey: string) => {
    setExpandedDpcs((prev) => ({ ...prev, [dpcKey]: !prev[dpcKey] }));
  };

  // Filtered members by region if selected or scoped by role
  const scopedMembers = useMemo(() => {
    let list = members;
    if (session && session.role !== 'SUPER_ADMIN') {
      if (session.role === 'ADMIN_DPD') {
        list = list.filter((m) => m.dpd === session.dpdAccess);
      } else if (session.role === 'ADMIN_DPC') {
        list = list.filter(
          (m) =>
            m.dpd === session.dpdAccess &&
            (!session.dpcAccess || m.dpc === session.dpcAccess)
        );
      } else if (session.role === 'ADMIN_DPRT') {
        list = list.filter(
          (m) =>
            m.dpd === session.dpdAccess &&
            (!session.dpcAccess || m.dpc === session.dpcAccess) &&
            (!session.dprtAccess || m.dprt === session.dprtAccess)
        );
      }
    } else if (selectedDpdFilter !== 'ALL') {
      list = list.filter((m) => m.dpd === selectedDpdFilter);
    }
    return list;
  }, [members, session, selectedDpdFilter]);

  // Executive calculation: ONLY status "Aktif" is considered real active membership
  const activeMembers = scopedMembers.filter((m) => m.status === 'Aktif');
  const inactiveMembers = scopedMembers.filter((m) => m.status !== 'Aktif');

  const countMeninggal = scopedMembers.filter((m) => m.status === 'Non-Aktif (Meninggal)').length;
  const countPindahPartai = scopedMembers.filter(
    (m) => m.status === 'Non-Aktif (Pindah Partai/Mundur)'
  ).length;
  const countPindahDomisili = scopedMembers.filter(
    (m) => m.status === 'Non-Aktif (Pindah Domisili)'
  ).length;

  const totalRegistered = scopedMembers.length;
  const activePercentage =
    totalRegistered > 0 ? Math.round((activeMembers.length / totalRegistered) * 100) : 0;

  // Aggregate distribution per DPDs for Bar Chart (with DPC breakdown)
  const visibleRegions = useMemo(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.dpdAccess !== 'ALL') {
      return SULUT_REGIONS.filter((r) => r.name === session.dpdAccess);
    }
    return SULUT_REGIONS;
  }, [session]);

  const distributionData = visibleRegions.map((region) => {
    const regMembers = members.filter((m) => m.dpd === region.name);
    const active = regMembers.filter((m) => m.status === 'Aktif').length;
    const inactive = regMembers.length - active;

    // DPC (Kecamatan) breakdown for expanded view
    const dpcBreakdown = region.subdistricts.map((sub) => {
      const dpcMembers = regMembers.filter((m) => m.dpc === sub.name);
      const dpcActive = dpcMembers.filter((m) => m.status === 'Aktif').length;
      return {
        name: sub.name,
        active: dpcActive,
        inactive: dpcMembers.length - dpcActive,
        total: dpcMembers.length,
        percentage: dpcMembers.length > 0 ? Math.round((dpcActive / dpcMembers.length) * 100) : 0,
      };
    }).filter((d) => d.total > 0).sort((a, b) => b.active - a.active);

    return {
      name: region.name,
      id: region.id,
      active,
      inactive,
      total: regMembers.length,
      percentage: regMembers.length > 0 ? Math.round((active / regMembers.length) * 100) : 0,
      dpcBreakdown,
      totalDpc: region.subdistricts.length,
    };
  }).sort((a, b) => b.active - a.active);

  const maxActiveCount = Math.max(...distributionData.map((d) => d.active), 1);

  // Calculate Cadre Growth & Recruiter Analytics
  const growthAnalytics = useMemo(() => {
    const targetSource = !session || session.role === 'SUPER_ADMIN' ? members : scopedMembers;
    const activeDpd = !session || session.role === 'SUPER_ADMIN' ? selectedDpdFilter : session.dpdAccess;
    return computeGrowthAnalytics(targetSource, growthPeriod, activeDpd, pinnedDate, filterRecruiter);
  }, [members, scopedMembers, session, growthPeriod, selectedDpdFilter, pinnedDate, filterRecruiter]);

  // DPC distribution breakdown for Admin DPD
  const currentDpdRegion = SULUT_REGIONS.find((r) => r.name === session?.dpdAccess);
  const currentDpcList = useMemo(() => {
    if (!currentDpdRegion) return [];
    return currentDpdRegion.subdistricts
      .map((sub) => {
        const dpcMembers = scopedMembers.filter((m) => m.dpc === sub.name);
        const active = dpcMembers.filter((m) => m.status === 'Aktif').length;
        const inactive = dpcMembers.length - active;
        return {
          name: sub.name,
          villages: sub.villages,
          active,
          inactive,
          total: dpcMembers.length,
          percentage: dpcMembers.length > 0 ? Math.round((active / dpcMembers.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.active - a.active);
  }, [currentDpdRegion, scopedMembers]);

  const maxDpcActiveCount = Math.max(...currentDpcList.map((d) => d.active), 1);

  const maxDailyCount = Math.max(...growthAnalytics.dailyPoints.map((p) => p.count), 1);

  // Handler for quick scenario injection (+100 Minsel & +50 Manado by Cadres)
  const handleLoadTestScenario = () => {
    if (!onAddMembers) return;
    const testCadres = generateTestScenarioMembers();
    onAddMembers(testCadres);
    setGrowthPeriod('7days');
    setPinnedDate(undefined);
    setFilterRecruiter(undefined);
  };

  const openDrilldownModalWithFocus = (dpd?: string, dpc?: string, dprt?: string, recruiter?: string) => {
    setModalInitialDpd(dpd);
    setModalInitialDpc(dpc);
    setModalInitialDprt(dprt);
    setModalInitialRecruiter(recruiter);
    setIsGrowthModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Kicker & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {session && session.role !== 'SUPER_ADMIN'
                ? `Monitoring Teritorial · ${session.jabatan}`
                : 'Executive Briefing & Monitoring'}
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {session && session.role !== 'SUPER_ADMIN'
                ? `DPD NasDem ${session.dpdAccess}`
                : 'DPW Partai NasDem Sulut · Shadow Database'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {session && session.role !== 'SUPER_ADMIN'
              ? `Dashboard Keanggotaan DPD ${session.dpdAccess}`
              : 'Dashboard Eksekutif Keanggotaan NasDem Sulut'}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {session && session.role !== 'SUPER_ADMIN'
              ? `Memantau kekuatan kader aktif riil, sebaran anggota per kecamatan (DPC), dan laju perekrutan kader di wilayah ${session.dpdAccess}.`
              : 'Sistem shadow database mandiri DPW Partai NasDem Sulut secara otomatis memverifikasi kader yang terkonfirmasi riil Aktif di lapangan serta memetakan anggota baru yang direkrut oleh kader ke tingkat basis (DPD → DPC → DPRt) berdasarkan alamat KTP.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportMembersToExcel(activeMembers, `ANGGOTA_AKTIF_SULUT_${selectedDpdFilter}.xlsx`)}
            className="btn-white flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={onOpenPrintReport}
            className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cetak Laporan Atasan</span>
          </button>
        </div>
      </div>

      {/* Scope / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg shadow-xs transition-colors">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lingkup Wilayah Pantauan:</span>
          {session && session.role !== 'SUPER_ADMIN' ? (
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded">
              {session.jabatan} ({session.dpdAccess}
              {session.dpcAccess ? ` › Kec. ${session.dpcAccess}` : ''}
              {session.dprtAccess ? ` › ${session.dprtAccess}` : ''})
            </span>
          ) : (
            <select
              value={selectedDpdFilter}
              onChange={(e) => {
                setSelectedDpdFilter(e.target.value);
                setPinnedDate(undefined);
                setFilterRecruiter(undefined);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Seluruh Sulawesi Utara (15 DPD Kab/Kota)</option>
              {SULUT_REGIONS.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {session?.role === 'SUPER_ADMIN' && selectedDpdFilter !== 'ALL' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded font-medium">
              Filter Terpasang: {selectedDpdFilter}
            </span>
            <button
              onClick={() => {
                setSelectedDpdFilter('ALL');
                setPinnedDate(undefined);
                setFilterRecruiter(undefined);
              }}
              className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer"
            >
              Reset ke Semua
            </button>
          </div>
        )}
      </div>

      {/* 4 Primary Executive Metrics with Vibrant Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Anggota Aktif Riil */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
              Kekuatan Riil Lapangan
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight" data-tabular="true">
              {activeMembers.length.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Kader Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hanya menghitung data berstatus aktif yang terkonfirmasi di tingkat DPC & DPRt.
          </p>
          <button
            onClick={() => onNavigateToMembers(selectedDpdFilter === 'ALL' ? undefined : selectedDpdFilter, 'Aktif')}
            className="btn-white w-full justify-between mt-3.5 text-xs font-medium px-3 py-2 rounded-lg flex items-center cursor-pointer"
          >
            <span>Buka Daftar Anggota Aktif</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 2: Tingkat Keaktifan Validitas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider text-[11px]">
              Tingkat Keaktifan
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight" data-tabular="true">
              {activePercentage}%
            </span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Validitas
            </span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${activePercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {activeMembers.length} dari {totalRegistered} nama terdata masih aktif di basis teritorial.
          </p>
        </div>

        {/* Metric 3: Non-Aktif */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider text-[11px]">
              Non-Aktif
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
              <UserX className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight" data-tabular="true">
              {inactiveMembers.length}
            </span>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Kader
            </span>
          </div>
          <div className="mt-2.5 text-[11px] space-y-1.5 font-mono">
            <div className="flex justify-between items-center bg-rose-50/80 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
              <span className="text-rose-700 dark:text-rose-300">Wafat:</span>
              <span className="text-rose-800 dark:text-rose-200 font-bold">{countMeninggal}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/80 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900">
              <span className="text-purple-700 dark:text-purple-300">Pindah Partai:</span>
              <span className="text-purple-800 dark:text-purple-200 font-bold">{countPindahPartai}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-50/80 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              <span className="text-amber-700 dark:text-amber-300">Pindah Domisili:</span>
              <span className="text-amber-800 dark:text-amber-200 font-bold">{countPindahDomisili}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Struktur Kepengurusan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              Struktur Kepengurusan
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight" data-tabular="true">
              {session && session.role !== 'SUPER_ADMIN' ? '1' : '15'}
            </span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {session && session.role !== 'SUPER_ADMIN' ? `DPD Terpilih` : 'DPD Kab / Kota'}
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {session && session.role !== 'SUPER_ADMIN'
                ? `${currentDpdRegion?.subdistricts.length || 0} DPC Kecamatan di ${session.dpdAccess}`
                : '167 DPC Kecamatan di Sulut'}
            </p>
            <p>
              {session && session.role !== 'SUPER_ADMIN'
                ? `Yurisdiksi Daerah Mandiri`
                : 'Shadow database mandiri se-Sulut'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Anti-Duplikasi NIK Aktif</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REKRUTMEN ANGGOTA BARU OLEH KADER PENGGERAK & PENETRASI TERITORIAL KTP   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Cadre-Driven Recruitment Analytics
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Direkrut Langsung Oleh Kader Penggerak
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Monitoring Penambahan Anggota yang Direkrut oleh Kader Lapangan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Setiap anggota baru wajib terhubung dengan <strong className="text-amber-700 dark:text-amber-400 font-semibold">Kader Perekrut</strong> yang membawanya.
              Sistem secara otomatis menaruh domisili anggota baru ke DPRt (Kelurahan/Desa) berdasarkan alamat KTP, sehingga pimpinan mengetahui kader mana yang bergerak dan di daerah mana anggotanya bertambah.
            </p>
          </div>

          {/* Action & Period Selector */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Period Selector Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => {
                  setGrowthPeriod('today');
                  setPinnedDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  growthPeriod === 'today' && !pinnedDate
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  setGrowthPeriod('7days');
                  setPinnedDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  growthPeriod === '7days' && !pinnedDate
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => {
                  setGrowthPeriod('30days');
                  setPinnedDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  growthPeriod === '30days' && !pinnedDate
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => {
                  setGrowthPeriod('all');
                  setPinnedDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  growthPeriod === 'all' && !pinnedDate
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Quick Scenario Injector - Khusus Super Admin DPW */}
            {(!session || session.role === 'SUPER_ADMIN') && onAddMembers && (
              <button
                onClick={handleLoadTestScenario}
                className="btn-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer shadow-2xs"
                title="Muat data contoh: +100 Minahasa Selatan & +50 Manado yang direkrut kader"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulasi Rekrutmen (+100 Minsel, +50 Manado)</span>
              </button>
            )}

            {/* Fullscreen Inspector Button */}
            <button
              onClick={() => openDrilldownModalWithFocus()}
              className="btn-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Inspeksi Audit Lengkap</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Cadre-Recruitment Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Hari Ini */}
          <div
            onClick={() => {
              setGrowthPeriod('today');
              setPinnedDate(undefined);
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              growthPeriod === 'today' && !pinnedDate
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-500 dark:text-slate-400">Direkrut Hari Ini</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{growthAnalytics.todayCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Anggota baru masuk</p>
          </div>

          {/* Card 2: Kader yang Bergerak */}
          <div
            onClick={() => setGrowthViewTab('recruiters')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              growthViewTab === 'recruiters'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-amber-700 dark:text-amber-400">Kader Perekrut Aktif</span>
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {growthAnalytics.activeRecruitersCount} Kader
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Penggerak di lapangan</p>
          </div>

          {/* Card 3: 30 Hari Terakhir */}
          <div
            onClick={() => {
              setGrowthPeriod('30days');
              setPinnedDate(undefined);
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              growthPeriod === '30days' && !pinnedDate
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-500 dark:text-slate-400">Total Periode</span>
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              +{growthAnalytics.totalNew}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Hasil rekrutmen kader</p>
          </div>

          {/* Card 4: Top Perekrut */}
          <div
            onClick={() => {
              if (growthAnalytics.topRecruiter) {
                openDrilldownModalWithFocus(undefined, undefined, undefined, growthAnalytics.topRecruiter.nama);
              }
            }}
            className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-amber-700 dark:text-amber-400">Top Kader Perekrut</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={growthAnalytics.topRecruiter?.nama || 'Belum ada data'}>
              {growthAnalytics.topRecruiter ? growthAnalytics.topRecruiter.nama.split(',')[0] : '-'}
            </div>
            <p className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {growthAnalytics.topRecruiter ? `+${growthAnalytics.topRecruiter.count} Anggota Baru` : '0 Anggota'}
            </p>
          </div>
        </div>

        {/* Filter Indicator */}
        {(pinnedDate || filterRecruiter) && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Filter Aktif:{' '}
                {pinnedDate && <span>Tanggal <strong>{formatDisplayDate(pinnedDate)}</strong></span>}
                {pinnedDate && filterRecruiter && <span> · </span>}
                {filterRecruiter && <span>Direkrut oleh: <strong>{filterRecruiter}</strong></span>}{' '}
                ({growthAnalytics.totalNew} anggota baru)
              </span>
            </div>
            <button
              onClick={() => {
                setPinnedDate(undefined);
                setFilterRecruiter(undefined);
              }}
              className="text-amber-700 dark:text-amber-300 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Ultra-Interactive Cadre Growth Chart (Area Spline Wave & Modern Bars) */}
        <GrowthInteractiveChart
          dailyPoints={growthAnalytics.dailyPoints}
          pinnedDate={pinnedDate}
          onPinDate={(date) => setPinnedDate(date)}
          periodLabel={growthAnalytics.periodLabel}
          totalNew={growthAnalytics.totalNew}
        />

        {/* Tab Toggle: Peta Teritorial KTP vs Kader Perekrut */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setGrowthViewTab('territory')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                growthViewTab === 'territory'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>1. Sebaran Teritorial KTP (DPD → DPC → DPRt)</span>
            </button>
            <button
              onClick={() => setGrowthViewTab('recruiters')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                growthViewTab === 'recruiters'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>2. Kinerja Kader Perekrut ({growthAnalytics.recruitersList.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {growthAnalytics.totalNew} Anggota Baru Direkrut
          </span>
        </div>

        {/* VIEW 1: SEBARAN TERITORIAL KTP (DPD -> DPC -> DPRt) */}
        {growthViewTab === 'territory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Rincian Teritorial Penambahan (Alamat KTP Faktual)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik tombol <strong className="text-blue-600 dark:text-blue-400">Rincian DPC</strong> untuk membuka sebaran kecamatan, dan <strong className="text-indigo-600 dark:text-indigo-400">Rincian DPRt</strong> untuk melihat desa basis beserta kader perekrutnya.
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {growthAnalytics.territorialTree.length} Daerah Menyumbang Rekrutan
              </span>
            </div>

            {growthAnalytics.territorialTree.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">
                  Tidak ada data penambahan anggota pada periode atau filter ini.
                </p>
                {(!session || session.role === 'SUPER_ADMIN') && onAddMembers && (
                  <button
                    onClick={handleLoadTestScenario}
                    className="mt-3 btn-white text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Muat Contoh Rekrutmen (+100 Minsel, +50 Manado)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {growthAnalytics.territorialTree.map((dpdNode) => {
                  const isDpdExpanded = !!expandedDpds[dpdNode.name];

                  return (
                    <div
                      key={dpdNode.name}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {/* DPD Level Header Bar */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {dpdNode.name}
                              </h5>
                              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                +{dpdNode.count} Anggota Baru
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {dpdNode.percentage}% dari total rekrutan · Tersebar di {dpdNode.dpcs.length} DPC Kecamatan
                            </p>
                            {/* Cadres who recruited here */}
                            <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Direkrut oleh:</span>
                              {dpdNode.recruiters.slice(0, 3).map((r) => (
                                <span
                                  key={r.nama}
                                  className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.2 rounded"
                                >
                                  {r.nama.split(',')[0]} (+{r.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons on DPD */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openDrilldownModalWithFocus(dpdNode.name)}
                            className="btn-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Inspeksi Lengkap Modal"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Audit Tabel</span>
                          </button>

                          <button
                            onClick={() => toggleDpdAccordion(dpdNode.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isDpdExpanded
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <span>{isDpdExpanded ? 'Tutup Rincian' : `Buka ${dpdNode.dpcs.length} DPC`}</span>
                            {isDpdExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar of DPD Contribution */}
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 transition-all duration-500"
                          style={{ width: `${dpdNode.percentage}%` }}
                        ></div>
                      </div>

                      {/* Expanded Level 2: DPC (Kecamatan) List */}
                      {isDpdExpanded && (
                        <div className="p-4 sm:p-5 bg-slate-50/30 dark:bg-slate-950/30 space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Sebaran per DPC (Kecamatan) di {dpdNode.name}:
                            </span>
                            <span className="font-mono">{dpdNode.dpcs.length} Kecamatan</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dpdNode.dpcs.map((dpcNode) => {
                              const dpcKey = `${dpdNode.name}-${dpcNode.name}`;
                              const isDpcExpanded = !!expandedDpcs[dpcKey];

                              return (
                                <div
                                  key={dpcKey}
                                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                        Kec. {dpcNode.name}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                      +{dpcNode.count}
                                    </span>
                                  </div>

                                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                    Kader Pengusung: {dpcNode.recruiters.map((r) => r.nama.split(',')[0]).join(', ')}
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span>{dpcNode.dprts.length} Desa/Kelurahan (DPRt)</span>
                                    <button
                                      onClick={() => toggleDpcAccordion(dpcKey)}
                                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>{isDpcExpanded ? 'Tutup Desa' : 'Lihat DPRt'}</span>
                                      {isDpcExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                  </div>

                                  {/* Expanded Level 3: DPRt (Kelurahan/Desa) */}
                                  {isDpcExpanded && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                      {dpcNode.dprts.map((dprtNode) => (
                                        <div
                                          key={dprtNode.name}
                                          onClick={() => openDrilldownModalWithFocus(dpdNode.name, dpcNode.name, dprtNode.name)}
                                          className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer group text-xs"
                                          title="Klik untuk membuka daftar anggota di desa ini"
                                        >
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                Kel/Desa {dprtNode.name}
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 pl-3">
                                              Oleh: {dprtNode.recruiters.map((r) => r.nama.split(',')[0]).join(', ')}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                              +{dprtNode.count}
                                            </span>
                                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LEADERBOARD KADER PEREKRUT */}
        {growthViewTab === 'recruiters' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Kinerja Kader Perekrut di Lapangan</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik nama kader perekrut untuk membedah seluruh anggota yang dia rekrut beserta sebaran desa KTP-nya.
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {growthAnalytics.recruitersList.length} Kader Menggerakkan Rekrutmen
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {growthAnalytics.recruitersList.map((recruiter, idx) => (
                <div
                  key={recruiter.nama}
                  onClick={() => openDrilldownModalWithFocus(undefined, undefined, undefined, recruiter.nama)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-950 transition-all cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {recruiter.nama}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {recruiter.jabatan}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                        +{recruiter.count}
                      </span>
                    </div>

                    {/* Recruited territories */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] text-slate-400 block mb-1">Sebaran Alamat KTP Rekrutan:</span>
                      <div className="flex flex-wrap gap-1">
                        {recruiter.territories.slice(0, 3).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                          >
                            Kec. {t.dpc} ({t.dprt}: +{t.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Lihat Anggota Rekrutan</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart: Distribusi Anggota Aktif per DPD / DPC - Interactive */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase">
                Grafik Batang Distribusi
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {(!session || session.role === 'SUPER_ADMIN') ? '15 Kabupaten/Kota' : `DPD ${session?.dpdAccess}`}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {(!session || session.role === 'SUPER_ADMIN')
                ? 'Sebaran Jumlah Anggota Aktif per DPD'
                : `Sebaran Jumlah Anggota Aktif per DPC (Kecamatan)`}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {(!session || session.role === 'SUPER_ADMIN')
                ? <>Klik <strong className="text-blue-600 dark:text-blue-400">▼ Detail</strong> pada setiap DPD untuk melihat distribusi anggota per DPC (Kecamatan).</>
                : <>Distribusi anggota di setiap kecamatan (DPC) dalam wilayah <strong className="text-blue-600 dark:text-blue-400">{session?.dpdAccess}</strong>. Klik untuk melihat rincian DPRt (Kelurahan/Desa).</>}
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Aktif Riil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-400 rounded-xs"></span>
              <span className="text-rose-700 dark:text-rose-400 font-medium">Non-Aktif</span>
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart - Interactive with DPC Drill-Down */}
        <div className="space-y-2">
          {/* ===== SUPER ADMIN: 15 DPD Distribution ===== */}
          {(!session || session.role === 'SUPER_ADMIN') ? (
            <>
              {distributionData.map((item, index) => {
                const barWidthPercent = Math.max(Math.round((item.active / maxActiveCount) * 100), 4);
                const isSelected = selectedDpdFilter === item.name;
                const isBarExpanded = !!expandedBars[item.id];
                const maxDpcActive = Math.max(...(item.dpcBreakdown.map((d) => d.active)), 1);

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isBarExpanded
                        ? 'border-blue-300 dark:border-blue-700 shadow-sm bg-white dark:bg-slate-900'
                        : isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                  >
                    {/* Main Bar Row */}
                    <div className="flex items-center gap-0">
                      {/* Left: Filter Click Area */}
                      <div
                        onClick={() => setSelectedDpdFilter(isSelected ? 'ALL' : item.name)}
                        className="flex-1 p-2.5 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-slate-400 dark:text-slate-500 font-mono text-[11px] text-right font-medium">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-medium">
                                Terpilih
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold" data-tabular="true">
                              {item.active} Aktif
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="text-slate-600 dark:text-slate-400" data-tabular="true">
                              {item.total} Total
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">({item.percentage}%)</span>
                          </div>
                        </div>

                        {/* Bar representation */}
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full rounded-l-full transition-all duration-300 shadow-xs"
                            style={{ width: `${barWidthPercent}%` }}
                            title={`${item.active} Anggota Aktif`}
                          ></div>
                          {item.inactive > 0 && (
                            <div
                              className="bg-rose-400/80 h-full transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  Math.round((item.inactive / maxActiveCount) * 100),
                                  2
                                )}%`,
                              }}
                              title={`${item.inactive} Anggota Non-Aktif`}
                            ></div>
                          )}
                        </div>
                      </div>

                      {/* Right: Expand DPC Button */}
                      <button
                        onClick={() => toggleBarExpansion(item.id)}
                        className={`px-3 py-4 border-l transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium shrink-0 ${
                          isBarExpanded
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                            : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-blue-600'
                        }`}
                        title={isBarExpanded ? 'Tutup rincian DPC' : `Lihat ${item.totalDpc} DPC`}
                      >
                        {isBarExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tutup</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{item.dpcBreakdown.length} DPC</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded DPC Detail Panel */}
                    {isBarExpanded && (
                      <div className="border-t border-blue-100 dark:border-blue-900/60 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            Distribusi per DPC (Kecamatan) di {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.dpcBreakdown.length} / {item.totalDpc} DPC aktif
                          </span>
                        </div>

                        {item.dpcBreakdown.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic text-center py-3">
                            Belum ada anggota terdaftar di wilayah ini
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {item.dpcBreakdown.map((dpc, dIdx) => {
                              const dpcBarWidth = Math.max(Math.round((dpc.active / maxDpcActive) * 100), 6);
                              const dpcColor = dpc.percentage >= 80 ? 'emerald' : dpc.percentage >= 60 ? 'blue' : 'amber';

                              return (
                                <div
                                  key={dpc.name}
                                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                                >
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span className="font-medium text-slate-700 dark:text-slate-300">Kec. {dpc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono">
                                      <span className={`font-semibold text-${dpcColor}-600 dark:text-${dpcColor}-400`}>
                                        {dpc.active} Aktif
                                      </span>
                                      <span className="text-slate-300 dark:text-slate-600">/</span>
                                      <span className="text-slate-500">{dpc.total}</span>
                                      <span className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                        dpc.percentage >= 80
                                          ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                          : dpc.percentage >= 60
                                          ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                          : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                                      }`}>
                                        {dpc.percentage}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* DPC Mini Bar */}
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                                    <div
                                      className={`h-full rounded-l-full transition-all duration-300 ${
                                        dpc.percentage >= 80 ? 'bg-emerald-500' : dpc.percentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${dpcBarWidth}%` }}
                                    ></div>
                                    {dpc.inactive > 0 && (
                                      <div
                                        className="bg-rose-400/60 h-full transition-all duration-300"
                                        style={{ width: `${Math.max(Math.round((dpc.inactive / maxDpcActive) * 100), 3)}%` }}
                                      ></div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Summary Footer */}
                        <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.totalDpc - item.dpcBreakdown.length} DPC belum memiliki anggota</span>
                          <button
                            onClick={() => {
                              setSelectedDpdFilter(item.name);
                              toggleBarExpansion(item.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Filter ke {item.name}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            /* ===== NON-SUPER ADMIN: DPC (Kecamatan) Distribution of their DPD ===== */
            <>
              {currentDpcList.length === 0 ? (
                <div className="text-sm text-slate-400 italic text-center py-8">
                  Belum ada data anggota terdaftar di wilayah {session?.dpdAccess}.
                </div>
              ) : (
                currentDpcList.map((dpcItem, index) => {
                  const barWidthPercent = Math.max(Math.round((dpcItem.active / maxDpcActiveCount) * 100), 4);
                  const dpcColor = dpcItem.percentage >= 80 ? 'emerald' : dpcItem.percentage >= 60 ? 'blue' : 'amber';
                  const isBarExpanded = !!expandedBars[dpcItem.name];

                  // Get village (DPRt) breakdown for this DPC
                  const villageBreakdown = (dpcItem.villages || []).map((village: string) => {
                    const vMembers = scopedMembers.filter((m) => m.dpc === dpcItem.name && m.dprt === village);
                    const vActive = vMembers.filter((m) => m.status === 'Aktif').length;
                    return {
                      name: village,
                      active: vActive,
                      inactive: vMembers.length - vActive,
                      total: vMembers.length,
                      percentage: vMembers.length > 0 ? Math.round((vActive / vMembers.length) * 100) : 0,
                    };
                  }).filter((v: { total: number }) => v.total > 0).sort((a: { active: number }, b: { active: number }) => b.active - a.active);

                  const maxVillageActive = Math.max(...villageBreakdown.map((v: { active: number }) => v.active), 1);

                  return (
                    <div
                      key={dpcItem.name}
                      className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                        isBarExpanded
                          ? 'border-blue-300 dark:border-blue-700 shadow-sm bg-white dark:bg-slate-900'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                      }`}
                    >
                      {/* Main Bar Row */}
                      <div className="flex items-center gap-0">
                        <div className="flex-1 p-2.5 group">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-slate-400 dark:text-slate-500 font-mono text-[11px] text-right font-medium">
                                {String(index + 1).padStart(2, '0')}.
                              </span>
                              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Kec. {dpcItem.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono">
                              <span className={`font-bold text-${dpcColor}-600 dark:text-${dpcColor}-400`} data-tabular="true">
                                {dpcItem.active} Aktif
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">/</span>
                              <span className="text-slate-600 dark:text-slate-400" data-tabular="true">
                                {dpcItem.total} Total
                              </span>
                              <span className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                dpcItem.percentage >= 80
                                  ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                  : dpcItem.percentage >= 60
                                  ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                  : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                              }`}>
                                {dpcItem.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Bar representation */}
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-l-full transition-all duration-300 shadow-xs ${
                                dpcItem.percentage >= 80 ? 'bg-emerald-500' : dpcItem.percentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${barWidthPercent}%` }}
                              title={`${dpcItem.active} Anggota Aktif`}
                            ></div>
                            {dpcItem.inactive > 0 && (
                              <div
                                className="bg-rose-400/80 h-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(
                                    Math.round((dpcItem.inactive / maxDpcActiveCount) * 100),
                                    2
                                  )}%`,
                                }}
                                title={`${dpcItem.inactive} Anggota Non-Aktif`}
                              ></div>
                            )}
                          </div>
                        </div>

                        {/* Right: Expand DPRt (Villages) Button */}
                        <button
                          onClick={() => toggleBarExpansion(dpcItem.name)}
                          className={`px-3 py-4 border-l transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium shrink-0 ${
                            isBarExpanded
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                              : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-blue-600'
                          }`}
                          title={isBarExpanded ? 'Tutup rincian DPRt' : `Lihat DPRt (Kel/Desa)`}
                        >
                          {isBarExpanded ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Tutup</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{villageBreakdown.length} DPRt</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded DPRt (Village) Detail Panel */}
                      {isBarExpanded && (
                        <div className="border-t border-blue-100 dark:border-blue-900/60 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                              <Layers className="w-3.5 h-3.5 text-indigo-500" />
                              Distribusi per DPRt (Kelurahan/Desa) di Kec. {dpcItem.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {villageBreakdown.length} / {(dpcItem.villages || []).length} DPRt aktif
                            </span>
                          </div>

                          {villageBreakdown.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic text-center py-3">
                              Belum ada anggota terdaftar di kelurahan/desa kecamatan ini
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {villageBreakdown.map((village: { name: string; active: number; inactive: number; total: number; percentage: number }) => {
                                const vBarWidth = Math.max(Math.round((village.active / maxVillageActive) * 100), 6);
                                const vColor = village.percentage >= 80 ? 'emerald' : village.percentage >= 60 ? 'blue' : 'amber';

                                return (
                                  <div
                                    key={village.name}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                                  >
                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{village.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 font-mono">
                                        <span className={`font-semibold text-${vColor}-600 dark:text-${vColor}-400`}>
                                          {village.active} Aktif
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600">/</span>
                                        <span className="text-slate-500">{village.total}</span>
                                        <span className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                          village.percentage >= 80
                                            ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                            : village.percentage >= 60
                                            ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                            : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                                        }`}>
                                          {village.percentage}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Village Mini Bar */}
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                                      <div
                                        className={`h-full rounded-l-full transition-all duration-300 ${
                                          village.percentage >= 80 ? 'bg-emerald-500' : village.percentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${vBarWidth}%` }}
                                      ></div>
                                      {village.inactive > 0 && (
                                        <div
                                          className="bg-rose-400/60 h-full transition-all duration-300"
                                          style={{ width: `${Math.max(Math.round((village.inactive / maxVillageActive) * 100), 3)}%` }}
                                        ></div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Summary Footer */}
                          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{(dpcItem.villages || []).length - villageBreakdown.length} DPRt belum memiliki anggota</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Sulut Map Geographic Interactive Component — Only for Super Admin DPW */}
      {(!session || session.role === 'SUPER_ADMIN') && (
        <SulutMapVisual
          members={members}
          selectedDpd={selectedDpdFilter}
          onSelectDpd={(dpd) => setSelectedDpdFilter(dpd)}
        />
      )}

      {/* Atasan Briefing Callout */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl flex items-start gap-3.5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
        <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-900 dark:text-white">Catatan Operasional untuk Pimpinan / Atasan:</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Data keanggotaan di dashboard ini merupakan data operasional riil. Ketika kader penggerak merekrut anggota baru, sistem otomatis
            menghubungkan nama kader perekrut dengan anggota bersangkutan dan menaruh lokasinya ke DPRt berdasarkan alamat KTP secara akuntabel.
          </p>
        </div>
      </div>

      {/* Dedicated Territorial Growth Drilldown Modal */}
      <TerritorialGrowthModal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
        periodLabel={growthAnalytics.periodLabel}
        territorialTree={growthAnalytics.territorialTree}
        recruitersList={growthAnalytics.recruitersList}
        allFilteredMembers={growthAnalytics.filteredMembers}
        initialDpd={modalInitialDpd}
        initialDpc={modalInitialDpc}
        initialDprt={modalInitialDprt}
        initialRecruiter={modalInitialRecruiter}
        onOpenCardModal={onOpenCardModal}
      />
    </div>
  );
};
