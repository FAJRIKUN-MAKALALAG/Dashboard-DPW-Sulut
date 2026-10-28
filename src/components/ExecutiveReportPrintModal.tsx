import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Member, MemberStatus } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../utils/structureReadinessUtils';
import { getMembersFromApi as getMembersFromSupabase, isBackendConfigured as isSupabaseConfigured } from '../utils/backendClient';
import { loadMembers, saveMembers } from '../utils/storage';
import {
  exportMembersToExcel,
  exportMembersToCsv,
  exportDpdStatisticsToExcel,
  exportDpdStatisticsToCsv,
  DpdStatRow,
} from '../utils/excelUtils';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import anniversaryLogo from '../assets/logo/Logo_15_Ultah.png';
import {
  Printer,
  Download,
  X,
  Building2,
  Filter,
  FileSpreadsheet,
  FileDown,
  BarChart3,
  ListFilter,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  UserX,
  FileText,
  RefreshCw,
  Database,
  Search,
  RotateCcw,
  MapPin,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Phone,
  ChevronDown,
} from 'lucide-react';

interface ExecutiveReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialDpd?: string;
}

export const ExecutiveReportPrintModal: React.FC<ExecutiveReportPrintModalProps> = ({
  isOpen,
  onClose,
  members,
  initialDpd = 'ALL',
}) => {
  // Report Type: 'STATISTICS' (ringkasan statistik per DPD) vs 'NOMINATIVE' (daftar rinci nama)
  const [reportType, setReportType] = useState<'STATISTICS' | 'NOMINATIVE'>('STATISTICS');

  // Nominative Granular Filters
  const [filterDpd, setFilterDpd] = useState<string>(initialDpd);
  const [filterDpc, setFilterDpc] = useState<string>('ALL');
  const [filterTingkat, setFilterTingkat] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('Aktif');
  const [filterJabatanKategori, setFilterJabatanKategori] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'dpd_asc' | 'ekta_asc' | 'tingkat_desc'>('name_asc');
  const [limitCount, setLimitCount] = useState<string>('ALL');
  const [showFilterPanelMobile, setShowFilterPanelMobile] = useState<boolean>(true);

  // Real-time Database Members State
  const [liveMembers, setLiveMembers] = useState<Member[]>(members);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dbStatusText, setDbStatusText] = useState<string>('Database Tersinkron');

  // Keep liveMembers in sync with members prop
  useEffect(() => {
    if (members && members.length > 0) {
      setLiveMembers(members);
    }
  }, [members]);

  // Pull fresh data directly from Supabase / localStorage on demand
  const refreshFromDatabase = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        const cloudMembers = await getMembersFromSupabase();
        if (cloudMembers && cloudMembers.length > 0) {
          setLiveMembers(cloudMembers);
          saveMembers(cloudMembers);
          setDbStatusText('Supabase Realtime Live');
        } else {
          const local = loadMembers();
          if (local && local.length > 0) setLiveMembers(local);
          setDbStatusText('Database Lokal');
        }
      } else {
        const local = loadMembers();
        if (local && local.length > 0) setLiveMembers(local);
        setDbStatusText('Penyimpanan Lokal');
      }
    } catch (err) {
      console.warn('Gagal sinkron database pada modal cetak:', err);
      const local = loadMembers();
      if (local && local.length > 0) setLiveMembers(local);
      setDbStatusText('Database Lokal');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Sync automatically whenever modal opens
  useEffect(() => {
    if (isOpen) {
      refreshFromDatabase();
    }
  }, [isOpen, refreshFromDatabase]);

  // Compute 15 DPD Statistics with robust isDpdMatch
  const dpdStats: DpdStatRow[] = useMemo(() => {
    return SULUT_REGIONS.map((region, idx) => {
      const regMembers = liveMembers.filter((m) => isDpdMatch(m.dpd, region.name));
      const total = regMembers.length;
      const aktif = regMembers.filter((m) => m.status === 'Aktif').length;
      const meninggal = regMembers.filter((m) => m.status === 'Non-Aktif (Meninggal)').length;
      const pindahPartai = regMembers.filter(
        (m) => m.status === 'Non-Aktif (Pindah Partai/Mundur)'
      ).length;
      const pindahDomisili = regMembers.filter(
        (m) => m.status === 'Non-Aktif (Pindah Domisili)'
      ).length;
      const persentaseAktif = total > 0 ? Math.round((aktif / total) * 100) : 0;

      let statusKesiapan = 'Stabil';
      if (persentaseAktif >= 80) statusKesiapan = 'Kesiapan Tinggi';
      else if (persentaseAktif < 65) statusKesiapan = 'Perlu Konsolidasi';

      return {
        no: idx + 1,
        dpd: region.name,
        zona: region.zone,
        dpcCount: region.subdistricts.length,
        total,
        aktif,
        persentaseAktif,
        meninggal,
        pindahPartai,
        pindahDomisili,
        statusKesiapan,
      };
    });
  }, [liveMembers]);

  // Total summary of all 15 DPDs
  const grandTotal = useMemo(() => {
    const totalAll = dpdStats.reduce((acc, curr) => acc + curr.total, 0);
    const aktifAll = dpdStats.reduce((acc, curr) => acc + curr.aktif, 0);
    const meninggalAll = dpdStats.reduce((acc, curr) => acc + curr.meninggal, 0);
    const pindahPartaiAll = dpdStats.reduce((acc, curr) => acc + curr.pindahPartai, 0);
    const pindahDomisiliAll = dpdStats.reduce((acc, curr) => acc + curr.pindahDomisili, 0);
    const dpcAll = dpdStats.reduce((acc, curr) => acc + curr.dpcCount, 0);
    const nonAktifAll = totalAll - aktifAll;
    const avgPersen = totalAll > 0 ? Math.round((aktifAll / totalAll) * 100) : 0;

    return {
      totalAll,
      aktifAll,
      meninggalAll,
      pindahPartaiAll,
      pindahDomisiliAll,
      dpcAll,
      nonAktifAll,
      avgPersen,
    };
  }, [dpdStats]);

  // Available DPCs based on selected DPD
  const availableDpcs = useMemo(() => {
    if (filterDpd === 'ALL') {
      const dpcs = Array.from(new Set(liveMembers.map((m) => m.dpc).filter(Boolean))).sort();
      return dpcs;
    }
    const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, filterDpd));
    if (!reg) return [];
    return reg.subdistricts.map((s) => s.name);
  }, [filterDpd, liveMembers]);

  // Handle DPD change & auto reset child DPC filter
  const handleDpdChange = (newDpd: string) => {
    setFilterDpd(newDpd);
    setFilterDpc('ALL');
  };

  // Reset all filters back to clean default
  const handleResetFilters = () => {
    setFilterDpd('ALL');
    setFilterDpc('ALL');
    setFilterTingkat('ALL');
    setFilterStatus('Aktif');
    setFilterJabatanKategori('ALL');
    setSearchQuery('');
    setSortBy('name_asc');
    setLimitCount('ALL');
  };

  const hasActiveFilters =
    filterDpd !== 'ALL' ||
    filterDpc !== 'ALL' ||
    filterTingkat !== 'ALL' ||
    filterStatus !== 'Aktif' ||
    filterJabatanKategori !== 'ALL' ||
    searchQuery.trim().length > 0 ||
    limitCount !== 'ALL';

  // Granular Filter for nominative member list
  const nominativeMembers = useMemo(() => {
    let list = liveMembers.filter((m) => {
      // 1. DPD Filter
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;

      // 2. DPC Filter
      if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return false;

      // 3. Status Filter
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;

      // 4. Tingkat Kepengurusan Filter
      if (filterTingkat !== 'ALL') {
        if (filterTingkat === 'BUKAN_PENGURUS') {
          if (m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus')) {
            return false;
          }
        } else {
          if (m.tingkatKepengurusan !== filterTingkat) return false;
        }
      }

      // 5. Kategori Jabatan Filter
      if (filterJabatanKategori !== 'ALL') {
        const jab = (m.jabatan || '').toLowerCase();
        if (filterJabatanKategori === 'KSB') {
          const isKsb = jab.includes('ketua') || jab.includes('sekretaris') || jab.includes('bendahara');
          if (!isKsb) return false;
        } else if (filterJabatanKategori === 'WAKIL') {
          if (!jab.includes('wakil')) return false;
        } else if (filterJabatanKategori === 'DEWAN') {
          if (!jab.includes('pakar') && !jab.includes('pertimbangan')) return false;
        } else if (filterJabatanKategori === 'BIDANG') {
          if (!jab.includes('bidang') && !jab.includes('biro') && !jab.includes('divisi')) return false;
        } else if (filterJabatanKategori === 'ANGGOTA') {
          if (jab !== 'anggota' && !jab.includes('kader')) return false;
        }
      }

      // 6. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (m.namaLengkap && m.namaLengkap.toLowerCase().includes(q)) ||
          (m.nik && m.nik.includes(q)) ||
          (m.nomorEKTA && m.nomorEKTA.toLowerCase().includes(q)) ||
          (m.jabatan && m.jabatan.toLowerCase().includes(q)) ||
          (m.dpc && m.dpc.toLowerCase().includes(q)) ||
          (m.dprt && m.dprt.toLowerCase().includes(q)) ||
          (m.nomorHP && m.nomorHP.includes(q));
        if (!match) return false;
      }

      return true;
    });

    // 7. Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'name_asc') return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
      if (sortBy === 'name_desc') return (b.namaLengkap || '').localeCompare(a.namaLengkap || '');
      if (sortBy === 'dpd_asc') {
        const dpdComp = (a.dpd || '').localeCompare(b.dpd || '');
        if (dpdComp !== 0) return dpdComp;
        return (a.dpc || '').localeCompare(b.dpc || '');
      }
      if (sortBy === 'ekta_asc') return (a.nomorEKTA || '').localeCompare(b.nomorEKTA || '');
      if (sortBy === 'tingkat_desc') {
        const order: Record<string, number> = { DPW: 1, DPD: 2, DPC: 3, DPRt: 4, 'Bukan Pengurus': 5 };
        const rankA = order[a.tingkatKepengurusan || ''] || 99;
        const rankB = order[b.tingkatKepengurusan || ''] || 99;
        return rankA - rankB;
      }
      return 0;
    });

    // 8. Limit count
    if (limitCount !== 'ALL') {
      const lim = parseInt(limitCount, 10);
      if (!isNaN(lim) && lim > 0) {
        list = list.slice(0, lim);
      }
    }

    return list;
  }, [
    liveMembers,
    filterDpd,
    filterDpc,
    filterStatus,
    filterTingkat,
    filterJabatanKategori,
    searchQuery,
    sortBy,
    limitCount,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const getExportFilename = (ext: 'xlsx' | 'csv') => {
    if (reportType === 'STATISTICS') {
      return `LAPORAN_STATISTIK_15_DPD_SULUT.${ext}`;
    }
    const parts = ['DAFTAR_NOMINATIF'];
    if (filterDpd !== 'ALL') parts.push(filterDpd.replace(/\s+/g, '_'));
    if (filterDpc !== 'ALL') parts.push(filterDpc.replace(/\s+/g, '_'));
    if (filterTingkat !== 'ALL') parts.push(filterTingkat);
    if (filterStatus !== 'ALL') parts.push(filterStatus.replace(/\s+/g, '_'));
    return `${parts.join('_').toUpperCase()}.${ext}`;
  };

  const handleExportExcel = () => {
    if (reportType === 'STATISTICS') {
      exportDpdStatisticsToExcel(dpdStats, getExportFilename('xlsx'));
    } else {
      exportMembersToExcel(nominativeMembers, getExportFilename('xlsx'));
    }
  };

  const handleExportCsv = () => {
    if (reportType === 'STATISTICS') {
      exportDpdStatisticsToCsv(dpdStats, getExportFilename('csv'));
    } else {
      exportMembersToCsv(nominativeMembers, getExportFilename('csv'));
    }
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden print:static print:overflow-visible print:bg-white print:p-0 print:w-full print:h-auto">
      {/* Backdrop */}
      <div
        className="no-print fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container (Responsive width) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6 lg:pl-10 print:static print:pl-0 print:w-full print:h-auto print:block">
        <div className="w-screen max-w-full sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:h-auto print:static">
          
          {/* =========================================================================
             Top Controls Bar (Fully Responsive Toolbar - Hidden during print)
             ========================================================================= */}
          <div className="no-print bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 sticky top-0 z-20 shrink-0 space-y-3">
            {/* Row 1: Title, Live Database Status & Close Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      Laporan Eksekutif Keanggotaan untuk Atasan
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-mono shrink-0">
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>{liveMembers.length.toLocaleString('id-ID')} Kader Riil</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Data Terhubung: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{dbStatusText}</strong> &bull; 15 DPD &amp; Nominatif
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={refreshFromDatabase}
                  disabled={isRefreshing}
                  className="btn-white hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-300 hover:border-blue-400 cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Tarik data riil terbaru langsung dari database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Database'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="btn-white p-1.5 rounded-lg cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  title="Tutup Laporan"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Row 2: Mode Switcher & Quick Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
              {/* Report Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs overflow-x-auto">
                <button
                  onClick={() => setReportType('STATISTICS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                    reportType === 'STATISTICS'
                      ? 'btn-white shadow-xs text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ringkasan Statistik 15 DPD</span>
                </button>
                <button
                  onClick={() => setReportType('NOMINATIVE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                    reportType === 'NOMINATIVE'
                      ? 'btn-white shadow-xs text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 text-blue-500" />
                  <span>Daftar Nominatif Nama</span>
                  {reportType === 'NOMINATIVE' && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono">
                      {nominativeMembers.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons: CSV, Excel, Cetak/PDF */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                <button
                  onClick={handleExportCsv}
                  className="btn-white flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                  title="Unduh Format CSV Baku"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="btn-white flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer text-emerald-700 dark:text-emerald-400 hover:border-emerald-400"
                  title="Unduh Format Microsoft Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0"
                  title="Cetak langsung atau simpan dokumen PDF A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            {/* Row 3: Granular Filter Toolbar khusus Mode Nominatif */}
            {reportType === 'NOMINATIVE' && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Filter &amp; Parameter Laporan Nominatif:</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ({nominativeMembers.length} Kader Terpilih)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        title="Kembalikan semua filter ke awal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filter</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilterPanelMobile(!showFilterPanelMobile)}
                      className="sm:hidden text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showFilterPanelMobile ? 'Ringkas' : 'Buka Filter'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterPanelMobile ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Filter Fields Grid (Responsive) */}
                {showFilterPanelMobile && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 animate-in fade-in">
                    {/* 1. Filter DPD */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Wilayah DPD:
                      </label>
                      <select
                        value={filterDpd}
                        onChange={(e) => handleDpdChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua 15 DPD</option>
                        {SULUT_REGIONS.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Filter DPC (Kecamatan) */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Kecamatan (DPC):
                      </label>
                      <select
                        value={filterDpc}
                        onChange={(e) => setFilterDpc(e.target.value)}
                        disabled={availableDpcs.length === 0}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer disabled:opacity-50"
                      >
                        <option value="ALL">Semua Kecamatan</option>
                        {availableDpcs.map((dpcName) => (
                          <option key={dpcName} value={dpcName}>
                            Kec. {dpcName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Filter Tingkat Kepengurusan */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Tingkat Organisasi:
                      </label>
                      <select
                        value={filterTingkat}
                        onChange={(e) => setFilterTingkat(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua Tingkatan</option>
                        <option value="DPW">DPW (Provinsi)</option>
                        <option value="DPD">DPD (Kab/Kota)</option>
                        <option value="DPC">DPC (Kecamatan)</option>
                        <option value="DPRt">DPRt (Desa/Ranting)</option>
                        <option value="BUKAN_PENGURUS">Kader / Sayap</option>
                      </select>
                    </div>

                    {/* 4. Filter Kategori Posisi / Jabatan */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Posisi / Jabatan:
                      </label>
                      <select
                        value={filterJabatanKategori}
                        onChange={(e) => setFilterJabatanKategori(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua Jabatan</option>
                        <option value="KSB">Pimpinan Inti (KSB)</option>
                        <option value="WAKIL">Wakil Ketua / Sekretaris / Bendahara</option>
                        <option value="BIDANG">Bidang / Divisi / Biro</option>
                        <option value="DEWAN">Dewan Pertimbangan / Pakar</option>
                        <option value="ANGGOTA">Anggota / Kader Biasa</option>
                      </select>
                    </div>

                    {/* 5. Filter Status Keanggotaan */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Status Kader:
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="Aktif">Hanya Aktif</option>
                        <option value="ALL">Semua Status</option>
                        <option value="Non-Aktif (Meninggal)">Meninggal (Wafat)</option>
                        <option value="Non-Aktif (Pindah Partai/Mundur)">Pindah Partai / Mundur</option>
                        <option value="Non-Aktif (Pindah Domisili)">Pindah Domisili</option>
                      </select>
                    </div>

                    {/* 6. Urutkan (Sort By) */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Urutan Data:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="name_asc">Nama (A &rarr; Z)</option>
                        <option value="name_desc">Nama (Z &rarr; A)</option>
                        <option value="dpd_asc">Wilayah (DPD &amp; DPC)</option>
                        <option value="ekta_asc">Nomor e-KTA</option>
                        <option value="tingkat_desc">Tingkat Organisasi</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Sub-row: Search Bar & Row Limiter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIK, nomor e-KTA, jabatan, atau kecamatan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Batas Cetak:
                    </label>
                    <select
                      value={limitCount}
                      onChange={(e) => setLimitCount(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1 text-xs font-mono font-medium cursor-pointer"
                      title="Batasi jumlah baris yang tampil di layar atau dicetak"
                    >
                      <option value="ALL">Semua Baris</option>
                      <option value="50">50 Baris</option>
                      <option value="100">100 Baris</option>
                      <option value="250">250 Baris</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
             Printable Official Document Body (Responsive Preview + Print Clean)
             ========================================================================= */}
          <div className="p-3 sm:p-6 lg:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible flex-1">
            
            {/* Official Letterhead (Kop Surat Resmi DPW Partai NasDem Sulut) */}
            <div className="border-b-2 border-blue-900 pb-3 mb-1 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 print:flex-row print:justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                <img
                  src={nasdemLogo}
                  alt="Logo Resmi Partai NasDem"
                  className="max-h-16 sm:max-h-20 max-w-full object-contain drop-shadow-sm"
                />
              </div>

              <div className="text-center flex-1 px-1 sm:px-3">
                <h1 className="text-base sm:text-xl font-black tracking-tight uppercase text-blue-950 font-serif">
                  DEWAN PIMPINAN WILAYAH (DPW) PARTAI NASDEM
                </h1>
                <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-amber-600">
                  PROVINSI SULAWESI UTARA
                </h2>
                <h3 className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-slate-800">
                  BADAN PEMENANGAN PEMILU (BAPPILU) &amp; ORGANISASI KEANGGOTAAN KADERISASI (OKK)
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">
                  Sekretariat: Jl. Lengkong Wuaya, Paal Dua / Jl. 17 Agustus, Manado, Sulawesi Utara &bull; Telp/WA: (0431) 845201
                </p>
                <p className="text-[9px] text-slate-500 italic">
                  Gerakan Perubahan &bull; Restorasi Indonesia &bull; Shadow Database Keanggotaan Mandiri Daerah
                </p>
              </div>

              <div className="w-20 sm:w-24 shrink-0 flex flex-row sm:flex-col items-center justify-center text-center gap-1">
                <img
                  src={anniversaryLogo}
                  alt="HUT NasDem"
                  className="h-10 sm:h-14 object-contain drop-shadow-sm"
                />
                <span className="text-[8px] sm:text-[8.5px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  DOK. RESMI 071
                </span>
              </div>
            </div>

            {/* Decorative Tri-color Divider Bar */}
            <div className="h-1 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900 mb-4 sm:mb-5 rounded-full" />

            {/* Document Title & Filter Scope Box */}
            <div className="text-center mb-4 sm:mb-5">
              <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight underline">
                {reportType === 'STATISTICS'
                  ? 'LAPORAN RINGKASAN STATISTIK KEANGGOTAAN PER DPD KABUPATEN / KOTA'
                  : 'LAPORAN REKAPITULASI NOMINATIF ANGGOTA AKTIF DAERAH (e-KTA)'}
              </h3>
              
              {/* Context Summary for Atasan */}
              <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono">
                <span>
                  Wilayah:{' '}
                  <strong className="text-slate-950 font-bold">
                    {filterDpd === 'ALL' ? '15 DPD Kabupaten / Kota Sulut' : filterDpd}
                    {filterDpc !== 'ALL' ? ` (Kec. ${filterDpc})` : ''}
                  </strong>
                </span>
                <span>&bull;</span>
                {reportType === 'NOMINATIVE' && (
                  <>
                    <span>
                      Tingkat:{' '}
                      <strong className="text-slate-950 font-bold">
                        {filterTingkat === 'ALL' ? 'Semua Tingkatan' : filterTingkat}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Status:{' '}
                      <strong className="text-emerald-700 font-bold">
                        {filterStatus}
                      </strong>
                    </span>
                    <span>&bull;</span>
                  </>
                )}
                <span>
                  Tanggal Cetak:{' '}
                  <strong className="text-slate-950 font-bold">{currentDateFormatted}</strong>
                </span>
              </div>
            </div>

            {/* Executive KPI Summary Boxes */}
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 border border-slate-300 rounded-lg bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center text-xs divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="pt-2 md:pt-0">
                <span className="text-slate-500 text-[10px] sm:text-[11px] block uppercase font-semibold">
                  {reportType === 'NOMINATIVE' ? 'Kader Lolos Filter' : 'Total Kader Aktif Riil'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono" data-tabular="true">
                  {reportType === 'NOMINATIVE'
                    ? nominativeMembers.length.toLocaleString('id-ID')
                    : grandTotal.aktifAll.toLocaleString('id-ID')}
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 block">
                  {reportType === 'NOMINATIVE' ? 'Siap Dicetak / Diekspor' : 'Kekuatan Teritorial Terverifikasi'}
                </span>
              </div>

              <div className="pt-2 md:pt-0">
                <span className="text-slate-500 text-[10px] sm:text-[11px] block uppercase font-semibold">
                  Total Anggota Terdaftar
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-900 font-mono" data-tabular="true">
                  {grandTotal.totalAll.toLocaleString('id-ID')}
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 block">Database e-KTA Mandiri Sulut</span>
              </div>

              <div className="pt-2 md:pt-0">
                <span className="text-slate-500 text-[10px] sm:text-[11px] block uppercase font-semibold">
                  Persentase Kesiapan
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono" data-tabular="true">
                  {grandTotal.avgPersen}%
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 block">Rata-rata 15 DPD Daerah</span>
              </div>

              <div className="pt-2 md:pt-0">
                <span className="text-slate-500 text-[10px] sm:text-[11px] block uppercase font-semibold">
                  Kader Non-Aktif (Soft-Del)
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-700 font-mono" data-tabular="true">
                  {grandTotal.nonAktifAll.toLocaleString('id-ID')}
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 block">Meninggal, Pindah, Mundur</span>
              </div>
            </div>

            {/* Mobile swipe hint */}
            <div className="sm:hidden no-print text-[10px] text-slate-400 text-center mb-2 font-mono">
              &harr; Geser tabel ke samping untuk melihat seluruh data
            </div>

            {/* =====================================================================
               MODE 1: DPD STATISTICS TABLE (Wrapped in responsive container)
               ===================================================================== */}
            {reportType === 'STATISTICS' ? (
              <div className="mb-6">
                <div className="overflow-x-auto print:overflow-visible -mx-1 sm:mx-0 border border-slate-300 rounded-lg shadow-2xs">
                  <table className="w-full min-w-[780px] print:min-w-0 text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                        <th className="p-2 border-r border-slate-300 text-center w-8" rowSpan={2}>No</th>
                        <th className="p-2 border-r border-slate-300" rowSpan={2}>DPD Kabupaten / Kota</th>
                        <th className="p-2 border-r border-slate-300 text-center" rowSpan={2}>Zona Wilayah</th>
                        <th className="p-2 border-r border-slate-300 text-center" rowSpan={2}>Jml DPC</th>
                        <th className="p-2 border-r border-slate-300 text-right" rowSpan={2}>Total Anggota</th>
                        <th className="p-2 border-r border-slate-300 text-right bg-emerald-100 text-emerald-950" rowSpan={2}>
                          Aktif Riil
                        </th>
                        <th className="p-2 border-r border-slate-300 text-right" rowSpan={2}>% Kesiapan</th>
                        <th className="p-2 border-r border-slate-300 text-center" colSpan={3}>
                          Rincian Non-Aktif (Dieliminasi)
                        </th>
                        <th className="p-2 text-center" rowSpan={2}>Kesiapan</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] border-b border-slate-300 font-mono">
                        <th className="p-1 border-r border-slate-300 text-center">Wafat</th>
                        <th className="p-1 border-r border-slate-300 text-center">Pindah Partai</th>
                        <th className="p-1 border-r border-slate-300 text-center">Domisili</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {dpdStats.map((row, idx) => (
                        <tr key={row.dpd} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                            {row.no}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                            {row.dpd}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-600 text-[11px]">
                            {row.zona === 'Daratan Minahasa'
                              ? 'Minahasa'
                              : row.zona === 'BMR'
                              ? 'BMR'
                              : 'Kepulauan'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                            {row.dpcCount}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                            {row.total}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50 text-[11px]">
                            {row.aktif}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                            {row.persentaseAktif}%
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500 text-[11px]">
                            {row.meninggal}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500 text-[11px]">
                            {row.pindahPartai}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500 text-[11px]">
                            {row.pindahDomisili}
                          </td>
                          <td className="p-2 text-center text-[10px]">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                                row.persentaseAktif >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.persentaseAktif >= 65
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {row.statusKesiapan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Total Summary Footer Row */}
                    <tfoot>
                      <tr className="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-400 font-mono text-[11px]">
                        <td className="p-2 text-center" colSpan={3}>
                          TOTAL SULAWESI UTARA (15 DPD)
                        </td>
                        <td className="p-2 text-center border-l border-slate-300">{grandTotal.dpcAll}</td>
                        <td className="p-2 text-right border-l border-slate-300">{grandTotal.totalAll}</td>
                        <td className="p-2 text-right border-l border-slate-300 bg-emerald-200 text-emerald-950 font-black">
                          {grandTotal.aktifAll}
                        </td>
                        <td className="p-2 text-right border-l border-slate-300">{grandTotal.avgPersen}%</td>
                        <td className="p-2 text-center border-l border-slate-300 text-slate-700">{grandTotal.meninggalAll}</td>
                        <td className="p-2 text-center border-l border-slate-300 text-slate-700">{grandTotal.pindahPartaiAll}</td>
                        <td className="p-2 text-center border-l border-slate-300 text-slate-700">{grandTotal.pindahDomisiliAll}</td>
                        <td className="p-2 text-center border-l border-slate-300 font-sans text-emerald-800">
                          SOLID &amp; AKTIF
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Status Note & Policy Context for Atasan */}
                <div className="mt-4 p-3 border border-slate-200 rounded-lg bg-slate-50 text-[11px] text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Catatan Strategis OKK untuk Pimpinan / Atasan:</p>
                  <p className="leading-relaxed">
                    1. Angka pada kolom <strong>"Aktif Riil"</strong> merupakan kader yang telah lolos verifikasi faktual lapangan di tingkat DPC dan DPRt.
                  </p>
                  <p className="leading-relaxed">
                    2. Sebanyak <strong>{grandTotal.nonAktifAll} kader</strong> telah dieliminasi dari kalkulasi aktif karena tercatat wafat ({grandTotal.meninggalAll}), pindah partai/mengundurkan diri ({grandTotal.pindahPartaiAll}), atau pindah domisili ({grandTotal.pindahDomisiliAll}) melalui mekanisme soft-delete mandiri daerah, sehingga data akurat dan tidak menggelembungkan kalkulasi pemenangan.
                  </p>
                </div>
              </div>
            ) : (
              /* =====================================================================
                 MODE 2: NOMINATIVE MEMBER TABLE (Wrapped in responsive container)
                 ===================================================================== */
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Daftar Nominatif:{' '}
                    <span className="text-blue-900 font-black">
                      {filterDpd === 'ALL' ? 'Semua Wilayah' : filterDpd}
                      {filterDpc !== 'ALL' ? ` &bull; Kec. ${filterDpc}` : ''}
                    </span>{' '}
                    ({nominativeMembers.length} Kader Terverifikasi)
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                    <span>Tingkat: <strong className="text-slate-900">{filterTingkat}</strong></span>
                    <span>&bull;</span>
                    <span>Status: <strong className="text-emerald-700">{filterStatus}</strong></span>
                  </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible -mx-1 sm:mx-0 border border-slate-300 rounded-lg shadow-2xs">
                  <table className="w-full min-w-[780px] print:min-w-0 text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-bold text-[11px] border-b border-slate-300">
                        <th className="border-r border-slate-300 p-2 text-center w-8">No</th>
                        <th className="border-r border-slate-300 p-2 min-w-[200px]">Nama Lengkap &amp; NIK</th>
                        <th className="border-r border-slate-300 p-2 min-w-[130px]">Nomor e-KTA Pusat</th>
                        <th className="border-r border-slate-300 p-2 min-w-[130px]">DPD Kab/Kota</th>
                        <th className="border-r border-slate-300 p-2 min-w-[130px]">DPC / Desa (DPRt)</th>
                        <th className="border-r border-slate-300 p-2 min-w-[140px]">Jabatan &amp; Tingkat</th>
                        <th className="border-r border-slate-300 p-2 text-center min-w-[100px]">No. HP</th>
                        <th className="p-2 text-center min-w-[80px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {nominativeMembers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                            Tidak ada kader yang sesuai dengan kriteria filter yang Anda tentukan.
                            <br />
                            <button
                              onClick={handleResetFilters}
                              className="mt-2 text-blue-600 hover:underline font-semibold"
                            >
                              Reset Filter Pencarian
                            </button>
                          </td>
                        </tr>
                      ) : (
                        nominativeMembers.map((m, idx) => (
                          <tr key={m.nik + (m.id || idx)} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="border-r border-slate-300 p-1.5 text-center font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="border-r border-slate-300 p-1.5">
                              <div className="font-bold text-slate-900 leading-tight">{m.namaLengkap}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">NIK: {m.nik}</div>
                            </td>
                            <td className="border-r border-slate-300 p-1.5 font-mono text-slate-800 font-semibold text-[11px]">
                              {m.nomorEKTA || '-'}
                            </td>
                            <td className="border-r border-slate-300 p-1.5 text-slate-800 font-medium">
                              {m.dpd}
                            </td>
                            <td className="border-r border-slate-300 p-1.5 text-slate-700">
                              <div className="font-medium text-slate-800">Kec. {m.dpc || '-'}</div>
                              {m.dprt && m.dprt !== '-' && (
                                <div className="text-[10px] text-slate-500 font-mono">Desa: {m.dprt}</div>
                              )}
                            </td>
                            <td className="border-r border-slate-300 p-1.5 text-slate-800">
                              <div className="font-semibold text-slate-900">{m.jabatan || 'Anggota'}</div>
                              {m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus' && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  {m.tingkatKepengurusan}
                                </span>
                              )}
                            </td>
                            <td className="border-r border-slate-300 p-1.5 text-center font-mono text-slate-700 text-[11px]">
                              {m.nomorHP || '-'}
                            </td>
                            <td className="p-1.5 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  m.status === 'Aktif'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {m.status === 'Aktif' ? 'Aktif' : 'Non-Aktif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Counter Footer */}
                <div className="mt-2 text-right text-[11px] text-slate-500 font-mono">
                  Menampilkan {nominativeMembers.length} kader nominatif terpilih
                </div>
              </div>
            )}

            {/* Official Signatures Block (Responsive on screen + fixed on print) */}
            <div className="print-break-inside-avoid mt-8 pt-4 border-t-2 border-slate-300">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start text-xs text-slate-800 gap-6 sm:gap-4 print:flex-row print:justify-between">
                <div className="text-center sm:text-left w-full sm:w-64 space-y-12 sm:space-y-16">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">SEKRETARIS DPW PARTAI NASDEM SULUT</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-sm text-slate-950">---</p>
                    <p className="text-[11px] text-slate-600 font-mono">---</p>
                  </div>
                </div>

                <div className="text-center sm:text-right w-full sm:w-64 space-y-12 sm:space-y-16">
                  <div>
                    <p>Manado, {currentDateFormatted}</p>
                    <p className="font-bold">KETUA DPW PARTAI NASDEM SULUT</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-sm text-slate-950">---</p>
                    <p className="text-[11px] text-slate-600 font-mono">---</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReportPrintModal;
