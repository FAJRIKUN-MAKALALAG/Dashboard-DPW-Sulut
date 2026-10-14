import React from 'react';
import { UserSession } from '../../types';
import { GrowthAnalytics, GrowthPeriod, formatDisplayDate } from '../../utils/growthUtils';
import { GrowthInteractiveChart } from '../GrowthInteractiveChart';
import {
  Award,
  Calendar,
  Sparkles,
  Table,
  Maximize2,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

interface RecruitmentAnalyticsSectionProps {
  growthAnalytics: GrowthAnalytics;
  growthPeriod: GrowthPeriod;
  setGrowthPeriod: (period: GrowthPeriod) => void;
  pinnedDate?: string;
  setPinnedDate: (date?: string) => void;
  filterRecruiter?: string;
  setFilterRecruiter: (recruiter?: string) => void;
  growthViewTab: 'territory' | 'recruiters';
  setGrowthViewTab: (tab: 'territory' | 'recruiters') => void;
  expandedDpds: Record<string, boolean>;
  toggleDpdAccordion: (dpdName: string) => void;
  expandedDpcs: Record<string, boolean>;
  toggleDpcAccordion: (dpcKey: string) => void;
  openDrilldownModalWithFocus: (
    dpd?: string,
    dpc?: string,
    dprt?: string,
    recruiter?: string
  ) => void;
  handleLoadTestScenario?: () => void;
  session?: UserSession;
  selectedDpdFilter?: string;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string) => void;
  hasAddMembers?: boolean;
}

export const RecruitmentAnalyticsSection: React.FC<RecruitmentAnalyticsSectionProps> = ({
  growthAnalytics,
  growthPeriod,
  setGrowthPeriod,
  pinnedDate,
  setPinnedDate,
  filterRecruiter,
  setFilterRecruiter,
  growthViewTab,
  setGrowthViewTab,
  expandedDpds,
  toggleDpdAccordion,
  expandedDpcs,
  toggleDpcAccordion,
  openDrilldownModalWithFocus,
  handleLoadTestScenario,
  session,
  selectedDpdFilter,
  onOpenTerritorialMatrix,
  hasAddMembers,
}) => {
  const isSuperAdmin = !session || session.role === 'SUPER_ADMIN';

  return (
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
            Setiap anggota baru wajib terhubung dengan{' '}
            <strong className="text-amber-700 dark:text-amber-400 font-semibold">
              Kader Perekrut
            </strong>{' '}
            yang membawanya. Sistem secara otomatis menaruh domisili anggota baru ke DPRt
            (Kelurahan/Desa) berdasarkan alamat KTP, sehingga pimpinan mengetahui kader mana yang
            bergerak dan di daerah mana anggotanya bertambah.
          </p>
        </div>

        {/* Action & Period Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Period Selector Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '7 Hari' },
                { id: '30days', label: '30 Hari' },
                { id: 'all', label: 'Semua' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setGrowthPeriod(tab.id);
                  setPinnedDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  growthPeriod === tab.id && !pinnedDate
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Scenario Injector - Khusus Super Admin DPW */}
          {isSuperAdmin && hasAddMembers && handleLoadTestScenario && (
            <button
              onClick={handleLoadTestScenario}
              className="btn-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer shadow-2xs"
              title="Muat data contoh: +100 Minahasa Selatan & +50 Manado yang direkrut kader"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulasi Rekrutmen (+100 Minsel, +50 Manado)</span>
            </button>
          )}

          {/* Matriks Struktur & Tabel Template Button */}
          {onOpenTerritorialMatrix && (
            <button
              onClick={() =>
                onOpenTerritorialMatrix(
                  selectedDpdFilter !== 'ALL' ? selectedDpdFilter : 'Kabupaten Minahasa Selatan'
                )
              }
              className="btn-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shadow-2xs"
              title="Buka Matriks Struktur Organisasi & Input Template Berurut"
            >
              <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Matriks Struktur & Template</span>
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
              openDrilldownModalWithFocus(
                undefined,
                undefined,
                undefined,
                growthAnalytics.topRecruiter.nama
              );
            }
          }}
          className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-amber-700 dark:text-amber-400">Top Kader Perekrut</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
            title={growthAnalytics.topRecruiter?.nama || 'Belum ada data'}
          >
            {growthAnalytics.topRecruiter ? growthAnalytics.topRecruiter.nama.split(',')[0] : '-'}
          </div>
          <p className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {growthAnalytics.topRecruiter
              ? `+${growthAnalytics.topRecruiter.count} Anggota Baru`
              : '0 Anggota'}
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
              {pinnedDate && (
                <span>
                  Tanggal <strong>{formatDisplayDate(pinnedDate)}</strong>
                </span>
              )}
              {pinnedDate && filterRecruiter && <span> · </span>}
              {filterRecruiter && (
                <span>
                  Direkrut oleh: <strong>{filterRecruiter}</strong>
                </span>
              )}{' '}
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

      {/* Ultra-Interactive Cadre Growth Chart */}
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
                Klik tombol <strong className="text-blue-600 dark:text-blue-400">Rincian DPC</strong>{' '}
                untuk membuka sebaran kecamatan, dan{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">Rincian DPRt</strong> untuk
                melihat desa basis beserta kader perekrutnya.
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
              {isSuperAdmin && hasAddMembers && handleLoadTestScenario && (
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
                            {dpdNode.percentage}% dari total rekrutan · Tersebar di{' '}
                            {dpdNode.dpcs.length} DPC Kecamatan
                          </p>
                          {/* Cadres who recruited here */}
                          <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                              Direkrut oleh:
                            </span>
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
                          <span>
                            {isDpdExpanded ? 'Tutup Rincian' : `Buka ${dpdNode.dpcs.length} DPC`}
                          </span>
                          {isDpdExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
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
                                  Kader Pengusung:{' '}
                                  {dpcNode.recruiters.map((r) => r.nama.split(',')[0]).join(', ')}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <span>{dpcNode.dprts.length} Desa/Kelurahan (DPRt)</span>
                                  <button
                                    onClick={() => toggleDpcAccordion(dpcKey)}
                                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>{isDpcExpanded ? 'Tutup Desa' : 'Lihat DPRt'}</span>
                                    {isDpcExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>

                                {/* Expanded Level 3: DPRt (Kelurahan/Desa) */}
                                {isDpcExpanded && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                    {dpcNode.dprts.map((dprtNode) => (
                                      <div
                                        key={dprtNode.name}
                                        onClick={() =>
                                          openDrilldownModalWithFocus(
                                            dpdNode.name,
                                            dpcNode.name,
                                            dprtNode.name
                                          )
                                        }
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
                                            Oleh:{' '}
                                            {dprtNode.recruiters
                                              .map((r) => r.nama.split(',')[0])
                                              .join(', ')}
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
                Klik nama kader perekrut untuk membedah seluruh anggota yang dia rekrut beserta
                sebaran desa KTP-nya.
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
                onClick={() =>
                  openDrilldownModalWithFocus(undefined, undefined, undefined, recruiter.nama)
                }
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
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Sebaran Alamat KTP Rekrutan:
                    </span>
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
  );
};
