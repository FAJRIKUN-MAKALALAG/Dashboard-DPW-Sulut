import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Member, MemberStatus } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch } from '../utils/structureReadinessUtils';
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
  const [filterDpd, setFilterDpd] = useState<string>(initialDpd);
  const [filterStatus, setFilterStatus] = useState<string>('Aktif');

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

  // Filter for nominative member list with robust isDpdMatch
  const nominativeMembers = useMemo(() => {
    return liveMembers.filter((m) => {
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
      return true;
    });
  }, [liveMembers, filterDpd, filterStatus]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (reportType === 'STATISTICS') {
      exportDpdStatisticsToExcel(dpdStats, 'LAPORAN_STATISTIK_15_DPD_SULUT.xlsx');
    } else {
      exportMembersToExcel(
        nominativeMembers,
        `DAFTAR_ANGGOTA_${filterDpd.toUpperCase().replace(/\s+/g, '_')}.xlsx`
      );
    }
  };

  const handleExportCsv = () => {
    if (reportType === 'STATISTICS') {
      exportDpdStatisticsToCsv(dpdStats, 'LAPORAN_STATISTIK_15_DPD_SULUT.csv');
    } else {
      exportMembersToCsv(
        nominativeMembers,
        `DAFTAR_ANGGOTA_${filterDpd.toUpperCase().replace(/\s+/g, '_')}.csv`
      );
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

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 print:static print:pl-0 print:w-full print:h-auto print:block">
        <div className="w-screen max-w-4xl sm:max-w-5xl lg:max-w-6xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:h-auto print:static">
          {/* Controls Bar (Hidden during print) */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 gap-3 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Printer className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Laporan Eksekutif Keanggotaan untuk Atasan</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-mono">
                    <Database className="w-3 h-3 text-emerald-600" />
                    <span>{liveMembers.length.toLocaleString('id-ID')} Kader Riil</span>
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data Terhubung Database: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{dbStatusText}</strong> · Ringkasan 15 DPD & Nominatif
                </p>
              </div>
            </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Live Database Button */}
            <button
              onClick={refreshFromDatabase}
              disabled={isRefreshing}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              title="Tarik & sinkronkan data keanggotaan riil terbaru langsung dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Database'}</span>
            </button>

            {/* Report Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setReportType('STATISTICS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  reportType === 'STATISTICS'
                    ? 'btn-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Ringkasan Statistik 15 DPD</span>
              </button>
              <button
                onClick={() => setReportType('NOMINATIVE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  reportType === 'NOMINATIVE'
                    ? 'btn-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 text-blue-500" />
                <span>Daftar Nominatif Nama</span>
              </button>
            </div>

            {/* Sub Filters for Nominative mode */}
            {reportType === 'NOMINATIVE' && (
              <>
                <select
                  value={filterDpd}
                  onChange={(e) => setFilterDpd(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua 15 DPD</option>
                  {SULUT_REGIONS.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Aktif">Hanya Aktif</option>
                  <option value="ALL">Semua Status</option>
                </select>
              </>
            )}

            {/* Export & Print Triggers */}
            <button
              onClick={handleExportCsv}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              title="Unduh Format CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              title="Unduh Format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-white flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
              title="Cetak langsung atau simpan sebagai dokumen PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="btn-white p-1.5 rounded-lg cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible">
          {/* Official Letterhead (Kop Surat Resmi DPW Partai NasDem Sulut) */}
          <div className="border-b-2 border-blue-900 pb-3 mb-1 flex items-center justify-between gap-4">
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              <img
                src={nasdemLogo}
                alt="Logo Resmi Partai NasDem"
                className="max-h-20 max-w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="text-center flex-1 px-3">
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase text-blue-950 font-serif">
                DEWAN PIMPINAN WILAYAH (DPW) PARTAI NASDEM
              </h1>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-amber-600">
                PROVINSI SULAWESI UTARA
              </h2>
              <h3 className="text-[11px] font-bold tracking-wide uppercase text-slate-800">
                BADAN PEMENANGAN PEMILU (BAPPILU) & ORGANISASI KEANGGOTAAN KADERISASI (OKK)
              </h3>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Sekretariat: Jl. Lengkong Wuaya, Paal Dua / Jl. 17 Agustus, Manado, Sulawesi Utara · Telp/WA: (0431) 845201
              </p>
              <p className="text-[9.5px] text-slate-500 italic">
                Gerakan Perubahan · Restorasi Indonesia · Shadow Database Keanggotaan Mandiri Daerah
              </p>
            </div>

            <div className="w-24 shrink-0 flex flex-col items-center justify-center text-center">
              <img
                src={anniversaryLogo}
                alt="HUT NasDem"
                className="h-14 object-contain mb-1 drop-shadow-sm"
              />
              <span className="text-[8.5px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                DOK. RESMI 071
              </span>
            </div>
          </div>

          {/* Decorative Tri-color Divider Bar */}
          <div className="h-1 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900 mb-5 rounded-full" />

          {/* Document Title & Subtitle */}
          <div className="text-center mb-5">
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight underline">
              {reportType === 'STATISTICS'
                ? 'LAPORAN RINGKASAN STATISTIK KEANGGOTAAN PER DPD KABUPATEN / KOTA'
                : 'LAPORAN REKAPITULASI NOMINATIF ANGGOTA AKTIF DAERAH (e-KTA)'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              Cakupan: <strong className="text-slate-900">15 DPD Kabupaten / Kota se-Sulawesi Utara</strong>
              {' '}· Tanggal Cetak: <strong className="text-slate-900">{currentDateFormatted}</strong>
            </p>
          </div>

          {/* Executive KPI Summary Boxes */}
          <div className="mb-6 p-4 border border-slate-300 rounded-lg bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="pt-2 md:pt-0">
              <span className="text-slate-500 text-[11px] block uppercase font-semibold">Total Kader Aktif Riil</span>
              <span className="text-2xl font-black text-emerald-700 font-mono" data-tabular="true">
                {grandTotal.aktifAll.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-500 block">Kekuatan Teritorial Terverifikasi</span>
            </div>

            <div className="pt-2 md:pt-0">
              <span className="text-slate-500 text-[11px] block uppercase font-semibold">Tingkat Keaktifan Riil</span>
              <span className="text-2xl font-black text-slate-900 font-mono" data-tabular="true">
                {grandTotal.avgPersen}%
              </span>
              <span className="text-[10px] text-slate-500 block">Rasio Validitas Sulut</span>
            </div>

            <div className="pt-2 md:pt-0">
              <span className="text-slate-500 text-[11px] block uppercase font-semibold">Non-Aktif (Tereliminasi)</span>
              <span className="text-2xl font-black text-rose-700 font-mono" data-tabular="true">
                {grandTotal.nonAktifAll}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {grandTotal.meninggalAll} Wafat · {grandTotal.pindahPartaiAll} Pindah Partai · {grandTotal.pindahDomisiliAll} Domisili
              </span>
            </div>

            <div className="pt-2 md:pt-0">
              <span className="text-slate-500 text-[11px] block uppercase font-semibold">Total Terdaftar di DB</span>
              <span className="text-2xl font-black text-slate-900 font-mono" data-tabular="true">
                {grandTotal.totalAll.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-500 block">15 DPD · {grandTotal.dpcAll} DPC</span>
            </div>
          </div>

          {/* TABLE SECTION */}
          {reportType === 'STATISTICS' ? (
            /* MODE 1: STATISTICAL SUMMARY PER DPD */
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tabel 1. Rekapitulasi Statistik Keanggotaan 15 DPD Kabupaten/Kota
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Satuan: Jiwa / Anggota Terverifikasi
                </span>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-bold text-[11px] border-b border-slate-400">
                      <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                      <th className="p-2 border-r border-slate-300">DPD Kabupaten / Kota</th>
                      <th className="p-2 border-r border-slate-300 text-center">Zona</th>
                      <th className="p-2 border-r border-slate-300 text-center">DPC</th>
                      <th className="p-2 border-r border-slate-300 text-right">Total Terdata</th>
                      <th className="p-2 border-r border-slate-300 text-right bg-emerald-100/60 font-black text-emerald-900">
                        Aktif Riil
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">Keaktifan (%)</th>
                      <th className="p-2 border-r border-slate-300 text-center bg-rose-50 text-[10px]" colSpan={3}>
                        Rincian Non-Aktif (Wafat / Pindah / Domisili)
                      </th>
                      <th className="p-2 text-center">Status Teritorial</th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] border-b border-slate-300 font-mono">
                      <th className="p-1 border-r border-slate-300 text-center" colSpan={7}></th>
                      <th className="p-1 border-r border-slate-300 text-center">Wafat</th>
                      <th className="p-1 border-r border-slate-300 text-center">Pindah Partai</th>
                      <th className="p-1 border-r border-slate-300 text-center">Domisili</th>
                      <th className="p-1 text-center"></th>
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
                        SOLID & AKTIF
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
                  2. Sebanyak <strong>{grandTotal.nonAktifAll} kader</strong> telah dieliminasi dari kalkulasi aktif karena tercatat wafat ({grandTotal.meninggalAll}), pindah partai/mengundurkan diri ({grandTotal.pindahPartaiAll}), atau pindah domisili ({grandTotal.pindahDomisiliAll}) melalui mekanisme soft-delete mandiri daerah, sehingga tidak menggelembungkan data elektoral.
                </p>
              </div>
            </div>
          ) : (
            /* MODE 2: NOMINATIVE MEMBER TABLE */
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Daftar Nominatif Anggota: {filterDpd === 'ALL' ? 'Semua Wilayah' : filterDpd} ({nominativeMembers.length} Kader)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Status: {filterStatus}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold text-[11px]">
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">Nama Lengkap & NIK</th>
                    <th className="border border-slate-300 p-2">Nomor e-KTA Pusat</th>
                    <th className="border border-slate-300 p-2">DPD Kab/Kota</th>
                    <th className="border border-slate-300 p-2">DPC Kecamatan</th>
                    <th className="border border-slate-300 p-2">Jabatan Partai</th>
                    <th className="border border-slate-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {nominativeMembers.map((m, idx) => (
                    <tr key={m.nik} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="border border-slate-300 p-1.5 text-center font-mono text-[11px]">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-semibold text-slate-900">{m.namaLengkap}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIK: {m.nik}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono text-slate-800 font-semibold text-[11px]">
                        {m.nomorEKTA}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-slate-800">{m.dpd}</td>
                      <td className="border border-slate-300 p-1.5 text-slate-700">{m.dpc}</td>
                      <td className="border border-slate-300 p-1.5 text-slate-800">{m.jabatan}</td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Block */}
          <div className="print-break-inside-avoid mt-8 pt-4 border-t-2 border-slate-300">
            <div className="flex justify-between items-start text-xs text-slate-800">
              <div className="text-left w-64 space-y-16">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">SEKRETARIS DPW PARTAI NASDEM SULUT</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm text-slate-950">---</p>
                  <p className="text-[11px] text-slate-600 font-mono">---</p>
                </div>
              </div>

            

              <div className="text-right w-64 space-y-16">
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
