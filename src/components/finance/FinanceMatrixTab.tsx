import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  Plus,
  Search,
  Wallet,
  Zap,
} from 'lucide-react';
import { FinanceService } from '../../services';
import {
  FinanceLegislator,
  FinanceMatrixCell,
  FinanceMatrixLegislatorRow,
  FinanceMatrixResponse,
  FinanceSummary,
} from '../../types/finance';
import { exportFinanceMatrixExcel } from '../../utils/financeExportUtils';
import { formatMonthLabel, formatRupiah, getCurrentYearMonth } from './financeHelpers';
import { AutodebetQuickStrip } from './matrix/AutodebetQuickStrip';
import { ManualPaymentModal } from './matrix/ManualPaymentModal';
import { MatrixCellModal } from './matrix/MatrixCellModal';
import {
  ReconciliationMemberItem,
  ReconciliationStatusModal,
} from './matrix/ReconciliationStatusModal';
import { MonthDrilldownBar, MonthDrilldownOption } from './shared/MonthDrilldownBar';

type StatusFilterMode = 'ALL' | 'MANUAL' | 'AUTODEBET' | 'DEBT' | 'PAID';

interface FinanceMatrixTabProps {
  summary: FinanceSummary;
  legislators: FinanceLegislator[];
  daerahList: string[];
  selectedMonth: string;
  setSelectedMonth: (ym: string) => void;
  selectedYear: string;
  focusedMonth: string;
  setFocusedMonth: (ym: string) => void;
  refreshKey: number;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

function getMatrixRangeForYear(year: string): { from: string; to: string } {
  const nowYm = getCurrentYearMonth();
  const maxYm = nowYm > '2026-10' ? nowYm : '2026-10';
  if (year === 'ALL') return { from: '2026-01', to: maxYm };
  const start = `${year}-01`;
  const endCandidate = `${year}-12`;
  const to = endCandidate <= maxYm ? endCandidate : start <= maxYm ? maxYm : endCandidate;
  return { from: start, to };
}

function formatCompactBadge(amount: number): string | undefined {
  if (amount <= 0) return undefined;
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}jt`;
  }
  return `${Math.round(amount / 1000)}rb`;
}

export const FinanceMatrixTab: React.FC<FinanceMatrixTabProps> = ({
  summary,
  legislators,
  daerahList,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  focusedMonth,
  setFocusedMonth,
  refreshKey,
  onRefreshAll,
  showToast,
}) => {
  const [kind, setKind] = useState<'DPW' | 'DPP'>('DPW');
  const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'PROVINSI' | 'KAB_KOTA'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterMode>('ALL');
  const [daerahFilter, setDaerahFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matrix, setMatrix] = useState<FinanceMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [reconciliationModal, setReconciliationModal] = useState<{
    open: boolean;
    initialTab: 'ALL' | 'DEBT' | 'PAID';
  }>({ open: false, initialTab: 'DEBT' });
  const [activeCellModal, setActiveCellModal] = useState<{
    legislator: FinanceMatrixLegislatorRow;
    periodMonth: string;
    cell: FinanceMatrixCell | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const { from, to } = getMatrixRangeForYear(selectedYear);
        const res = await FinanceService.getMatrix({
          type: kind,
          from,
          to,
          daerah: daerahFilter,
          tingkat: tingkatFilter,
        });
        if (active) setMatrix(res);
      } catch (err: any) {
        if (active) showToast(`⚠️ ${err?.message || 'Gagal memuat matriks iuran'}`);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [kind, tingkatFilter, selectedYear, daerahFilter, refreshKey]);

  const drilldownMonths: MonthDrilldownOption[] = useMemo(() => {
    if (!matrix) return [];
    return matrix.months.map((m) => {
      const mStat = matrix.monthlyTotals?.[m.ym];
      const paid = mStat?.paid ?? 0;
      return {
        ym: m.ym,
        label: m.label,
        badge: formatCompactBadge(paid),
        hasData: paid > 0,
      };
    });
  }, [matrix]);

  const displayMonths = useMemo(() => {
    if (!matrix) return [];
    if (focusedMonth) {
      const match = matrix.months.find((m) => m.ym === focusedMonth);
      if (match) return [match];
    }
    return matrix.months;
  }, [matrix, focusedMonth]);

  const isSingleMonthFocused = Boolean(
    focusedMonth && matrix?.months.some((m) => m.ym === focusedMonth)
  );
  const queryLower = searchQuery.trim().toLowerCase();

  const { visibleGroups, visibleSummary, monthlyColumnSums } = useMemo(() => {
    if (!matrix) {
      return {
        visibleGroups: [],
        visibleSummary: {
          count: 0,
          totalBilled: 0,
          totalPaid: 0,
          paidManual: 0,
          paidAutodebet: 0,
          totalDebt: 0,
          paidCount: 0,
          debtCount: 0,
        },
        monthlyColumnSums: {} as Record<string, number>,
      };
    }

    const colSums: Record<string, number> = {};
    for (const m of displayMonths) colSums[m.ym] = 0;

    let totalBilled = 0;
    let totalPaid = 0;
    let paidManual = 0;
    let paidAutodebet = 0;
    let totalDebt = 0;
    let paidCount = 0;
    let debtCount = 0;
    let count = 0;

    const groupsOut = matrix.groups
      .map((grp) => {
        const mappedLegs = grp.legislators
          .map((l) => {
            if (!isSingleMonthFocused) {
              return {
                ...l,
                displayBilled: l.totalBilled,
                displayPaid: l.totalPaid,
                displayManual: l.paidManual ?? 0,
                displayAuto: l.paidAutodebet ?? 0,
                displayDebt: l.debt,
                displayDelta: l.balanceDelta,
              };
            }
            const mYm = displayMonths[0].ym;
            const c = l.cells[mYm];
            const b = grp.monthlyTariffs[mYm] ?? 0;
            const p = c?.amount ?? 0;
            const delta = b - p;
            return {
              ...l,
              displayBilled: b,
              displayPaid: p,
              displayManual: c?.method === 'AUTODEBET' ? 0 : p,
              displayAuto: c?.method === 'AUTODEBET' ? p : 0,
              displayDebt: Math.max(0, delta),
              displayDelta: delta,
            };
          })
          .filter((l) => {
            if (
              queryLower &&
              !l.namaLengkap.toLowerCase().includes(queryLower) &&
              !l.daerah.toLowerCase().includes(queryLower)
            ) {
              return false;
            }
            if (statusFilter === 'MANUAL' && l.isAutodebetActive) return false;
            if (statusFilter === 'AUTODEBET' && !l.isAutodebetActive) return false;
            if (statusFilter === 'DEBT' && l.displayDebt <= 0) return false;
            if (statusFilter === 'PAID' && l.displayDebt > 0) return false;
            return true;
          });

        if (mappedLegs.length === 0) return null;

        let grpBilled = 0;
        let grpPaid = 0;
        let grpDebt = 0;
        const grpMonthSums: Record<string, number> = {};
        for (const m of displayMonths) grpMonthSums[m.ym] = 0;

        for (const l of mappedLegs) {
          count += 1;
          grpBilled += l.displayBilled;
          grpPaid += l.displayPaid;
          grpDebt += l.displayDebt;
          totalBilled += l.displayBilled;
          totalPaid += l.displayPaid;
          paidManual += l.displayManual;
          paidAutodebet += l.displayAuto;
          totalDebt += l.displayDebt;
          if (l.displayDebt > 0) debtCount += 1;
          else paidCount += 1;

          for (const m of displayMonths) {
            const amt = l.cells[m.ym]?.amount ?? 0;
            colSums[m.ym] += amt;
            grpMonthSums[m.ym] += amt;
          }
        }

        return {
          ...grp,
          legislators: mappedLegs,
          visibleTotals: { totalBilled: grpBilled, totalPaid: grpPaid, debt: grpDebt },
          visibleMonthSums: grpMonthSums,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    return {
      visibleGroups: groupsOut,
      visibleSummary: {
        count,
        totalBilled,
        totalPaid,
        paidManual,
        paidAutodebet,
        totalDebt,
        paidCount,
        debtCount,
      },
      monthlyColumnSums: colSums,
    };
  }, [matrix, displayMonths, isSingleMonthFocused, queryLower, statusFilter]);

  const reconciliationItems = useMemo<ReconciliationMemberItem[]>(() => {
    const out: ReconciliationMemberItem[] = [];
    for (const grp of visibleGroups) {
      for (const leg of grp.legislators) {
        const unpaidMonths: ReconciliationMemberItem['unpaidMonths'] = [];
        const paidMonths: ReconciliationMemberItem['paidMonths'] = [];
        for (const m of displayMonths) {
          const target = grp.monthlyTariffs[m.ym] ?? 0;
          const c = leg.cells[m.ym];
          const paid = c?.amount ?? 0;
          if (target > 0 && paid < target) {
            unpaidMonths.push({
              ym: m.ym,
              label: m.label,
              target,
              paid,
              shortfall: target - paid,
              isPartial: paid > 0,
            });
          } else if (paid > 0) {
            paidMonths.push({
              ym: m.ym,
              label: m.label,
              paid,
              method: c?.method ?? null,
            });
          }
        }
        out.push({
          legislator: leg,
          displayBilled: leg.displayBilled,
          displayPaid: leg.displayPaid,
          displayManual: leg.displayManual,
          displayAuto: leg.displayAuto,
          displayDebt: leg.displayDebt,
          displayDelta: leg.displayDelta,
          unpaidMonths,
          paidMonths,
        });
      }
    }
    return out;
  }, [visibleGroups, displayMonths]);

  const scopeLabel = isSingleMonthFocused
    ? formatMonthLabel(displayMonths[0].ym)
    : selectedYear === 'ALL'
    ? '2026–Berjalan'
    : `Tahun ${selectedYear}`;

  let rowIndex = 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Strip Cepat Catat & Batalkan Autodebet */}
      <AutodebetQuickStrip
        summary={summary}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
        onRefreshAll={onRefreshAll}
        showToast={showToast}
      />

      {/* Bar Drill-Down Bulan di Dalam Tahun Terpilih (Default: Keseluruhan Tahun) */}
      {matrix && (
        <MonthDrilldownBar
          selectedYear={selectedYear}
          focusedMonth={isSingleMonthFocused ? focusedMonth : ''}
          onSelectMonth={setFocusedMonth}
          months={drilldownMonths}
        />
      )}

      {/* 4 Kartu Rekonsiliasi Catatan Manual vs Sistem */}
      {matrix && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Total Kewajiban {kind} ({scopeLabel})
            </span>
            <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {formatRupiah(visibleSummary.totalBilled)}
            </span>
            <span className="text-[10.5px] text-slate-400">
              {visibleSummary.count} anggota ditampilkan
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Setoran Masuk ({kind})</span>
            </span>
            <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {formatRupiah(visibleSummary.totalPaid)}
            </span>
            <span className="text-[10.5px] font-mono text-emerald-800/80 dark:text-emerald-300/80 block">
              Manual: {formatRupiah(visibleSummary.paidManual)} · AD: {formatRupiah(visibleSummary.paidAutodebet)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setReconciliationModal({ open: true, initialTab: 'DEBT' })}
            className="text-left p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-2xs hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <span>Tunggakan ({scopeLabel})</span>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
                Lihat daftar &rarr;
              </span>
            </span>
            <span className="text-base font-extrabold font-mono text-rose-700 dark:text-rose-300 mt-0.5 block">
              {formatRupiah(visibleSummary.totalDebt)}
            </span>
            <span className="text-[10.5px] text-rose-700/80 dark:text-rose-400/80">
              Selisih tagihan dikurangi setoran tercatat
            </span>
          </button>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setReconciliationModal({ open: true, initialTab: 'ALL' })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setReconciliationModal({ open: true, initialTab: 'ALL' });
              }
            }}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Status Rekonsiliasi Anggota</span>
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                Klik rincian &rarr;
              </span>
            </span>
            <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {visibleSummary.paidCount} Lunas / {visibleSummary.count} Org
            </span>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReconciliationModal({ open: true, initialTab: 'DEBT' });
                }}
                className="px-2 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold cursor-pointer"
              >
                {visibleSummary.debtCount} Menunggak
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReconciliationModal({ open: true, initialTab: 'PAID' });
                }}
                className="px-2 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
              >
                {visibleSummary.paidCount} Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar Bergaya Sheet Excel */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Switch Buku Iuran DPW / DPP */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setKind('DPW')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  kind === 'DPW'
                    ? 'bg-[#1A3282] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Iuran DPW
              </button>
              <button
                type="button"
                onClick={() => setKind('DPP')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  kind === 'DPP'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Kewajiban DPP
              </button>
            </div>

            {/* Switch Sheet Tingkat Persis File Excel */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PROVINSI', label: 'Sheet PROVINSI' },
                { id: 'KAB_KOTA', label: 'Sheet KAB KOTA' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTingkatFilter(t.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    tingkatFilter === t.id
                      ? 'bg-white dark:bg-slate-900 text-[#1A3282] dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter Status / Metode */}
            <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
              {[
                { id: 'ALL', label: 'Semua Anggota' },
                { id: 'MANUAL', label: 'Manual Saja' },
                { id: 'AUTODEBET', label: 'Autodebet Saja' },
                { id: 'DEBT', label: 'Menunggak Saja' },
                { id: 'PAID', label: 'Lunas Saja' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as StatusFilterMode)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === st.id
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Setoran / Rapel</span>
            </button>

            {matrix && (
              <button
                type="button"
                onClick={() => exportFinanceMatrixExcel(matrix)}
                className="btn-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Baris 2: Filter Daerah, Pencarian & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={daerahFilter}
              onChange={(e) => setDaerahFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
            >
              <option value="ALL">Semua Daerah ({daerahList.length})</option>
              {daerahList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama anggota dewan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none w-52"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Tip: Klik nama bulan di atas kolom untuk fokus 1 bulan, atau klik sel untuk catat/batalkan
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Autodebet
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Lunas Manual
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Parsial
            </span>
          </div>
        </div>
      </div>

      {/* Matrix Table Gaya Excel Interaktif */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        {isLoading && !matrix ? (
          <div className="py-14 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Menghitung matriks iuran {kind}...</span>
          </div>
        ) : !matrix ? null : (
          <div className="overflow-x-auto max-h-[64vh] relative">
            {isLoading && (
              <div className="sticky top-0 left-0 right-0 z-40 h-0.5 bg-blue-500 animate-pulse" />
            )}
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-[#1A3282] text-white font-bold">
                <tr>
                  <th className="py-2.5 px-2 text-center sticky left-0 z-30 bg-[#1A3282] w-10 border-r border-white/15">
                    No
                  </th>
                  <th className="py-2.5 px-3 sticky left-10 z-30 bg-[#1A3282] min-w-[210px] border-r border-white/15">
                    Nama Anggota Fraksi
                  </th>
                  {displayMonths.map((m) => (
                    <th
                      key={m.ym}
                      onClick={() => setFocusedMonth(focusedMonth === m.ym ? '' : m.ym)}
                      title={
                        focusedMonth === m.ym
                          ? 'Klik untuk kembali ke keseluruhan tahun'
                          : `Klik untuk fokus cek bulan ${m.label}`
                      }
                      className={`py-2.5 px-2.5 text-center whitespace-nowrap border-r border-white/10 cursor-pointer transition-colors ${
                        focusedMonth === m.ym
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'hover:bg-white/15'
                      }`}
                    >
                      {m.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right whitespace-nowrap border-r border-white/10">
                    Total Tagihan
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap border-r border-white/10">
                    Total Setoran
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    Tunggakan
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleGroups.length === 0 ? (
                  <tr>
                    <td colSpan={displayMonths.length + 5} className="py-10 text-center text-slate-400">
                      Tidak ada anggota yang cocok dengan filter aktif.
                    </td>
                  </tr>
                ) : (
                  visibleGroups.map((grp) => (
                    <React.Fragment key={grp.daerah}>
                      {/* Baris Daerah & Tarif per Bulan */}
                      <tr className="bg-slate-100 dark:bg-slate-800/95 font-bold text-slate-800 dark:text-slate-100 border-y border-slate-200 dark:border-slate-700">
                        <td className="py-2 px-2 text-center sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
                          •
                        </td>
                        <td className="py-2 px-3 sticky left-10 z-10 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                          {grp.daerah} ({grp.legislators.length})
                        </td>
                        {displayMonths.map((m) => (
                          <td
                            key={m.ym}
                            className="py-2 px-2 text-center font-mono text-[10px] text-slate-600 dark:text-slate-300 border-r border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap"
                          >
                            <div>{grp.monthlyTariffs[m.ym] ? formatRupiah(grp.monthlyTariffs[m.ym]) : 'Rp 0'}</div>
                            {grp.visibleMonthSums[m.ym] > 0 && (
                              <div className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                ({formatRupiah(grp.visibleMonthSums[m.ym])})
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-mono border-r border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap">
                          {formatRupiah(grp.visibleTotals.totalBilled)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 border-r border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap">
                          {formatRupiah(grp.visibleTotals.totalPaid)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatRupiah(grp.visibleTotals.debt)}
                        </td>
                      </tr>

                      {/* Baris Anggota Dewan */}
                      {grp.legislators.map((leg) => {
                        rowIndex += 1;
                        return (
                          <tr
                            key={leg.id}
                            className="border-b border-slate-100 dark:border-slate-800/80 odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/30 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                              {rowIndex}
                            </td>
                            <td className="py-2 px-3 sticky left-10 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {leg.namaLengkap}
                              </span>
                              {leg.isAutodebetActive ? (
                                <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5" /> Autodebet sejak{' '}
                                  {formatMonthLabel(leg.autodebetStartMonth)}
                                </span>
                              ) : leg.autodebetEndMonth ? (
                                <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-medium block">
                                  Eks-AD: {formatMonthLabel(leg.autodebetStartMonth)}–
                                  {formatMonthLabel(leg.autodebetEndMonth)}
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-slate-400 font-medium block">
                                  Setoran Manual
                                </span>
                              )}
                            </td>

                            {displayMonths.map((m) => {
                              const cell = leg.cells[m.ym] || null;
                              const hasAny = cell && (cell.amount > 0 || cell.allPaymentIds.length > 0);
                              if (!cell || cell.amount <= 0) {
                                return (
                                  <td
                                    key={m.ym}
                                    onClick={() =>
                                      setActiveCellModal({ legislator: leg, periodMonth: m.ym, cell })
                                    }
                                    title={`Klik untuk catat setoran ${leg.namaLengkap} (${m.label})`}
                                    className="group py-2 px-2 text-center font-mono text-slate-300 dark:text-slate-700 border-r border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                                  >
                                    <span className="group-hover:hidden">
                                      {hasAny ? formatRupiah(0) : '–'}
                                    </span>
                                    <span className="hidden group-hover:inline-flex items-center justify-center font-bold text-[10px]">
                                      + Catat
                                    </span>
                                  </td>
                                );
                              }

                              const isAd = cell.method === 'AUTODEBET';
                              const cellBg = isAd
                                ? 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100/90'
                                : cell.status === 'PARTIAL'
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100/90'
                                : 'bg-emerald-50/70 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80';

                              return (
                                <td
                                  key={m.ym}
                                  onClick={() =>
                                    setActiveCellModal({ legislator: leg, periodMonth: m.ym, cell })
                                  }
                                  title="Klik untuk lihat rincian, tambah pelunasan, atau batalkan setoran ini"
                                  className={`py-2 px-2 text-center font-mono font-semibold whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors ${cellBg}`}
                                >
                                  <span className="inline-flex items-center gap-1 justify-center">
                                    <span>{formatRupiah(cell.amount)}</span>
                                    {cell.hasRemittedDpp && (
                                      <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                    )}
                                  </span>
                                  {isAd && (
                                    <span className="block text-[8.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                      AUTODEBET
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap">
                              {formatRupiah(leg.displayBilled)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap">
                              {formatRupiah(leg.displayPaid)}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-mono font-bold whitespace-nowrap ${
                                leg.displayDelta > 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : leg.displayDelta < 0
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {leg.displayDelta === 0
                                ? 'Lunas'
                                : leg.displayDelta < 0
                                ? `Lebih ${formatRupiah(Math.abs(leg.displayDelta))}`
                                : formatRupiah(leg.displayDelta)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>

              {/* Baris Sticky GRAND TOTAL Per Kolom Bulan */}
              {visibleGroups.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 bg-[#0F2460] text-white font-extrabold border-t-2 border-amber-400">
                  <tr>
                    <td className="py-2.5 px-2 text-center sticky left-0 z-30 bg-[#0F2460] border-r border-white/15">
                      Σ
                    </td>
                    <td className="py-2.5 px-3 sticky left-10 z-30 bg-[#0F2460] border-r border-white/15 whitespace-nowrap">
                      GRAND TOTAL ({visibleSummary.count} Org)
                    </td>
                    {displayMonths.map((m) => (
                      <td
                        key={m.ym}
                        className="py-2.5 px-2 text-center font-mono text-[10.5px] text-amber-300 border-r border-white/10 whitespace-nowrap"
                      >
                        {formatRupiah(monthlyColumnSums[m.ym] || 0)}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono border-r border-white/10 whitespace-nowrap">
                      {formatRupiah(visibleSummary.totalBilled)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 border-r border-white/10 whitespace-nowrap">
                      {formatRupiah(visibleSummary.totalPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 whitespace-nowrap">
                      {formatRupiah(visibleSummary.totalDebt)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal Rincian Status Rekonsiliasi (Daftar Anggota Menunggak & Lunas) */}
      <ReconciliationStatusModal
        isOpen={reconciliationModal.open}
        initialTab={reconciliationModal.initialTab}
        kind={kind}
        scopeLabel={scopeLabel}
        items={reconciliationItems}
        onClose={() => setReconciliationModal((prev) => ({ ...prev, open: false }))}
        onSelectCell={(leg, ym) =>
          setActiveCellModal({
            legislator: leg,
            periodMonth: ym,
            cell: leg.cells[ym] || null,
          })
        }
      />

      {/* Modal Klik Sel Matriks (Lihat/Batalkan/Catat Setoran) */}
      <MatrixCellModal
        isOpen={!!activeCellModal}
        legislator={activeCellModal?.legislator || null}
        periodMonth={activeCellModal?.periodMonth || ''}
        cell={activeCellModal?.cell || null}
        onClose={() => setActiveCellModal(null)}
        onRefreshAll={onRefreshAll}
        showToast={showToast}
      />

      {/* Modal Setoran Manual / Rapel Multi-Bulan */}
      <ManualPaymentModal
        isOpen={isManualModalOpen}
        legislators={legislators}
        onClose={() => setIsManualModalOpen(false)}
        onRefreshAll={onRefreshAll}
        showToast={showToast}
      />
    </div>
  );
};
