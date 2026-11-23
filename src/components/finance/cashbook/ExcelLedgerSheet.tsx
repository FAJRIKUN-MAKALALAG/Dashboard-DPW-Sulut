import React, { useMemo } from 'react';
import { ArrowRight, ExternalLink, Lock, Trash2 } from 'lucide-react';
import { FinanceTransaction } from '../../../types/finance';
import { formatMonthLabel, formatRupiah } from '../financeHelpers';

export type ExcelSheetType = 'saldo' | 'pemasukkan' | 'operational';

interface ExcelLedgerSheetProps {
  sheet: ExcelSheetType;
  yearFilter: string;
  monthFilter: string;
  transactions: FinanceTransaction[];
  openingBalance: number;
  searchQuery?: string;
  categoryFilter?: string;
  onFocusMonth?: (ym: string) => void;
  onDeleteTransaction: (tx: FinanceTransaction) => void;
}

function renderLockLabel(lockReason?: FinanceTransaction['lockReason']): string {
  if (lockReason === 'DUES_PAYMENT') return 'Dari Iuran';
  if (lockReason === 'DPP_REMITTANCE') return 'Kirim DPP';
  if (lockReason === 'HISTORICAL') return 'Historis';
  return 'Terkunci';
}

function matchesSearchAndCategory(
  tx: FinanceTransaction,
  searchLower: string,
  categoryFilter: string
): boolean {
  if (categoryFilter && categoryFilter !== 'ALL' && tx.category.toLowerCase() !== categoryFilter.toLowerCase()) {
    return false;
  }
  if (searchLower) {
    const haystack = `${tx.description} ${tx.category} ${tx.txDate} ${tx.createdBy || ''}`.toLowerCase();
    if (!haystack.includes(searchLower)) return false;
  }
  return true;
}

export const ExcelLedgerSheet: React.FC<ExcelLedgerSheetProps> = ({
  sheet,
  yearFilter,
  monthFilter,
  transactions,
  openingBalance,
  searchQuery = '',
  categoryFilter = 'ALL',
  onFocusMonth,
  onDeleteTransaction,
}) => {
  const periodTitle = monthFilter
    ? `REKAP ${formatMonthLabel(monthFilter).toUpperCase()}`
    : yearFilter && yearFilter !== 'ALL'
    ? `KESELURUHAN TAHUN ${yearFilter}`
    : 'SELURUH PERIODE (2026–BERJALAN)';

  const openingLabel = monthFilter
    ? 'Sisa Saldo Bulan Lalu'
    : yearFilter && yearFilter !== 'ALL'
    ? `Sisa Saldo Akhir Tahun ${Number(yearFilter) - 1}`
    : 'Saldo Awal Pembukuan';

  const hasPeriodAnchor = Boolean(monthFilter || (yearFilter && yearFilter !== 'ALL'));
  const anchorDate = monthFilter ? `${monthFilter}-01` : `${yearFilter}-01-01`;
  const searchLower = searchQuery.trim().toLowerCase();
  const isFiltered = Boolean(searchLower || (categoryFilter && categoryFilter !== 'ALL'));
  const showMonthDividers = !monthFilter;

  const renderActionCell = (tx: FinanceTransaction) =>
    tx.canDelete ? (
      <button
        type="button"
        onClick={() => onDeleteTransaction(tx)}
        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
        title="Hapus transaksi manual"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
        <Lock className="w-3 h-3" /> {renderLockLabel(tx.lockReason)}
      </span>
    );

  const renderNotaCell = (tx: FinanceTransaction) =>
    tx.proofUrl ? (
      <a
        href={tx.proofUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[11px]"
      >
        <ExternalLink className="w-3 h-3" /> Nota
      </a>
    ) : (
      <span className="text-slate-300">-</span>
    );

  const renderMonthDividerRow = (ym: string, countInMonth: number, colSpan: number) => (
    <tr
      key={`divider-${ym}`}
      className="bg-slate-200/75 dark:bg-slate-800/90 border-y border-slate-300/80 dark:border-slate-700"
    >
      <td colSpan={colSpan} className="py-1.5 px-3">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-extrabold text-[#1A3282] dark:text-blue-300 uppercase tracking-wide">
            {formatMonthLabel(ym)} · {countInMonth} mutasi
          </span>
          {onFocusMonth && (
            <button
              type="button"
              onClick={() => onFocusMonth(ym)}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
            >
              <span>Cek Rincian {formatMonthLabel(ym)}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  // Hitung running balance SEBELUM filter pencarian agar kolom Saldo selalu presisi terhadap mutasi riil
  const saldoComputed = useMemo(() => {
    let running = openingBalance;
    let sumIn = 0;
    let sumOut = 0;
    const rows = transactions.map((tx, idx) => {
      const inAmt = tx.direction === 'IN' ? tx.amount : 0;
      const outAmt = tx.direction === 'OUT' ? tx.amount : 0;
      sumIn += inAmt;
      sumOut += outAmt;
      running += inAmt - outAmt;
      return { rowNo: idx + 1, ym: (tx.txDate || '').slice(0, 7), tx, inAmt, outAmt, runningAfter: running };
    });
    const visible = rows.filter((r) => matchesSearchAndCategory(r.tx, searchLower, categoryFilter));
    const countsByYm: Record<string, number> = {};
    for (const r of visible) {
      countsByYm[r.ym] = (countsByYm[r.ym] || 0) + 1;
    }
    return { rows, visible, countsByYm, finalRunning: running, sumIn, sumOut };
  }, [transactions, openingBalance, searchLower, categoryFilter]);

  const incomeComputed = useMemo(() => {
    const allIn = transactions.filter((t) => t.direction === 'IN');
    let acc = 0;
    const rows = allIn.map((tx, idx) => {
      acc += tx.amount;
      return { rowNo: idx + 1, ym: (tx.txDate || '').slice(0, 7), tx, accumulated: acc };
    });
    const visible = rows.filter((r) => matchesSearchAndCategory(r.tx, searchLower, categoryFilter));
    const countsByYm: Record<string, number> = {};
    for (const r of visible) {
      countsByYm[r.ym] = (countsByYm[r.ym] || 0) + 1;
    }
    return { rows, visible, countsByYm, totalIncome: acc };
  }, [transactions, searchLower, categoryFilter]);

  // ---------------- Sheet 1: SALDO (Rekening Bank DPW) ----------------
  if (sheet === 'saldo') {
    const visibleIn = saldoComputed.visible.reduce((s, r) => s + r.inAmt, 0);
    const visibleOut = saldoComputed.visible.reduce((s, r) => s + r.outAmt, 0);
    let lastRenderedYm = '';

    return (
      <div className="space-y-0">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white uppercase block">
              LAPORAN PEMASUKAN DAN PENGELUARAN — PARTAI NASDEM SULAWESI UTARA
            </span>
            <span className="text-[11px] text-slate-500">
              {periodTitle} (Rekening Bank DPW)
              {isFiltered &&
                ` · Menampilkan ${saldoComputed.visible.length} dari ${saldoComputed.rows.length} mutasi (Saldo berjalan tetap utuh)`}
            </span>
          </div>
          {hasPeriodAnchor && (
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              {openingLabel}: <strong>{formatRupiah(openingBalance)}</strong>
            </span>
          )}
        </div>

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#1A3282] text-white text-[10px] font-bold uppercase">
              <tr>
                <th className="py-2.5 px-2.5 text-center w-10">No</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Uraian</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Pemasukan</th>
                <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                <th className="py-2.5 px-3 text-right">Saldo</th>
                <th className="py-2.5 px-3 text-center">Nota</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {hasPeriodAnchor && !isFiltered && (
                <tr className="bg-blue-50/70 dark:bg-blue-950/25 font-bold">
                  <td className="py-2 px-2.5 text-center text-slate-400">•</td>
                  <td className="py-2 px-3 font-mono text-slate-500">{anchorDate}</td>
                  <td className="py-2 px-3 text-slate-900 dark:text-white">{openingLabel}</td>
                  <td className="py-2 px-3 text-slate-500">Saldo Awal</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                    {openingBalance > 0 ? formatRupiah(openingBalance) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    {openingBalance < 0 ? formatRupiah(Math.abs(openingBalance)) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatRupiah(openingBalance)}
                  </td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right text-[10px] text-slate-400">Otomatis</td>
                </tr>
              )}

              {saldoComputed.visible.map(({ rowNo, ym, tx, inAmt, outAmt, runningAfter }) => {
                const showDivider = showMonthDividers && ym && ym !== lastRenderedYm;
                if (ym) lastRenderedYm = ym;
                return (
                  <React.Fragment key={tx.id}>
                    {showDivider && renderMonthDividerRow(ym, saldoComputed.countsByYm[ym] || 0, 9)}
                    <tr className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/30 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 text-center font-mono text-[10.5px] text-slate-400">
                        {rowNo}
                      </td>
                      <td className="py-2 px-3 font-mono whitespace-nowrap">{tx.txDate}</td>
                      <td className="py-2 px-3 min-w-[230px]">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {tx.description}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-500">{tx.category}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {inAmt > 0 ? formatRupiah(inAmt) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {outAmt > 0 ? formatRupiah(outAmt) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(runningAfter)}
                      </td>
                      <td className="py-2 px-3 text-center">{renderNotaCell(tx)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">{renderActionCell(tx)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {saldoComputed.visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi Rekening Bank DPW yang cocok pada periode ini.
                  </td>
                </tr>
              )}

              <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-slate-700 dark:text-slate-200">
                  {isFiltered ? 'Total Mutasi Hasil Filter' : 'Total Mutasi Periode Ini & Saldo Akhir'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {formatRupiah(isFiltered ? visibleIn : saldoComputed.sumIn)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {formatRupiah(isFiltered ? visibleOut : saldoComputed.sumOut)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-300 whitespace-nowrap">
                  {formatRupiah(saldoComputed.finalRunning)}
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------------- Sheet 2: PEMASUKKAN ----------------
  if (sheet === 'pemasukkan') {
    const visibleSum = incomeComputed.visible.reduce((s, r) => s + r.tx.amount, 0);
    let lastRenderedYm = '';

    return (
      <div className="space-y-0">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white uppercase block">
              LAPORAN PEMASUKAN — PARTAI NASDEM SULAWESI UTARA
            </span>
            <span className="text-[11px] text-slate-500">
              {periodTitle} ({incomeComputed.visible.length} dari {incomeComputed.rows.length} entri uang masuk)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#1A3282] text-white text-[10px] font-bold uppercase">
              <tr>
                <th className="py-2.5 px-2.5 text-center w-10">No</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Uraian</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Pemasukan</th>
                <th className="py-2.5 px-3 text-right">Saldo Akumulasi</th>
                <th className="py-2.5 px-3 text-center">Nota</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {incomeComputed.visible.map(({ rowNo, ym, tx, accumulated }) => {
                const showDivider = showMonthDividers && ym && ym !== lastRenderedYm;
                if (ym) lastRenderedYm = ym;
                return (
                  <React.Fragment key={tx.id}>
                    {showDivider && renderMonthDividerRow(ym, incomeComputed.countsByYm[ym] || 0, 8)}
                    <tr className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-blue-50/30 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 text-center font-mono text-[10.5px] text-slate-400">
                        {rowNo}
                      </td>
                      <td className="py-2 px-3 font-mono whitespace-nowrap">{tx.txDate}</td>
                      <td className="py-2 px-3 min-w-[250px] font-medium text-slate-800 dark:text-slate-200">
                        {tx.description}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-500">{tx.category}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(accumulated)}
                      </td>
                      <td className="py-2 px-3 text-center">{renderNotaCell(tx)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">{renderActionCell(tx)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {incomeComputed.visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada pemasukan yang cocok pada periode ini.
                  </td>
                </tr>
              )}

              <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                  {isFiltered ? 'Total Pemasukan Hasil Filter' : 'Total Pemasukan Periode Ini'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {formatRupiah(isFiltered ? visibleSum : incomeComputed.totalIncome)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------------- Sheet 3: OPERATIONAL (Debit Penarikan vs Credit Pengeluaran) ----------------
  const allDebitTxs = transactions.filter((t) => t.direction === 'IN');
  const allCreditTxs = transactions.filter((t) => t.direction === 'OUT');
  const debitTxs = allDebitTxs.filter((tx) => matchesSearchAndCategory(tx, searchLower, categoryFilter));
  const creditTxs = allCreditTxs.filter((tx) => matchesSearchAndCategory(tx, searchLower, categoryFilter));

  const debitTotalAll = (hasPeriodAnchor ? openingBalance : 0) + allDebitTxs.reduce((s, t) => s + t.amount, 0);
  const creditTotalAll = allCreditTxs.reduce((s, t) => s + t.amount, 0);
  const endingOp = debitTotalAll - creditTotalAll;

  return (
    <div className="space-y-0">
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white uppercase block">
            LAPORAN PENGELUARAN OPERATIONAL — KANTOR DPW NASDEM SULAWESI UTARA
          </span>
          <span className="text-[11px] text-slate-500">
            Format Excel Debit (Penarikan DPW + {openingLabel}) vs Credit (Pengeluaran Kantor) · {periodTitle}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[60vh]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#1A3282] text-white text-[10px] font-bold uppercase">
            <tr>
              <th className="py-2.5 px-2.5 text-center w-10">No</th>
              <th className="py-2.5 px-3">Tanggal</th>
              <th className="py-2.5 px-3">Uraian</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3 text-right">Debit (Masuk)</th>
              <th className="py-2.5 px-3 text-right">Credit (Keluar)</th>
              <th className="py-2.5 px-3 text-center">Nota</th>
              <th className="py-2.5 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Bagian Debit / Dana Masuk Operasional */}
            <tr className="bg-blue-50/70 dark:bg-blue-950/30 font-bold text-blue-900 dark:text-blue-200">
              <td colSpan={8} className="py-1.5 px-3 text-[10.5px] uppercase tracking-wider">
                Bagian 1 — DEBIT ({openingLabel} &amp; Penarikan Uang DPW)
              </td>
            </tr>
            {hasPeriodAnchor && !isFiltered && (
              <tr className="bg-slate-50/70 dark:bg-slate-900 font-semibold">
                <td className="py-2 px-2.5 text-center text-slate-400">•</td>
                <td className="py-2 px-3 font-mono text-slate-500">{anchorDate}</td>
                <td className="py-2 px-3">{openingLabel} (Kas Operasional)</td>
                <td className="py-2 px-3 text-slate-500">Saldo Awal</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(openingBalance)}
                </td>
                <td className="py-2 px-3 text-right">-</td>
                <td className="py-2 px-3 text-center">-</td>
                <td className="py-2 px-3 text-right text-[10px] text-slate-400">Otomatis</td>
              </tr>
            )}
            {debitTxs.map((tx, i) => (
              <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-2 px-2.5 text-center font-mono text-[10.5px] text-slate-400">{i + 1}</td>
                <td className="py-2 px-3 font-mono whitespace-nowrap">{tx.txDate}</td>
                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                <td className="py-2 px-3 text-slate-500">{tx.category}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {formatRupiah(tx.amount)}
                </td>
                <td className="py-2 px-3 text-right">-</td>
                <td className="py-2 px-3 text-center">{renderNotaCell(tx)}</td>
                <td className="py-2 px-3 text-right whitespace-nowrap">{renderActionCell(tx)}</td>
              </tr>
            ))}
            <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
              <td colSpan={4} className="py-2 px-3 text-right">Total Debit Periode</td>
              <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                {formatRupiah(debitTotalAll)}
              </td>
              <td colSpan={3} />
            </tr>

            {/* Bagian Credit / Pengeluaran Operasional */}
            <tr className="bg-rose-50/70 dark:bg-rose-950/30 font-bold text-rose-900 dark:text-rose-200">
              <td colSpan={8} className="py-1.5 px-3 text-[10.5px] uppercase tracking-wider">
                Bagian 2 — CREDIT (Pengeluaran Operasional Kantor)
              </td>
            </tr>
            {creditTxs.map((tx, i) => (
              <tr
                key={tx.id}
                className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <td className="py-2 px-2.5 text-center font-mono text-[10.5px] text-slate-400">{i + 1}</td>
                <td className="py-2 px-3 font-mono whitespace-nowrap">{tx.txDate}</td>
                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                <td className="py-2 px-3 text-slate-500">{tx.category}</td>
                <td className="py-2 px-3 text-right">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {formatRupiah(tx.amount)}
                </td>
                <td className="py-2 px-3 text-center">{renderNotaCell(tx)}</td>
                <td className="py-2 px-3 text-right whitespace-nowrap">{renderActionCell(tx)}</td>
              </tr>
            ))}
            {creditTxs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  Belum ada pengeluaran operasional kantor yang cocok pada periode ini.
                </td>
              </tr>
            )}
            <tr className="bg-rose-50/50 dark:bg-rose-950/20 font-bold">
              <td colSpan={5} className="py-2 px-3 text-right">Total Pengeluaran (Credit)</td>
              <td className="py-2 px-3 text-right font-mono text-rose-700 dark:text-rose-300 whitespace-nowrap">
                {formatRupiah(isFiltered ? creditTxs.reduce((s, t) => s + t.amount, 0) : creditTotalAll)}
              </td>
              <td colSpan={2} />
            </tr>

            {/* Sisa Saldo Operasional */}
            <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold border-t-2 border-slate-300 dark:border-slate-700 text-sm">
              <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                Sisa Saldo Kas Operasional
              </td>
              <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-300 whitespace-nowrap">
                {formatRupiah(endingOp)}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
