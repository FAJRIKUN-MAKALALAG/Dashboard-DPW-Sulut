import XLSX from 'xlsx-js-style';
import {
  FinanceDppRemittance,
  FinanceMatrixResponse,
  FinanceSummary,
  FinanceTransaction,
} from '../types/finance';

const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '1A3282' } },
  alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  },
};

const subHeaderStyle = {
  font: { bold: true, color: { rgb: '0F172A' }, sz: 10 },
  fill: { fgColor: { rgb: 'E2E8F0' } },
  border: {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  },
};

function styleRowCells(ws: XLSX.WorkSheet, rowIdx: number, colCount: number, styleObj: any) {
  for (let c = 0; c < colCount; c++) {
    const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
    if (ws[ref]) {
      ws[ref].s = { ...(ws[ref].s || {}), ...styleObj };
    }
  }
}

export function exportFinanceMonthlyReportExcel(
  summary: FinanceSummary | null,
  transactions: FinanceTransaction[],
  monthLabel: string,
  openingBalances?: { bank?: number | null; petty?: number | null }
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan & Rekening Bank DPW
  const bankTxs = transactions
    .filter((t) => t.accountType === 'BANK_DPW')
    .sort((a, b) => (a.txDate || '').localeCompare(b.txDate || ''));

  const saldoRows: any[][] = [
    ['LAPORAN PEMASUKAN DAN PENGELUARAN REKENING BANK DPW'],
    ['PARTAI NASDEM PROVINSI SULAWESI UTARA'],
    [`Periode: ${monthLabel}`],
    ['TANGGAL', 'KATEGORI', 'URAIAN', 'PEMASUKAN (Rp)', 'PENGELUARAN (Rp)', 'SALDO BERJALAN (Rp)'],
  ];

  let runningBank = Number(openingBalances?.bank ?? 0);
  if (openingBalances?.bank !== undefined && openingBalances.bank !== null) {
    saldoRows.push(['-', 'Saldo Awal', `Sisa Saldo Bulan Sebelumnya`, openingBalances.bank, '', runningBank]);
  }
  for (const t of bankTxs) {
    const inAmt = t.direction === 'IN' ? t.amount : 0;
    const outAmt = t.direction === 'OUT' ? t.amount : 0;
    runningBank += inAmt - outAmt;
    saldoRows.push([t.txDate, t.category, t.description, inAmt || '', outAmt || '', runningBank]);
  }
  if (summary) {
    saldoRows.push([]);
    saldoRows.push(['RINGKASAN POSISI DANA SAAT INI', '', '', '', '', '']);
    saldoRows.push(['Saldo Rekening Bank DPW (Total)', '', '', summary.balances.bankBalance, '', '']);
    saldoRows.push(['Titipan Kewajiban Belum Dikirim ke DPP', '', '', '', summary.balances.pendingDppTotal, '']);
    saldoRows.push(['Kas Bersih Milik DPW (di Bank)', '', '', summary.balances.netDpwBankBalance, '', '']);
    saldoRows.push(['Saldo Kas Operasional Kantor (Petty Cash)', '', '', summary.balances.pettyCashBalance, '', '']);
  }

  const wsSaldo = XLSX.utils.aoa_to_sheet(saldoRows);
  wsSaldo['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 48 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  styleRowCells(wsSaldo, 3, 6, headerStyle);
  XLSX.utils.book_append_sheet(wb, wsSaldo, 'Saldo');

  // Sheet 2: Pemasukan Bank DPW
  const incomeTxs = bankTxs.filter((t) => t.direction === 'IN');
  const incomeRows: any[][] = [
    ['LAPORAN PEMASUKAN REKENING DPW'],
    ['PARTAI NASDEM PROVINSI SULAWESI UTARA'],
    [`Periode: ${monthLabel}`],
    ['TANGGAL', 'KATEGORI', 'URAIAN', 'PEMASUKAN (Rp)', 'AKUMULASI (Rp)', 'DICATAT OLEH'],
  ];
  let accIn = 0;
  for (const t of incomeTxs) {
    accIn += t.amount;
    incomeRows.push([t.txDate, t.category, t.description, t.amount, accIn, t.createdBy || '-']);
  }
  const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
  wsIncome['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 48 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  styleRowCells(wsIncome, 3, 6, headerStyle);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Pemasukkan');

  // Sheet 3: Kas Operasional Kantor
  const opTxs = transactions
    .filter((t) => t.accountType === 'PETTY_CASH')
    .sort((a, b) => (a.txDate || '').localeCompare(b.txDate || ''));
  const opRows: any[][] = [
    ['LAPORAN PENGELUARAN OPERASIONAL KANTOR'],
    ['DPW PARTAI NASDEM SULAWESI UTARA'],
    [`Periode: ${monthLabel}`],
    ['TANGGAL', 'KATEGORI', 'URAIAN', 'DEBIT / MASUK (Rp)', 'KREDIT / KELUAR (Rp)', 'SALDO KAS (Rp)'],
  ];
  let runOp = Number(openingBalances?.petty ?? 0);
  if (openingBalances?.petty !== undefined && openingBalances.petty !== null) {
    opRows.push(['-', 'Saldo Awal', `Sisa Saldo Operasional Bulan Sebelumnya`, openingBalances.petty, '', runOp]);
  }
  for (const t of opTxs) {
    const deb = t.direction === 'IN' ? t.amount : 0;
    const cred = t.direction === 'OUT' ? t.amount : 0;
    runOp += deb - cred;
    opRows.push([t.txDate, t.category, t.description, deb || '', cred || '', runOp]);
  }
  const wsOp = XLSX.utils.aoa_to_sheet(opRows);
  wsOp['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 46 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  styleRowCells(wsOp, 3, 6, headerStyle);
  XLSX.utils.book_append_sheet(wb, wsOp, 'Operational');

  XLSX.writeFile(wb, `LAPORAN_KEUANGAN_DPW_${monthLabel.replace(/\s+/g, '_')}.xlsx`);
}

export function exportFinanceMatrixExcel(matrix: FinanceMatrixResponse): void {
  const wb = XLSX.utils.book_new();
  const monthHeaders = matrix.months.map((m) => m.label);
  const totalCols = 5 + monthHeaders.length;

  const rows: any[][] = [
    [`MATRIKS IURAN ${matrix.kind} ANGGOTA DEWAN PARTAI NASDEM SULUT`],
    [`Periode: ${matrix.startMonth} s/d ${matrix.endMonth}`],
    ['NAMA ANGGOTA DEWAN', 'AUTODEBET / HISTORI', ...monthHeaders, 'TOTAL TAGIHAN (Rp)', 'TOTAL SETORAN (Rp)', 'SISA TUNGGAKAN (Rp)'],
  ];

  const subHeaderRowIndices: number[] = [];

  for (const grp of matrix.groups) {
    const tariffRowIdx = rows.length;
    subHeaderRowIndices.push(tariffRowIdx);
    const tariffCells = matrix.months.map((m) => grp.monthlyTariffs[m.ym] || 0);
    rows.push([
      `${grp.daerah.toUpperCase()} (${grp.legislators.length} org)`,
      grp.tingkat === 'PROVINSI' ? 'DPRD PROVINSI' : 'DPRD KAB/KOTA',
      ...tariffCells,
      grp.totals.totalBilled,
      grp.totals.totalPaid,
      grp.totals.debt,
    ]);

    for (const leg of grp.legislators) {
      const autoStatus = leg.isAutodebetActive
        ? `AUTODEBET (sejak ${leg.autodebetStartMonth || '-'})`
        : leg.autodebetEndMonth
        ? `Eks-Autodebet (${leg.autodebetStartMonth || '-'} s/d ${leg.autodebetEndMonth})`
        : 'Manual';

      const monthCells = matrix.months.map((m) => {
        const c = leg.cells[m.ym];
        if (!c || c.amount <= 0) return '';
        return c.method === 'AUTODEBET' ? `${c.amount} (AD)` : c.amount;
      });

      rows.push([
        leg.namaLengkap,
        autoStatus,
        ...monthCells,
        leg.totalBilled,
        leg.totalPaid,
        leg.balanceDelta,
      ]);
    }
  }

  rows.push([]);
  rows.push([
    'GRAND TOTAL KESELURUHAN',
    `${matrix.grandTotals.legislatorCount} Anggota`,
    ...matrix.months.map(() => ''),
    matrix.grandTotals.totalBilled,
    matrix.grandTotals.totalPaid,
    matrix.grandTotals.debt,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 28 },
    { wch: 28 },
    ...monthHeaders.map(() => ({ wch: 15 })),
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  styleRowCells(ws, 2, totalCols, headerStyle);
  for (const rIdx of subHeaderRowIndices) {
    styleRowCells(ws, rIdx, totalCols, subHeaderStyle);
  }

  XLSX.utils.book_append_sheet(wb, ws, `MATRIKS_${matrix.kind}`);
  XLSX.writeFile(wb, `MATRIKS_IURAN_${matrix.kind}_${matrix.startMonth}_sd_${matrix.endMonth}.xlsx`);
}

export function exportDppRemittancesExcel(remittances: FinanceDppRemittance[]): void {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [
    ['RIWAYAT PENGIRIMAN KEWAJIBAN IURAN KE DPP PARTAI NASDEM'],
    ['DPW SULAWESI UTARA'],
    ['NO', 'TANGGAL KIRIM', 'PERIODE', 'JUMLAH ITEM', 'POKOK DPP (Rp)', 'BIAYA ADMIN (Rp)', 'TOTAL TRANSFER (Rp)', 'NO. REFERENSI', 'STATUS', 'DICATAT OLEH'],
  ];

  remittances.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.remittanceDate,
      r.periodLabel,
      r.itemCount,
      r.totalDppAmount,
      r.bankFee,
      r.totalTransferred,
      r.referenceNo || '-',
      r.isHistorical ? 'Historis Migrasi Excel' : 'Terkirim ke DPP',
      r.createdBy || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
  ];
  styleRowCells(ws, 2, 10, headerStyle);
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat_Kirim_DPP');
  XLSX.writeFile(wb, `RIWAYAT_SETORAN_DPP_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface ReconciliationExportRow {
  namaLengkap: string;
  tingkat: string;
  daerah: string;
  statusLabel: string;
  methodLabel: string;
  totalBilled: number;
  totalPaid: number;
  debt: number;
  overpaid: number;
  unpaidMonthCount: number;
  unpaidMonthsText: string;
  paidMonthCount: number;
  paidMonthsText: string;
}

export function exportReconciliationStatusExcel(
  kind: 'DPW' | 'DPP',
  scopeLabel: string,
  rows: ReconciliationExportRow[]
): void {
  const wb = XLSX.utils.book_new();
  const dataRows: any[][] = [
    [`RINCIAN STATUS REKONSILIASI ANGGOTA — IURAN ${kind} PARTAI NASDEM SULUT`],
    [`Periode / Cakupan: ${scopeLabel}`],
    [
      'NO',
      'NAMA ANGGOTA',
      'TINGKAT',
      'DAERAH',
      'STATUS',
      'METODE',
      'TOTAL TAGIHAN (Rp)',
      'TOTAL SETORAN (Rp)',
      'TOTAL TUNGGAKAN (Rp)',
      'JML BLN MENUNGGAK',
      'BULAN-BULAN MENUNGGAK',
      'BULAN-BULAN LUNAS',
    ],
  ];

  let sumBilled = 0;
  let sumPaid = 0;
  let sumDebt = 0;

  rows.forEach((r, idx) => {
    sumBilled += r.totalBilled;
    sumPaid += r.totalPaid;
    sumDebt += r.debt;
    dataRows.push([
      idx + 1,
      r.namaLengkap,
      r.tingkat === 'PROVINSI' ? 'DPRD Provinsi' : 'DPRD Kab/Kota',
      r.daerah,
      r.statusLabel,
      r.methodLabel,
      r.totalBilled,
      r.totalPaid,
      r.debt,
      r.unpaidMonthCount,
      r.unpaidMonthsText || '-',
      r.paidMonthsText || '-',
    ]);
  });

  dataRows.push([]);
  dataRows.push([
    '',
    'GRAND TOTAL',
    '',
    `${rows.length} Anggota`,
    '',
    '',
    sumBilled,
    sumPaid,
    sumDebt,
    '',
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 44 },
    { wch: 40 },
  ];
  styleRowCells(ws, 2, 12, headerStyle);
  XLSX.utils.book_append_sheet(wb, ws, 'Status_Rekonsiliasi');
  const safeScope = scopeLabel.replace(/[^a-zA-Z0-9_-]+/g, '_');
  XLSX.writeFile(wb, `REKONSILIASI_ANGGOTA_${kind}_${safeScope}.xlsx`);
}


export function exportDpwExpensesExcel(
  items: FinanceTransaction[],
  byCategory: { category: string; total: number; bankTotal: number; pettyTotal: number; count: number }[],
  byMonth: { ym: string; total: number; bankTotal: number; pettyTotal: number; count: number }[],
  periodLabel: string
): void {
  const wb = XLSX.utils.book_new();

  const detailRows: any[][] = [
    ['LAPORAN RIWAYAT PENGELUARAN RIIL DPW PARTAI NASDEM SULAWESI UTARA'],
    [`Periode / Filter: ${periodLabel}`],
    ['NO', 'TANGGAL', 'SUMBER DANA', 'KATEGORI', 'URAIAN / KETERANGAN', 'NOMINAL (Rp)', 'DICATAT OLEH'],
  ];

  const sortedItems = [...items].sort((a, b) => (a.txDate || '').localeCompare(b.txDate || ''));
  let grandTotal = 0;
  let bankSum = 0;
  let pettySum = 0;

  sortedItems.forEach((tx, idx) => {
    const amt = Number(tx.amount || 0);
    grandTotal += amt;
    if (tx.accountType === 'BANK_DPW') bankSum += amt;
    else pettySum += amt;
    detailRows.push([
      idx + 1,
      tx.txDate || '-',
      tx.accountType === 'BANK_DPW' ? 'Rekening Bank DPW' : 'Kas Operasional Kantor',
      tx.category || 'Operasional Kantor',
      tx.description || '-',
      amt,
      tx.createdBy || '-',
    ]);
  });

  detailRows.push([]);
  detailRows.push(['', '', 'TOTAL REKENING BANK DPW', '', '', bankSum, '']);
  detailRows.push(['', '', 'TOTAL KAS OPERASIONAL KANTOR', '', '', pettySum, '']);
  detailRows.push(['', '', 'GRAND TOTAL PENGELUARAN DPW', `${sortedItems.length} transaksi`, '', grandTotal, '']);

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 28 },
    { wch: 46 },
    { wch: 20 },
    { wch: 22 },
  ];
  styleRowCells(wsDetail, 2, 7, headerStyle);
  styleRowCells(wsDetail, detailRows.length - 1, 7, subHeaderStyle);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Riwayat_Pengeluaran');

  const summaryRows: any[][] = [
    ['REKAP PENGELUARAN DPW PER KATEGORI'],
    [`Periode / Filter: ${periodLabel}`],
    ['KATEGORI', 'JML TRANSAKSI', 'DARI KAS OPERASIONAL (Rp)', 'DARI BANK DPW (Rp)', 'TOTAL (Rp)'],
  ];
  byCategory.forEach((c) => {
    summaryRows.push([c.category, c.count, c.pettyTotal, c.bankTotal, c.total]);
  });
  summaryRows.push(['TOTAL', sortedItems.length, pettySum, bankSum, grandTotal]);

  summaryRows.push([]);
  summaryRows.push(['REKAP PENGELUARAN DPW PER BULAN']);
  const monthHeaderIdx = summaryRows.length;
  summaryRows.push(['BULAN (YYYY-MM)', 'JML TRANSAKSI', 'DARI KAS OPERASIONAL (Rp)', 'DARI BANK DPW (Rp)', 'TOTAL (Rp)']);
  byMonth.forEach((m) => {
    summaryRows.push([m.ym, m.count, m.pettyTotal, m.bankTotal, m.total]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 26 }, { wch: 24 }, { wch: 22 }];
  styleRowCells(wsSummary, 2, 5, headerStyle);
  styleRowCells(wsSummary, monthHeaderIdx, 5, headerStyle);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekap_Kategori_Bulan');

  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9_-]+/g, '_');
  XLSX.writeFile(wb, `PENGELUARAN_DPW_${safePeriod}.xlsx`);
}
