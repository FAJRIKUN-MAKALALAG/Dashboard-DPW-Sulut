import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import { FinanceService } from '../../services';
import { FinanceSummary, FinanceTransaction } from '../../types/finance';
import { exportFinanceMonthlyReportExcel } from '../../utils/financeExportUtils';
import { CashbookActionForms } from './cashbook/CashbookActionForms';
import { ExcelLedgerSheet, ExcelSheetType } from './cashbook/ExcelLedgerSheet';
import { formatMonthLabel, formatRupiah, getMonthOptionsForYear } from './financeHelpers';
import { MonthDrilldownBar, MonthDrilldownOption } from './shared/MonthDrilldownBar';

interface FinanceCashbookTabProps {
  summary: FinanceSummary;
  selectedYear: string;
  focusedMonth: string;
  setFocusedMonth: (ym: string) => void;
  refreshKey: number;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const FinanceCashbookTab: React.FC<FinanceCashbookTabProps> = ({
  summary,
  selectedYear,
  focusedMonth,
  setFocusedMonth,
  refreshKey,
  onRefreshAll,
  showToast,
}) => {
  const [activeSheet, setActiveSheet] = useState<ExcelSheetType>('saldo');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showForms, setShowForms] = useState(false);

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [monthCountsByYm, setMonthCountsByYm] = useState<Record<string, number>>({});
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [txStats, setTxStats] = useState<{ totalIn: number; totalOut: number; netDelta: number }>({
    totalIn: 0,
    totalOut: 0,
    netDelta: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Reset hitungan badge bulan ketika tahun atau sheet berubah
  useEffect(() => {
    setMonthCountsByYm({});
  }, [selectedYear, activeSheet]);

  const loadSheet = useCallback(async () => {
    setIsLoading(true);
    try {
      const account = activeSheet === 'operational' ? 'PETTY_CASH' : 'BANK_DPW';
      const validMonth =
        focusedMonth &&
        (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
          ? focusedMonth
          : '';
      const activeYearParam =
        !validMonth && selectedYear !== 'ALL' ? selectedYear : undefined;

      const res = await FinanceService.listTransactions({
        account,
        year: activeYearParam,
        month: validMonth || undefined,
        sort: 'asc',
        limit: 1200,
      });

      setTransactions(res.items);
      setOpeningBalance(Number(res.openingBalance ?? 0));
      setClosingBalance(Number(res.closingBalance ?? 0));
      setTxStats(res.summary);

      // Simpan jumlah transaksi per bulan ketika memuat keseluruhan tahun
      if (!validMonth) {
        const counts: Record<string, number> = {};
        for (const t of res.items) {
          const ym = (t.txDate || '').slice(0, 7);
          if (ym) counts[ym] = (counts[ym] || 0) + 1;
        }
        setMonthCountsByYm(counts);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memuat laporan keuangan'}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeSheet, selectedYear, focusedMonth, showToast]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet, refreshKey]);

  const drilldownMonths: MonthDrilldownOption[] = useMemo(() => {
    const baseOpts = getMonthOptionsForYear(selectedYear);
    return baseOpts.map((m) => {
      const cnt = monthCountsByYm[m.ym] || 0;
      const summaryRow = summary.monthlyBreakdown?.find((r) => r.ym === m.ym);
      const hasTxSummary =
        activeSheet === 'operational'
          ? (summaryRow?.pettyIn ?? 0) + (summaryRow?.pettyOut ?? 0) > 0
          : (summaryRow?.bankIn ?? 0) + (summaryRow?.bankOut ?? 0) > 0;
      return {
        ym: m.ym,
        label: m.label,
        badge: cnt > 0 ? String(cnt) : undefined,
        hasData: cnt > 0 || hasTxSummary,
      };
    });
  }, [selectedYear, monthCountsByYm, summary.monthlyBreakdown, activeSheet]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const handleDeleteTx = async (tx: FinanceTransaction) => {
    if (!window.confirm(`Hapus transaksi "${tx.description}"?`)) return;
    try {
      await FinanceService.deleteTransaction(tx.id);
      showToast('Transaksi berhasil dihapus');
      await Promise.all([loadSheet(), onRefreshAll()]);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Transaksi tidak dapat dihapus'}`);
    }
  };

  const handleExportFullExcel = async () => {
    setIsExporting(true);
    try {
      const validMonth =
        focusedMonth &&
        (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
          ? focusedMonth
          : '';
      const yearParam = !validMonth && selectedYear !== 'ALL' ? selectedYear : undefined;
      const [bankRes, pettyRes] = await Promise.all([
        FinanceService.listTransactions({
          account: 'BANK_DPW',
          year: yearParam,
          month: validMonth || undefined,
          sort: 'asc',
          limit: 1200,
        }),
        FinanceService.listTransactions({
          account: 'PETTY_CASH',
          year: yearParam,
          month: validMonth || undefined,
          sort: 'asc',
          limit: 1200,
        }),
      ]);
      const exportLabel =
        validMonth || (selectedYear === 'ALL' ? 'Semua_Periode' : `Tahun_${selectedYear}`);
      exportFinanceMonthlyReportExcel(
        summary,
        [...bankRes.items, ...pettyRes.items],
        exportLabel,
        { bank: bankRes.openingBalance, petty: pettyRes.openingBalance }
      );
      showToast(`Laporan 3-Sheet Excel (${exportLabel.replace(/_/g, ' ')}) berhasil diunduh`);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mengekspor Excel 3-Sheet'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const periodScopeLabel = focusedMonth
    ? formatMonthLabel(focusedMonth)
    : selectedYear === 'ALL'
    ? 'Semua Periode'
    : `Tahun ${selectedYear}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Bar Drill-Down Bulan di Dalam Tahun Terpilih (Default: Keseluruhan Tahun) */}
      <MonthDrilldownBar
        selectedYear={selectedYear}
        focusedMonth={focusedMonth}
        onSelectMonth={setFocusedMonth}
        months={drilldownMonths}
      />

      {/* 4 Mini-Card Rekonsiliasi Saldo & Mutasi Periode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Saldo Awal ({periodScopeLabel})
          </span>
          <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
            {formatRupiah(openingBalance)}
          </span>
          <span className="text-[10.5px] text-slate-400">
            {activeSheet === 'operational' ? 'Kas Operasional Kantor' : 'Rekening Bank DPW'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
            Total Pemasukan / Debit
          </span>
          <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
            + {formatRupiah(txStats.totalIn)}
          </span>
          <span className="text-[10.5px] text-emerald-700/80 dark:text-emerald-400/80">
            Dana masuk selama {periodScopeLabel}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block">
            Total Pengeluaran / Credit
          </span>
          <span className="text-base font-extrabold font-mono text-rose-700 dark:text-rose-300 mt-0.5 block">
            - {formatRupiah(txStats.totalOut)}
          </span>
          <span className="text-[10.5px] text-rose-700/80 dark:text-rose-400/80">
            Dana keluar selama {periodScopeLabel}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 block">
            Saldo Akhir ({periodScopeLabel})
          </span>
          <span className="text-base font-extrabold font-mono text-blue-700 dark:text-blue-300 mt-0.5 block">
            {formatRupiah(closingBalance)}
          </span>
          <span className="text-[10.5px] text-blue-700/80 dark:text-blue-400/80">
            Saldo Awal + Masuk − Keluar
          </span>
        </div>
      </div>

      {/* Toolbar Laporan Gaya 3-Sheet Excel */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 3 Sheet Tabs Persis Excel */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {[
              { id: 'saldo', label: 'Sheet 1: Saldo (Bank DPW)' },
              { id: 'pemasukkan', label: 'Sheet 2: Pemasukkan' },
              { id: 'operational', label: 'Sheet 3: Operational (Kas Kantor)' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSheet(s.id as ExcelSheetType)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeSheet === s.id
                    ? 'bg-[#1A3282] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-900/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowForms((v) => !v)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showForms
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pengeluaran / Tarik Dana</span>
              {showForms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportFullExcel}
              className="btn-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Export Excel 3-Sheet</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Filter Kategori & Pencarian Uraian */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
          >
            <option value="ALL">Semua Kategori ({categoryOptions.length})</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian transaksi / nama..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Collapsible Forms */}
      {showForms && (
        <CashbookActionForms
          summary={summary}
          onSuccess={async () => {
            await Promise.all([loadSheet(), onRefreshAll()]);
          }}
          showToast={showToast}
        />
      )}

      {/* Buku Kas Bergaya 3-Sheet Excel (Tahun Penuh dengan Pembatas Bulan atau Rincian Bulan) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat sheet buku kas...</span>
          </div>
        ) : (
          <ExcelLedgerSheet
            sheet={activeSheet}
            yearFilter={selectedYear}
            monthFilter={focusedMonth}
            transactions={transactions}
            openingBalance={openingBalance}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            onFocusMonth={setFocusedMonth}
            onDeleteTransaction={handleDeleteTx}
          />
        )}
      </div>
    </div>
  );
};
