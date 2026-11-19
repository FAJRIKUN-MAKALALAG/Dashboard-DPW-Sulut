import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Landmark,
  Receipt,
  RotateCcw,
  Wallet,
  Zap,
} from 'lucide-react';
import { FinanceMonthlyBreakdownRow, FinanceSummary } from '../../../types/finance';
import { formatMonthLabel, formatRupiah } from '../financeHelpers';

function getRapelOverpay(m: FinanceMonthlyBreakdownRow): number {
  return Math.max(0, m.dpwPaid - m.dpwBilled) + Math.max(0, m.dppPaid - m.dppBilled);
}

interface PeriodKpiSummaryProps {
  summary: FinanceSummary;
  selectedYear: string;
  focusedMonth: string;
  onSelectMonth: (ym: string) => void;
  onOpenExpenses: (ym?: string) => void;
}

export const PeriodKpiSummary: React.FC<PeriodKpiSummaryProps> = ({
  summary,
  selectedYear,
  focusedMonth,
  onSelectMonth,
  onOpenExpenses,
}) => {
  const [showMonthlyTable, setShowMonthlyTable] = useState(true);

  const yearLabel = selectedYear === 'ALL' ? '2026–Berjalan' : selectedYear;
  const pm = summary.periodMetrics;
  const monthlyRows: FinanceMonthlyBreakdownRow[] = summary.monthlyBreakdown || [];

  const annual = useMemo(() => {
    const totalPaid =
      pm?.totalPaid ?? summary.balances.totalCollectedDpw + summary.balances.totalCollectedDpp;
    const dpwPaid = pm?.dpwPaid ?? summary.balances.totalCollectedDpw;
    const dppPaid = pm?.dppPaid ?? summary.balances.totalCollectedDpp;
    const manualPaid = pm ? pm.dpwPaidManual + pm.dppPaidManual : 0;
    const adPaid = pm ? pm.dpwPaidAutodebet + pm.dppPaidAutodebet : 0;
    const totalDebt = pm?.totalDebt ?? summary.balances.totalDpwDebt + summary.balances.totalDppDebt;
    const dpwDebt = pm?.dpwDebt ?? summary.balances.totalDpwDebt;
    const dppDebt = pm?.dppDebt ?? summary.balances.totalDppDebt;
    const dpwExpense = pm ? (pm.dpwExpense ?? pm.pettyOut) : 0;
    const netDpwSurplus = pm ? (pm.netDpwSurplus ?? dpwPaid - dpwExpense) : dpwPaid - dpwExpense;

    return {
      totalPaid,
      dpwPaid,
      dppPaid,
      manualPaid,
      adPaid,
      totalDebt,
      dpwDebt,
      dppDebt,
      dpwExpense,
      netDpwSurplus,
    };
  }, [pm, summary.balances]);

  const focusedRow = useMemo(
    () => (focusedMonth ? monthlyRows.find((m) => m.ym === focusedMonth) || null : null),
    [focusedMonth, monthlyRows]
  );

  const monthlyTableTotals = useMemo(() => {
    return monthlyRows.reduce(
      (acc, m) => {
        const exp = m.dpwExpense ?? m.pettyOut;
        const expBank = m.dpwExpenseBank ?? 0;
        const expPetty = m.dpwExpensePetty ?? m.pettyOut;
        const surplus = m.netDpwSurplus ?? m.dpwPaid - exp;
        return {
          totalPaid: acc.totalPaid + m.totalPaid,
          dpwPaid: acc.dpwPaid + m.dpwPaid,
          dppPaid: acc.dppPaid + m.dppPaid,
          manual: acc.manual + m.dpwPaidManual + m.dppPaidManual,
          ad: acc.ad + m.dpwPaidAutodebet + m.dppPaidAutodebet,
          totalDebt: acc.totalDebt + m.dpwDebt + m.dppDebt,
          dpwDebt: acc.dpwDebt + m.dpwDebt,
          dppDebt: acc.dppDebt + m.dppDebt,
          dpwExpense: acc.dpwExpense + exp,
          dpwExpenseBank: acc.dpwExpenseBank + expBank,
          dpwExpensePetty: acc.dpwExpensePetty + expPetty,
          netDpwSurplus: acc.netDpwSurplus + surplus,
        };
      },
      {
        totalPaid: 0,
        dpwPaid: 0,
        dppPaid: 0,
        manual: 0,
        ad: 0,
        totalDebt: 0,
        dpwDebt: 0,
        dppDebt: 0,
        dpwExpense: 0,
        dpwExpenseBank: 0,
        dpwExpensePetty: 0,
        netDpwSurplus: 0,
      }
    );
  }, [monthlyRows]);

  return (
    <div className="space-y-3">
      {/* Strip Label Total Setahun + Posisi Saldo Kas Real-Time */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-[#1A3282] text-white font-extrabold uppercase tracking-wider text-[10px]">
            Total Setahun {yearLabel}
          </span>
          <span className="text-slate-500 font-medium">
            Periode {formatMonthLabel(summary.debtPeriod.from)} – {formatMonthLabel(summary.debtPeriod.to)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
          <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
            <Landmark className="w-3 h-3 text-blue-600" />
            Bank DPW: <strong>{formatRupiah(summary.balances.bankBalance)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
            Titipan DPP: <strong>{formatRupiah(summary.balances.pendingDppTotal)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            Kas Ops: <strong>{formatRupiah(summary.balances.pettyCashBalance)}</strong>
          </span>
        </div>
      </div>

      {/* 4 Kartu KPI Total Setahun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Total Iuran Masuk ({yearLabel})</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 block">
            {formatRupiah(annual.totalPaid)}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            DPW {formatRupiah(annual.dpwPaid)} · DPP {formatRupiah(annual.dppPaid)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Manual vs Autodebet ({yearLabel})</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white block">
            {formatRupiah(annual.manualPaid)}
          </span>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-1 block">
            Autodebet: {formatRupiah(annual.adPaid)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 mb-1">
            <span className="font-semibold">Tunggakan Tahun {yearLabel}</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 block">
            {formatRupiah(annual.totalDebt)}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            DPW {formatRupiah(annual.dpwDebt)} · DPP {formatRupiah(annual.dppDebt)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenExpenses('')}
          className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400 text-left shadow-2xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 mb-1">
            <span className="font-bold">Pengeluaran DPW ({yearLabel})</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 block">
            {formatRupiah(annual.dpwExpense)}
          </span>
          <span className="text-[10.5px] font-mono text-slate-600 dark:text-slate-300 mt-1 block">
            Surplus DPW: {formatRupiah(annual.netDpwSurplus)} · Saldo Bank: {formatRupiah(summary.balances.bankBalance)}
          </span>
        </button>
      </div>

      {/* Panel Rincian Per Bulan dari Ke-4 Total di Atas */}
      {monthlyRows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1A3282] dark:text-blue-400" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Pembagian 4 Total Ini Per Bulan ({monthlyRows.length} Bulan di Buku {yearLabel})
                </h3>
                <p className="text-[10.5px] text-slate-500">
                  Klik salah satu bulan di bawah untuk melihat kartu rincian khusus bulan tersebut dan menyinkronkan ke seluruh tab.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMonthlyTable((v) => !v)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {showMonthlyTable ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Sembunyikan Tabel Bulanan</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Tampilkan Tabel Bulanan</span>
                </>
              )}
            </button>
          </div>

          {/* Month Quick-Pill Strip */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectMonth('')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                focusedMonth === ''
                  ? 'bg-[#1A3282] border-[#1A3282] text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Total Setahun ({yearLabel})
            </button>
            {monthlyRows.map((m) => {
              const isActive = focusedMonth === m.ym;
              return (
                <button
                  key={m.ym}
                  type="button"
                  onClick={() => onSelectMonth(isActive ? '' : m.ym)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 border-amber-500 text-slate-950 font-extrabold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* 4 Kartu KPI Khusus Bulan Terpilih */}
          {focusedRow && (
            <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/15 border-b border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    Fokus Bulan
                  </span>
                  <span>
                    {focusedRow.label} ({focusedRow.ym})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectMonth('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Setahun</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total Iuran Masuk ({focusedRow.label})
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    {formatRupiah(focusedRow.totalPaid)}
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-500 block mt-0.5">
                    DPW {formatRupiah(focusedRow.dpwPaid)} · DPP {formatRupiah(focusedRow.dppPaid)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Manual vs Autodebet ({focusedRow.label})
                  </span>
                  <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block mt-0.5">
                    {formatRupiah(focusedRow.dpwPaidManual + focusedRow.dppPaidManual)}
                  </span>
                  <span className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400 block mt-0.5">
                    Autodebet: {formatRupiah(focusedRow.dpwPaidAutodebet + focusedRow.dppPaidAutodebet)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                    Tunggakan ({focusedRow.label})
                  </span>
                  <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                    {formatRupiah(focusedRow.dpwDebt + focusedRow.dppDebt)}
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-500 block mt-0.5">
                    DPW {formatRupiah(focusedRow.dpwDebt)} · DPP {formatRupiah(focusedRow.dppDebt)}
                  </span>
                  {getRapelOverpay(focusedRow) > 0 && (
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      Rapel +{formatRupiah(getRapelOverpay(focusedRow))}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenExpenses(focusedRow.ym)}
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 hover:border-amber-400 text-left cursor-pointer transition-colors"
                >
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                    Pengeluaran DPW ({focusedRow.label})
                  </span>
                  <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                    {formatRupiah(focusedRow.dpwExpense ?? focusedRow.pettyOut)}
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    Surplus DPW:{' '}
                    {formatRupiah(
                      focusedRow.netDpwSurplus ??
                        focusedRow.dpwPaid - (focusedRow.dpwExpense ?? focusedRow.pettyOut)
                    )}{' '}
                    · Kelola &rarr;
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Tabel Perbandingan Semua Bulan di Dalam Tahun Aktif */}
          {showMonthlyTable && (
            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/95 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-4">Bulan</th>
                    <th className="py-2 px-3 text-right">Total Iuran Masuk (DPW · DPP)</th>
                    <th className="py-2 px-3 text-right">Manual vs Autodebet</th>
                    <th className="py-2 px-3 text-right">Tunggakan (DPW · DPP)</th>
                    <th className="py-2 px-3 text-right">Pengeluaran DPW (Bank · Ops)</th>
                    <th className="py-2 px-4 text-right">Surplus DPW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {monthlyRows.map((m) => {
                    const isActive = focusedMonth === m.ym;
                    const manual = m.dpwPaidManual + m.dppPaidManual;
                    const ad = m.dpwPaidAutodebet + m.dppPaidAutodebet;
                    const totDebt = m.dpwDebt + m.dppDebt;
                    const rapelOverpay = getRapelOverpay(m);
                    const exp = m.dpwExpense ?? m.pettyOut;
                    const expBank = m.dpwExpenseBank ?? 0;
                    const expPetty = m.dpwExpensePetty ?? m.pettyOut;
                    const surplus = m.netDpwSurplus ?? m.dpwPaid - exp;

                    return (
                      <tr
                        key={m.ym}
                        onClick={() => onSelectMonth(isActive ? '' : m.ym)}
                        className={`cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-amber-50/90 dark:bg-amber-950/30'
                            : 'odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{m.label}</span>
                            <span className="text-[10px] font-mono text-slate-400">({m.ym})</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                                Dipilih
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">
                            {formatRupiah(m.totalPaid)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            DPW {formatRupiah(m.dpwPaid)} · DPP {formatRupiah(m.dppPaid)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {formatRupiah(manual)}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            AD: {formatRupiah(ad)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-rose-600 dark:text-rose-400 block">
                            {formatRupiah(totDebt)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            DPW {formatRupiah(m.dpwDebt)} · DPP {formatRupiah(m.dppDebt)}
                          </span>
                          {rapelOverpay > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                              Rapel +{formatRupiah(rapelOverpay)}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-rose-600 dark:text-rose-400 block">
                            {formatRupiah(exp)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Bank {formatRupiah(expBank)} · Ops {formatRupiah(expPetty)}
                          </span>
                        </td>
                        <td
                          className={`py-2 px-4 text-right font-mono font-bold whitespace-nowrap ${
                            surplus >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {surplus >= 0 ? '+' : ''}
                          {formatRupiah(surplus)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 z-10 bg-[#0F2460] text-white font-extrabold border-t-2 border-amber-400">
                  <tr>
                    <td className="py-2 px-4">TOTAL SETAHUN ({yearLabel.toUpperCase()})</td>
                    <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-emerald-300 block">
                        {formatRupiah(monthlyTableTotals.totalPaid)}
                      </span>
                      <span className="text-[10px] font-normal text-blue-200 block">
                        DPW {formatRupiah(monthlyTableTotals.dpwPaid)} · DPP{' '}
                        {formatRupiah(monthlyTableTotals.dppPaid)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                      <span className="block">{formatRupiah(monthlyTableTotals.manual)}</span>
                      <span className="text-[10px] font-normal text-blue-200 block">
                        AD: {formatRupiah(monthlyTableTotals.ad)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-rose-300 block">
                        {formatRupiah(annual.totalDebt)}
                      </span>
                      <span className="text-[10px] font-normal text-blue-200 block">
                        DPW {formatRupiah(annual.dpwDebt)} · DPP {formatRupiah(annual.dppDebt)}
                      </span>
                      {monthlyTableTotals.totalDebt !== annual.totalDebt && (
                        <span className="text-[9.5px] font-normal text-amber-200 block">
                          Netto setelah rapel
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-rose-300 block">
                        {formatRupiah(monthlyTableTotals.dpwExpense)}
                      </span>
                      <span className="text-[10px] font-normal text-blue-200 block">
                        Bank {formatRupiah(monthlyTableTotals.dpwExpenseBank)} · Ops{' '}
                        {formatRupiah(monthlyTableTotals.dpwExpensePetty)}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-4 text-right font-mono whitespace-nowrap ${
                        monthlyTableTotals.netDpwSurplus >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {monthlyTableTotals.netDpwSurplus >= 0 ? '+' : ''}
                      {formatRupiah(monthlyTableTotals.netDpwSurplus)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
