import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { FinanceService } from '../../services';
import {
  FinanceExpenseCategoryBreakdown,
  FinanceExpenseMonthBreakdown,
  FinanceSummary,
  FinanceTransaction,
} from '../../types/finance';
import { exportDpwExpensesExcel } from '../../utils/financeExportUtils';
import {
  FINANCE_CATEGORIES,
  formatMonthLabel,
  formatRupiah,
  getMonthOptionsForYear,
  getTodayIsoDate,
  readImageAsDataUrl,
} from './financeHelpers';
import { MonthDrilldownBar, MonthDrilldownOption } from './shared/MonthDrilldownBar';

interface FinanceExpensesTabProps {
  summary: FinanceSummary;
  selectedYear: string;
  focusedMonth: string;
  setFocusedMonth: (ym: string) => void;
  refreshKey: number;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

const EXPENSE_CATEGORIES = FINANCE_CATEGORIES.filter(
  (c) => c !== 'Bunga Bank' && c !== 'Pemasukan Lain-Lain'
);

export const FinanceExpensesTab: React.FC<FinanceExpensesTabProps> = ({
  summary,
  selectedYear,
  focusedMonth,
  setFocusedMonth,
  refreshKey,
  onRefreshAll,
  showToast,
}) => {
  // Daftar transaksi pengeluaran dari API
  const [items, setItems] = useState<FinanceTransaction[]>([]);
  const [byCategory, setByCategory] = useState<FinanceExpenseCategoryBreakdown[]>([]);
  const [byMonth, setByMonth] = useState<FinanceExpenseMonthBreakdown[]>([]);
  const [expenseTotals, setExpenseTotals] = useState({
    totalExpense: 0,
    bankExpense: 0,
    pettyExpense: 0,
    count: 0,
  });
  const [monthCountsByYm, setMonthCountsByYm] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter tampilan riwayat
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'PETTY_CASH' | 'BANK_DPW'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Form Input Pengeluaran DPW (selalu tampil di atas)
  const [formAccount, setFormAccount] = useState<'PETTY_CASH' | 'BANK_DPW'>('PETTY_CASH');
  const [formDate, setFormDate] = useState<string>(() => getTodayIsoDate());
  const [formCategory, setFormCategory] = useState<string>(EXPENSE_CATEGORIES[0] || 'Operasional Kantor');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formProofUrl, setFormProofUrl] = useState<string>('');
  const [formProofName, setFormProofName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form ringkas Tarik Dana Bank -> Kas Operasional (top-up petty cash)
  const [showTransferDrawer, setShowTransferDrawer] = useState(false);
  const [xferAmount, setXferAmount] = useState<string>('');
  const [xferDate, setXferDate] = useState<string>(() => getTodayIsoDate());
  const [xferDesc, setXferDesc] = useState<string>('Penarikan dana dari Bank DPW ke Kas Operasional');
  const [isTransferring, setIsTransferring] = useState(false);

  // Hapus & preview bukti
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewProof, setPreviewProof] = useState<{ src: string; title: string } | null>(null);

  // Reset badge hitungan bulan saat tahun berganti
  useEffect(() => {
    setMonthCountsByYm({});
    setCategoryFilter('ALL');
  }, [selectedYear]);

  // Sinkronkan tanggal default form saat user men-klik drill-down bulan
  useEffect(() => {
    if (!focusedMonth) return;
    const today = getTodayIsoDate();
    if (today.startsWith(`${focusedMonth}-`)) {
      setFormDate(today);
    } else {
      setFormDate(`${focusedMonth}-01`);
    }
  }, [focusedMonth]);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const validMonth =
        focusedMonth &&
        (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
          ? focusedMonth
          : '';
      const activeYearParam = !validMonth && selectedYear !== 'ALL' ? selectedYear : undefined;

      const res = await FinanceService.listTransactions({
        expenseOnly: true,
        year: activeYearParam,
        month: validMonth || undefined,
        sort: sortOrder,
        limit: 1500,
      });

      setItems(res.items || []);
      setByCategory(res.byCategory || []);
      setByMonth(res.byMonth || []);
      setExpenseTotals(
        res.expenseTotals || {
          totalExpense: res.summary?.totalOut || 0,
          bankExpense: 0,
          pettyExpense: 0,
          count: (res.items || []).length,
        }
      );

      if (!validMonth) {
        const counts: Record<string, number> = {};
        for (const t of res.items || []) {
          const ym = (t.txDate || '').slice(0, 7);
          if (ym) counts[ym] = (counts[ym] || 0) + 1;
        }
        setMonthCountsByYm(counts);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memuat data pengeluaran DPW'}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, focusedMonth, sortOrder, showToast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, refreshKey]);

  const monthOptions: MonthDrilldownOption[] = useMemo(() => {
    const base = getMonthOptionsForYear(selectedYear);
    return base.map((m) => ({
      ym: m.ym,
      label: m.label,
      badge: monthCountsByYm[m.ym] ? `${monthCountsByYm[m.ym]} item` : undefined,
    }));
  }, [selectedYear, monthCountsByYm]);

  // Filter item di sisi klien agar chip kategori & sumber dana tetap muncul semua
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((tx) => {
      if (accountFilter !== 'ALL' && tx.accountType !== accountFilter) return false;
      if (
        categoryFilter !== 'ALL' &&
        (tx.category || 'Operasional Kantor').toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (q) {
        const haystack = `${tx.description || ''} ${tx.category || ''} ${tx.createdBy || ''} ${tx.txDate || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, accountFilter, categoryFilter, searchQuery]);

  // Rekap per bulan hasil filter untuk divider & tabel ringkas per bulan
  const groupedByMonth = useMemo(() => {
    const map = new Map<
      string,
      {
        ym: string;
        label: string;
        total: number;
        bankTotal: number;
        pettyTotal: number;
        rows: FinanceTransaction[];
      }
    >();

    for (const tx of filteredItems) {
      const ym = (tx.txDate || '').slice(0, 7) || 'TANPA-BULAN';
      let bucket = map.get(ym);
      if (!bucket) {
        bucket = {
          ym,
          label: ym !== 'TANPA-BULAN' ? formatMonthLabel(ym) : 'Tanpa Tanggal',
          total: 0,
          bankTotal: 0,
          pettyTotal: 0,
          rows: [],
        };
        map.set(ym, bucket);
      }
      const amt = Number(tx.amount || 0);
      bucket.total += amt;
      if (tx.accountType === 'BANK_DPW') bucket.bankTotal += amt;
      else bucket.pettyTotal += amt;
      bucket.rows.push(tx);
    }

    return Array.from(map.values());
  }, [filteredItems]);

  const filteredTotals = useMemo(() => {
    let total = 0;
    let bank = 0;
    let petty = 0;
    for (const tx of filteredItems) {
      const amt = Number(tx.amount || 0);
      total += amt;
      if (tx.accountType === 'BANK_DPW') bank += amt;
      else petty += amt;
    }
    return { total, bank, petty, count: filteredItems.length };
  }, [filteredItems]);

  // Bandingkan Pendapatan Iuran Hak DPW vs Pengeluaran Riil DPW untuk cakupan aktif
  const dpwComparison = useMemo(() => {
    const activeYm =
      focusedMonth &&
      (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
        ? focusedMonth
        : '';

    let dpwPaid = 0;
    let scopeLabel =
      selectedYear === 'ALL' ? 'Semua Periode' : `Tahun ${selectedYear}`;

    if (activeYm) {
      const mRow = (summary.monthlyBreakdown || []).find((m) => m.ym === activeYm);
      dpwPaid = mRow ? mRow.dpwPaid : 0;
      scopeLabel = formatMonthLabel(activeYm);
    } else if (selectedYear !== 'ALL' && summary.periodMetrics) {
      dpwPaid = summary.periodMetrics.dpwPaid;
    } else {
      dpwPaid = summary.balances.totalCollectedDpw;
    }

    const surplus = dpwPaid - expenseTotals.totalExpense;
    const ratioPct =
      dpwPaid > 0 ? Math.round((expenseTotals.totalExpense / dpwPaid) * 1000) / 10 : 0;

    return { dpwPaid, surplus, ratioPct, scopeLabel };
  }, [summary, selectedYear, focusedMonth, expenseTotals.totalExpense]);

  const parsedFormAmount = useMemo(() => {
    const digits = formAmount.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }, [formAmount]);

  const parsedXferAmount = useMemo(() => {
    const digits = xferAmount.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }, [xferAmount]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setFormProofUrl(dataUrl);
      setFormProofName(file.name);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal membaca file bukti'}`);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFormAmount <= 0) {
      showToast('⚠️ Nominal pengeluaran harus lebih dari Rp 0');
      return;
    }
    if (!formDesc.trim()) {
      showToast('⚠️ Uraian / keterangan pengeluaran wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await FinanceService.createTransaction({
        accountType: formAccount,
        direction: 'OUT',
        category: formCategory,
        description: formDesc.trim(),
        amount: parsedFormAmount,
        txDate: formDate,
        proofUrl: formProofUrl || undefined,
      });

      const recordedAmt = parsedFormAmount;
      setFormAmount('');
      setFormDesc('');
      setFormProofUrl('');
      setFormProofName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      showToast(`✅ Pengeluaran DPW sebesar ${formatRupiah(recordedAmt)} berhasil disimpan`);
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menyimpan pengeluaran DPW'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedXferAmount <= 0) {
      showToast('⚠️ Nominal penarikan dana harus lebih dari Rp 0');
      return;
    }
    setIsTransferring(true);
    try {
      await FinanceService.transferBankToPetty({
        amount: parsedXferAmount,
        txDate: xferDate,
        description: xferDesc.trim() || 'Penarikan dana ke Kas Operasional Kantor',
      });
      showToast(
        `✅ Penarikan ${formatRupiah(parsedXferAmount)} dari Bank DPW ke Kas Operasional berhasil dicatat`
      );
      setXferAmount('');
      setShowTransferDrawer(false);
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mencatat penarikan ke Kas Operasional'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteExpense = async (tx: FinanceTransaction) => {
    setDeletingId(tx.id);
    try {
      await FinanceService.deleteTransaction(tx.id);
      setConfirmDeleteId(null);
      showToast(`🗑️ Pengeluaran "${tx.description}" berhasil dihapus`);
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menghapus pengeluaran'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportExcel = () => {
    const validMonth =
      focusedMonth &&
      (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
        ? focusedMonth
        : '';
    const periodLabel = validMonth
      ? formatMonthLabel(validMonth)
      : selectedYear === 'ALL'
      ? 'Semua_Periode'
      : `Tahun_${selectedYear}`;

    const catMap = new Map<string, FinanceExpenseCategoryBreakdown>();
    const moMap = new Map<string, FinanceExpenseMonthBreakdown>();
    for (const tx of filteredItems) {
      const amt = Number(tx.amount || 0);
      const cat = (tx.category || 'Operasional Kantor').trim() || 'Operasional Kantor';
      const cEntry = catMap.get(cat) || {
        category: cat,
        total: 0,
        bankTotal: 0,
        pettyTotal: 0,
        count: 0,
      };
      cEntry.total += amt;
      cEntry.count += 1;
      if (tx.accountType === 'BANK_DPW') cEntry.bankTotal += amt;
      else cEntry.pettyTotal += amt;
      catMap.set(cat, cEntry);

      const ym = (tx.txDate || '').slice(0, 7);
      if (ym) {
        const mEntry = moMap.get(ym) || { ym, total: 0, bankTotal: 0, pettyTotal: 0, count: 0 };
        mEntry.total += amt;
        mEntry.count += 1;
        if (tx.accountType === 'BANK_DPW') mEntry.bankTotal += amt;
        else mEntry.pettyTotal += amt;
        moMap.set(ym, mEntry);
      }
    }

    const catList = Array.from(catMap.values()).sort((a, b) => b.total - a.total);
    const moList = Array.from(moMap.values()).sort((a, b) => a.ym.localeCompare(b.ym));
    exportDpwExpensesExcel(filteredItems, catList, moList, periodLabel);
    showToast(`📊 File Excel Pengeluaran DPW (${periodLabel}) berhasil diunduh`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Bar Drill-Down Per Bulan di Dalam Tahun Aktif */}
      <MonthDrilldownBar
        selectedYear={selectedYear}
        focusedMonth={focusedMonth}
        onSelectMonth={setFocusedMonth}
        months={monthOptions}
        allLabel={selectedYear === 'ALL' ? 'Semua Bulan' : `Setahun Penuh ${selectedYear}`}
      />

      {/* 4 KPI Ringkas Pengeluaran DPW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 mb-1">
            <span className="font-bold">Total Pengeluaran DPW</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 block">
            {formatRupiah(expenseTotals.totalExpense)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {dpwComparison.scopeLabel} · {expenseTotals.count} transaksi keluar (non-DPP)
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Dari Kas Operasional Kantor</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white block">
            {formatRupiah(expenseTotals.pettyExpense)}
          </span>
          <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 mt-1 block">
            Sisa Kas Ops saat ini: {formatRupiah(summary.balances.pettyCashBalance)}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Langsung dari Rekening Bank DPW</span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white block">
            {formatRupiah(expenseTotals.bankExpense)}
          </span>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-1 block">
            Di luar transfer DPP &amp; tarik kas ops
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-2xs ${
            dpwComparison.surplus >= 0
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/15'
              : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
            <span className="font-bold">Surplus Iuran DPW vs Keluar</span>
            <TrendingUp
              className={`w-4 h-4 ${
                dpwComparison.surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
          </div>
          <span
            className={`text-lg sm:text-xl font-extrabold font-mono block ${
              dpwComparison.surplus >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {dpwComparison.surplus >= 0 ? '+' : ''}
            {formatRupiah(dpwComparison.surplus)}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Hak DPW {formatRupiah(dpwComparison.dpwPaid)} ({dpwComparison.ratioPct}% terpakai)
          </span>
        </div>
      </div>

      {/* FORM INPUT PENGELUARAN DPW (Selalu Terlihat & Siap Pakai) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A3282] text-amber-300 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Form Input Pengeluaran DPW
              </h3>
              <p className="text-[11px] text-slate-500">
                Catat biaya operasional kantor, gaji staf, utilitas, kegiatan, atau biaya admin bank. Setoran ke DPP dikelola di Tab 3.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTransferDrawer((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
              showTransferDrawer
                ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Tarik Dana Bank &rarr; Kas Operasional</span>
          </button>
        </div>

        {/* Drawer Opsional: Mutasi Internal Bank DPW -> Kas Operasional */}
        {showTransferDrawer && (
          <form
            onSubmit={handleSubmitTransfer}
            className="px-4 py-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/80 dark:border-amber-900/50 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Isi Saldo Kas Operasional dari Rekening Bank DPW (Mutasi Internal — Tidak Dihitung Sebagai Beban Pengeluaran)
              </span>
              <button
                type="button"
                onClick={() => setShowTransferDrawer(false)}
                className="p-1 rounded-lg hover:bg-amber-200/50 text-amber-800 dark:text-amber-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-3">
                <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Tanggal Penarikan
                </label>
                <input
                  type="date"
                  value={xferDate}
                  onChange={(e) => setXferDate(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nominal Tarik (Rp) {parsedXferAmount > 0 ? `· ${formatRupiah(parsedXferAmount)}` : ''}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={xferAmount}
                  onChange={(e) => setXferAmount(e.target.value)}
                  placeholder="Contoh: 5000000"
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Catatan Mutasi
                </label>
                <input
                  type="text"
                  value={xferDesc}
                  onChange={(e) => setXferDesc(e.target.value)}
                  placeholder="Penarikan dana ke Kas Operasional"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="w-full px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isTransferring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Tarik Kas</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <form onSubmit={handleSubmitExpense} className="p-4 space-y-3">
          {/* Baris 1: Sumber Dana + Tanggal + Kategori + Nominal */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Sumber Dana Pengeluaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormAccount('PETTY_CASH')}
                  className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    formAccount === 'PETTY_CASH'
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-extrabold block">Kas Operasional</span>
                  <span className="text-[10px] font-mono opacity-80 block truncate">
                    {formatRupiah(summary.balances.pettyCashBalance)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormAccount('BANK_DPW')}
                  className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    formAccount === 'BANK_DPW'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-extrabold block">Bank DPW (Hak DPW)</span>
                  <span className="text-[10px] font-mono opacity-80 block truncate">
                    {formatRupiah(summary.balances.netDpwBankBalance)}
                  </span>
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Kategori Pengeluaran
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Nominal (Rp){' '}
                {parsedFormAmount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-mono">
                    &bull; {formatRupiah(parsedFormAmount)}
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Contoh: 750000"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Baris 2: Uraian + Upload Bukti + Tombol Simpan */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Uraian / Keterangan Pengeluaran
              </label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Contoh: Tagihan listrik kantor DPW, Gaji Satpam, Pembelian ATK rapat..."
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Lampiran Kwitansi / Nota (Opsional)
              </label>
              <div className="flex items-center gap-1.5">
                <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 cursor-pointer truncate">
                  <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{formProofName || 'Pilih Foto / Nota...'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {formProofUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormProofUrl('');
                      setFormProofName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="Hapus lampiran"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#0F2460] disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-amber-300" />
                    <span>Catat Pengeluaran DPW</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* RINGKASAN PER BULAN DALAM TAHUN TERPILIH (Jika > 1 bulan dan tidak difokuskan ke 1 bulan) */}
      {!focusedMonth && byMonth.length > 1 && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Ringkasan Pengeluaran DPW Per Bulan ({selectedYear === 'ALL' ? 'Semua Tahun' : `Tahun ${selectedYear}`})
            </h4>
            <span className="text-[11px] text-slate-400">
              Klik bulan untuk memeriksa rincian transaksi bulan tersebut
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {byMonth.map((m) => (
              <button
                key={m.ym}
                type="button"
                onClick={() => setFocusedMonth(m.ym)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {formatMonthLabel(m.ym)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{m.count}x</span>
                </div>
                <span className="text-xs font-extrabold font-mono text-rose-600 dark:text-rose-400 block mt-1">
                  {formatRupiah(m.total)}
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 block truncate mt-0.5">
                  Ops {formatRupiah(m.pettyTotal)} · Bank {formatRupiah(m.bankTotal)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RIWAYAT PENGELUARAN DPW + CHIP KATEGORI + EXPORT */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>Riwayat Pengeluaran DPW ({filteredTotals.count} Transaksi)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Menampilkan pengeluaran riil dari Kas Operasional Kantor &amp; Rekening Bank DPW (tidak termasuk Setoran ke DPP dan mutasi internal kas).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari uraian / kategori..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-48 sm:w-56"
                />
              </div>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value as 'ALL' | 'PETTY_CASH' | 'BANK_DPW')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">Semua Sumber Dana</option>
                <option value="PETTY_CASH">Kas Operasional Kantor</option>
                <option value="BANK_DPW">Rekening Bank DPW</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="desc">Terbaru Dulu</option>
                <option value="asc">Terlama Dulu</option>
              </select>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredItems.length === 0}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Filter Chip Kategori */}
          {byCategory.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#1A3282] border-[#1A3282] text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Semua Kategori ({expenseTotals.count} &bull; {formatRupiah(expenseTotals.totalExpense)})
              </button>

              {byCategory.map((c) => {
                const isActive = categoryFilter.toLowerCase() === c.category.toLowerCase();
                return (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => setCategoryFilter(isActive ? 'ALL' : c.category)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 border-rose-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300'
                    }`}
                  >
                    {c.category} ({c.count} &bull; {formatRupiah(c.total)})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabel Riwayat Dikelompokkan Per Bulan */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat riwayat pengeluaran DPW...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              Belum ada catatan pengeluaran DPW pada filter / periode ini.
            </p>
            <p className="text-[11px] text-slate-400">
              Gunakan Form Input Pengeluaran DPW di atas untuk mencatat pengeluaran baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/95 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10">No</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3">Sumber Dana</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Uraian Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 text-center">Bukti</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(() => {
                  let rowCounter = 0;
                  return groupedByMonth.map((group) => (
                    <React.Fragment key={group.ym}>
                      <tr className="bg-slate-100/90 dark:bg-slate-800/70 border-y border-slate-200 dark:border-slate-700">
                        <td colSpan={5} className="py-2 px-3 font-extrabold text-slate-800 dark:text-slate-100">
                          <span>{group.label}</span>
                          <span className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400 ml-2">
                            ({group.rows.length} transaksi &bull; Kas Ops: {formatRupiah(group.pettyTotal)} &bull; Bank: {formatRupiah(group.bankTotal)})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                          {formatRupiah(group.total)}
                        </td>
                        <td colSpan={2} />
                      </tr>

                      {group.rows.map((tx) => {
                        rowCounter += 1;
                        const isConfirming = confirmDeleteId === tx.id;
                        const isDeleting = deletingId === tx.id;

                        return (
                          <tr
                            key={tx.id}
                            className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-rose-50/30 dark:hover:bg-slate-800/40"
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-400">{rowCounter}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {tx.txDate || '-'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {tx.accountType === 'BANK_DPW' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                  Bank DPW
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                  Kas Operasional
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                {tx.category || 'Operasional Kantor'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 max-w-md">
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {tx.description}
                              </span>
                              {tx.createdBy && (
                                <span className="text-[10px] text-slate-400 block">
                                  Dicatat oleh: {tx.createdBy}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              - {formatRupiah(tx.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {tx.proofUrl ? (
                                tx.proofUrl.startsWith('data:image') ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewProof({
                                        src: tx.proofUrl!,
                                        title: `${tx.txDate || ''} — ${tx.description}`,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-semibold text-blue-700 dark:text-blue-300 cursor-pointer"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Lihat</span>
                                  </button>
                                ) : (
                                  <a
                                    href={tx.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-semibold text-blue-700 dark:text-blue-300"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Nota</span>
                                  </a>
                                )
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {tx.canDelete ? (
                                isConfirming ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExpense(tx)}
                                      disabled={isDeleting}
                                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                                    >
                                      {isDeleting ? '...' : 'Yakin Hapus'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-1.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(tx.id)}
                                    title="Hapus transaksi pengeluaran"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-400">Terkunci</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-[#0F2460] text-white font-extrabold border-t-2 border-amber-400">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3">
                    <span>GRAND TOTAL PENGELUARAN DPW (FILTER AKTIF)</span>
                    <span className="text-[10.5px] font-normal text-blue-200 ml-2">
                      {filteredTotals.count} transaksi · Kas Ops: {formatRupiah(filteredTotals.petty)} · Bank DPW: {formatRupiah(filteredTotals.bank)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-300 whitespace-nowrap">
                    {formatRupiah(filteredTotals.total)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal Preview Foto Nota / Kwitansi */}
      {previewProof && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewProof(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-4 space-y-3 border border-slate-200 dark:border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {previewProof.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewProof.src}
              alt={previewProof.title}
              className="w-full max-h-[70vh] object-contain rounded-xl bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};
