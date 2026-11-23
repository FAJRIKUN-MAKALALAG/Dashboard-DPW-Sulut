import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Landmark,
  Receipt,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { FinanceSummary } from '../../types/finance';
import { formatMonthLabel, formatRupiah } from './financeHelpers';

interface FinanceOverviewTabProps {
  summary: FinanceSummary;
  selectedYear: string;
  onChangeYear: (year: string) => void;
  onInspectMonth: (ym: string, targetTab: 'matrix' | 'expenses' | 'cashbook') => void;
  onGoToPayments: () => void;
  onGoToRemittance: () => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  summary,
  selectedYear,
  onChangeYear,
  onInspectMonth,
  onGoToPayments,
  onGoToRemittance,
}) => {
  const {
    balances,
    regionBreakdown,
    autodebetRegionGroups,
    autodebetInactiveRegions,
    recentTransactions,
    yearlyComparison,
    monthlyBreakdown,
  } = summary;

  const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'PROVINSI' | 'KAB_KOTA'>('ALL');
  const [regionSearch, setRegionSearch] = useState('');

  const filteredRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase();
    return regionBreakdown.filter((reg) => {
      if (tingkatFilter !== 'ALL' && reg.tingkat !== tingkatFilter) return false;
      if (q && !reg.daerah.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [regionBreakdown, tingkatFilter, regionSearch]);

  const regionTotals = useMemo(() => {
    let legs = 0;
    let dpwBilled = 0;
    let dpwPaid = 0;
    let dpwDebt = 0;
    let dppBilled = 0;
    let dppPaid = 0;
    let dppDebt = 0;

    for (const r of filteredRegions) {
      legs += r.legislatorCount;
      dpwBilled += r.dpwBilled;
      dpwPaid += r.dpwPaid;
      dpwDebt += r.dpwDebt;
      dppBilled += r.dppBilled;
      dppPaid += r.dppPaid;
      dppDebt += r.dppDebt;
    }

    const totBilled = dpwBilled + dppBilled;
    const compliancePct =
      totBilled > 0 ? Math.round(Math.min(100, ((dpwPaid + dppPaid) / totBilled) * 1000)) / 10 : 100;

    return { legs, dpwPaid, dpwDebt, dppPaid, dppDebt, compliancePct };
  }, [filteredRegions]);

  const monthlyTotalsSummary = useMemo(() => {
    const rows = monthlyBreakdown || [];
    return rows.reduce(
      (acc, r) => {
        const exp = r.dpwExpense ?? r.pettyOut;
        const expBank = r.dpwExpenseBank ?? 0;
        const expPetty = r.dpwExpensePetty ?? r.pettyOut;
        const surplus = r.netDpwSurplus ?? r.dpwPaid - exp;
        return {
          dpwBilled: acc.dpwBilled + r.dpwBilled,
          dpwPaid: acc.dpwPaid + r.dpwPaid,
          dpwManual: acc.dpwManual + r.dpwPaidManual,
          dpwAd: acc.dpwAd + r.dpwPaidAutodebet,
          dppPaid: acc.dppPaid + r.dppPaid,
          totalPaid: acc.totalPaid + r.totalPaid,
          bankIn: acc.bankIn + r.bankIn,
          pettyOut: acc.pettyOut + r.pettyOut,
          dpwExpense: acc.dpwExpense + exp,
          dpwExpenseBank: acc.dpwExpenseBank + expBank,
          dpwExpensePetty: acc.dpwExpensePetty + expPetty,
          netDpwSurplus: acc.netDpwSurplus + surplus,
        };
      },
      {
        dpwBilled: 0,
        dpwPaid: 0,
        dpwManual: 0,
        dpwAd: 0,
        dppPaid: 0,
        totalPaid: 0,
        bankIn: 0,
        pettyOut: 0,
        dpwExpense: 0,
        dpwExpenseBank: 0,
        dpwExpensePetty: 0,
        netDpwSurplus: 0,
      }
    );
  }, [monthlyBreakdown]);

  const yearLabel = selectedYear === 'ALL' ? '2026–Berjalan' : `Tahun ${selectedYear}`;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Tabel Rekap Per Bulan di Tahun Terpilih + Tombol Cek Iuran / Cek Kas */}
      {monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1A3282] dark:text-blue-400" />
                <span>Rekap Per Bulan — {yearLabel} ({monthlyBreakdown.length} Bulan)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Periksa angka setoran DPW/DPP &amp; kas per bulan di dalam buku tahun ini, lalu klik Cek Iuran atau Cek Kas untuk meninjau rinciannya.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Bulan</th>
                  <th className="py-2.5 px-3 text-right">Tagihan DPW</th>
                  <th className="py-2.5 px-3 text-right">Masuk DPW (Manual · AD)</th>
                  <th className="py-2.5 px-3 text-right">Masuk DPP</th>
                  <th className="py-2.5 px-3 text-right">Total Iuran</th>
                  <th className="py-2.5 px-3 text-right">Masuk Bank</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran DPW (Bank · Ops)</th>
                  <th className="py-2.5 px-3 text-right">Surplus DPW</th>
                  <th className="py-2.5 px-4 text-right">Cek Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {monthlyBreakdown.map((m) => {
                  const rowExpense = m.dpwExpense ?? m.pettyOut;
                  const rowExpenseBank = m.dpwExpenseBank ?? 0;
                  const rowExpensePetty = m.dpwExpensePetty ?? m.pettyOut;
                  const rowSurplus = m.netDpwSurplus ?? m.dpwPaid - rowExpense;
                  return (
                    <tr
                      key={m.ym}
                      className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {m.label}
                        <span className="text-[10px] font-mono text-slate-400 ml-1.5">({m.ym})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatRupiah(m.dpwBilled)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                          {formatRupiah(m.dpwPaid)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRupiah(m.dpwPaidManual)} · {formatRupiah(m.dpwPaidAutodebet)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {formatRupiah(m.dppPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(m.totalPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatRupiah(m.bankIn)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-rose-600 dark:text-rose-400 block">
                          {formatRupiah(rowExpense)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRupiah(rowExpenseBank)} · {formatRupiah(rowExpensePetty)}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                          rowSurplus >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {rowSurplus >= 0 ? '+' : ''}
                        {formatRupiah(rowSurplus)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectMonth(m.ym, 'matrix')}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10.5px] font-bold cursor-pointer"
                          >
                            Cek Iuran
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectMonth(m.ym, 'expenses')}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10.5px] font-bold cursor-pointer"
                          >
                            Cek Keluar
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectMonth(m.ym, 'cashbook')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10.5px] font-bold cursor-pointer"
                          >
                            Cek Kas
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-[#0F2460] text-white font-extrabold border-t-2 border-amber-400">
                <tr>
                  <td className="py-2.5 px-4">TOTAL {yearLabel.toUpperCase()}</td>
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    {formatRupiah(monthlyTotalsSummary.dpwBilled)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-300 whitespace-nowrap">
                    {formatRupiah(monthlyTotalsSummary.dpwPaid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-300 whitespace-nowrap">
                    {formatRupiah(monthlyTotalsSummary.dppPaid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-300 whitespace-nowrap">
                    {formatRupiah(monthlyTotalsSummary.totalPaid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    {formatRupiah(monthlyTotalsSummary.bankIn)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-300 whitespace-nowrap">
                    <span className="block">{formatRupiah(monthlyTotalsSummary.dpwExpense)}</span>
                    <span className="text-[10px] font-normal text-blue-200 block">
                      {formatRupiah(monthlyTotalsSummary.dpwExpenseBank)} · {formatRupiah(monthlyTotalsSummary.dpwExpensePetty)}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono whitespace-nowrap ${
                      monthlyTotalsSummary.netDpwSurplus >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {monthlyTotalsSummary.netDpwSurplus >= 0 ? '+' : ''}
                    {formatRupiah(monthlyTotalsSummary.netDpwSurplus)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Banner Pemisahan 3 Pos Dana & Monitoring Autodebet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#1A3282] dark:text-blue-400" />
                <span>Posisi Dana Real-Time (Akumulasi Keseluruhan)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekening Bank DPW memisahkan hak DPW dan kewajiban Titipan DPP secara otomatis agar dana DPP tidak terpakai operasional.
              </p>
            </div>
            {balances.pendingDppTotal > 0 && (
              <button
                onClick={onGoToRemittance}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-colors"
              >
                Kirim ke DPP &rarr;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">
                1. Saldo Rekening Bank DPW
              </span>
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                {formatRupiah(balances.bankBalance)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Semua masuk sebelum transfer DPP
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                2. Titipan / Antrean DPP ({balances.pendingDppCount} item)
              </span>
              <span className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-300 mt-1 block">
                {formatRupiah(balances.pendingDppTotal)}
              </span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 block">
                Terkunci wajib kirim ke DPP Pusat
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                3. Kas Bersih Hak DPW (di Bank)
              </span>
              <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-1 block">
                {formatRupiah(balances.netDpwBankBalance)}
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 block">
                Aman ditarik untuk Kas Operasional
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Akumulasi DPW Masuk</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatRupiah(balances.totalCollectedDpw)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Akumulasi DPP Terkumpul</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatRupiah(balances.totalCollectedDpp)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Sudah Setor DPP</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(balances.totalRemittedDpp)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Kas Operasional Kantor</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatRupiah(balances.pettyCashBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Autodebet Aktif vs Riwayat Berhenti */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Monitoring Autodebet</span>
            </h3>
            <button
              onClick={onGoToPayments}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Kelola &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {autodebetRegionGroups.map((g) => (
              <div
                key={g.daerah}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {g.daerah} ({g.memberCount} org)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    DPW {formatRupiah(g.totalDpw)} · DPP {formatRupiah(g.totalDpp)}
                  </span>
                </div>
                {g.isFullyRecorded ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {formatMonthLabel(g.periodMonth)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {g.alreadyRecordedCount}/{g.memberCount}
                  </span>
                )}
              </div>
            ))}
          </div>

          {autodebetInactiveRegions.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>Riwayat Wilayah Pernah Autodebet (Kini Non-Aktif)</span>
              </span>
              {autodebetInactiveRegions.map((reg) => (
                <div
                  key={reg.daerah}
                  className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {reg.daerah}
                  </span>
                  {reg.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-[10.5px] text-slate-500">
                      <span className="truncate pr-2">&bull; {m.namaLengkap}</span>
                      <span className="font-mono shrink-0 text-slate-600 dark:text-slate-400">
                        {formatMonthLabel(m.startMonth)} – {formatMonthLabel(m.endMonth)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabel Perbandingan Per Tahun (2026 – Berjalan) */}
      {yearlyComparison && yearlyComparison.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-[#1A3282] dark:text-blue-400" />
                <span>Perbandingan Antar Tahun (2026 – Berjalan)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Klik baris tahun untuk beralih ke Buku Tahun tersebut di seluruh sistem.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-4">Tahun</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3 text-right">Tagihan DPW</th>
                  <th className="py-2.5 px-3 text-right">Masuk DPW (Manual · AD)</th>
                  <th className="py-2.5 px-3 text-right">Tunggakan DPW</th>
                  <th className="py-2.5 px-3 text-right">Masuk DPP</th>
                  <th className="py-2.5 px-3 text-right">Tunggakan DPP</th>
                  <th className="py-2.5 px-3 text-right">Masuk Bank</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran DPW</th>
                  <th className="py-2.5 px-4 text-right">Surplus DPW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {yearlyComparison.map((row) => {
                  const isActive = selectedYear === row.year;
                  const rowExpense = row.dpwExpense ?? row.pettyOut;
                  const rowExpenseBank = row.dpwExpenseBank ?? 0;
                  const rowExpensePetty = row.dpwExpensePetty ?? row.pettyOut;
                  const rowSurplus = row.netDpwSurplus ?? row.dpwPaid - rowExpense;
                  return (
                    <tr
                      key={row.year}
                      onClick={() => onChangeYear(row.year)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/35'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-extrabold text-[#1A3282] dark:text-blue-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{row.year}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1A3282] text-white text-[9px] font-bold">
                              Aktif
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {formatMonthLabel(row.from)} – {formatMonthLabel(row.to)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatRupiah(row.dpwBilled)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                          {formatRupiah(row.dpwPaid)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRupiah(row.dpwPaidManual)} · {formatRupiah(row.dpwPaidAutodebet)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {row.dpwDebt > 0 ? formatRupiah(row.dpwDebt) : <span className="text-emerald-600">Lunas</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {formatRupiah(row.dppPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {row.dppDebt > 0 ? formatRupiah(row.dppDebt) : <span className="text-emerald-600">Lunas</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatRupiah(row.bankIn)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-rose-600 dark:text-rose-400 block">
                          {formatRupiah(rowExpense)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRupiah(rowExpenseBank)} · {formatRupiah(rowExpensePetty)}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          rowSurplus >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {rowSurplus >= 0 ? '+' : ''}
                        {formatRupiah(rowSurplus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabel Rekap Per Daerah (Sesuai Tahun Dipilih) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>
                Rekap Setoran &amp; Tunggakan Per Fraksi Daerah ({formatMonthLabel(summary.debtPeriod.from)} –{' '}
                {formatMonthLabel(summary.debtPeriod.to)})
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PROVINSI', label: 'Provinsi' },
                { id: 'KAB_KOTA', label: 'Kab/Kota' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTingkatFilter(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    tingkatFilter === t.id
                      ? 'bg-[#1A3282] text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                placeholder="Cari daerah..."
                className="pl-8 pr-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none w-44 text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-3">Daerah / Fraksi</th>
                <th className="py-2.5 px-3 text-center">Dewan</th>
                <th className="py-2.5 px-3 text-right">Setoran DPW (Manual / AD)</th>
                <th className="py-2.5 px-3 text-right">Tunggakan DPW</th>
                <th className="py-2.5 px-3 text-right">Setoran DPP (Manual / AD)</th>
                <th className="py-2.5 px-3 text-right">Tunggakan DPP</th>
                <th className="py-2.5 px-4 text-right min-w-[125px]">Kepatuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRegions.map((reg, idx) => {
                const pct = reg.compliancePct ?? 0;
                return (
                  <tr
                    key={reg.daerah}
                    className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{reg.daerah}</span>
                        {reg.autodebetActiveCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                            AD ({reg.autodebetActiveCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{reg.legislatorCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">
                        {formatRupiah(reg.dpwPaid)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        M: {formatRupiah(reg.dpwPaidManual ?? 0)} · AD: {formatRupiah(reg.dpwPaidAutodebet ?? 0)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {reg.dpwDebt > 0 ? formatRupiah(reg.dpwDebt) : <span className="text-emerald-600">Lunas</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold block">
                        {formatRupiah(reg.dppPaid)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        M: {formatRupiah(reg.dppPaidManual ?? 0)} · AD: {formatRupiah(reg.dppPaidAutodebet ?? 0)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {reg.dppDebt > 0 ? formatRupiah(reg.dppDebt) : <span className="text-emerald-600">Lunas</span>}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#0F2460] text-white font-extrabold border-t-2 border-amber-400">
                <td className="py-2.5 px-3 text-center">Σ</td>
                <td className="py-2.5 px-3">TOTAL ({filteredRegions.length} Daerah)</td>
                <td className="py-2.5 px-3 text-center font-mono">{regionTotals.legs}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-300 whitespace-nowrap">
                  {formatRupiah(regionTotals.dpwPaid)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-300 whitespace-nowrap">
                  {formatRupiah(regionTotals.dpwDebt)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-300 whitespace-nowrap">
                  {formatRupiah(regionTotals.dppPaid)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-amber-300 whitespace-nowrap">
                  {formatRupiah(regionTotals.dppDebt)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono">{regionTotals.compliancePct}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>12 Transaksi Kas Terbaru</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    tx.direction === 'IN'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                  }`}
                >
                  {tx.direction === 'IN' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {tx.description}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {tx.txDate} ·{' '}
                    <span className="font-mono font-semibold">
                      {tx.accountType === 'BANK_DPW' ? 'Bank DPW' : 'Kas Operasional'}
                    </span>{' '}
                    · {tx.category}
                  </p>
                </div>
              </div>
              <span
                className={`font-mono font-bold shrink-0 ${
                  tx.direction === 'IN'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {tx.direction === 'IN' ? '+' : '-'} {formatRupiah(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
