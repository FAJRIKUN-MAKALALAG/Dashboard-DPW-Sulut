import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, Plus, Upload } from 'lucide-react';
import { FinanceService } from '../../../services';
import { FinanceSummary } from '../../../types/finance';
import {
  FINANCE_CATEGORIES,
  formatRupiah,
  getTodayIsoDate,
  readImageAsDataUrl,
} from '../financeHelpers';

interface CashbookActionFormsProps {
  summary: FinanceSummary;
  onSuccess: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const CashbookActionForms: React.FC<CashbookActionFormsProps> = ({
  summary,
  onSuccess,
  showToast,
}) => {
  // Transfer Bank -> Kas Operasional
  const [xferAmount, setXferAmount] = useState('');
  const [xferDate, setXferDate] = useState(getTodayIsoDate());
  const [xferDesc, setXferDesc] = useState('Penarikan Dana dari Bank ke Kas Operasional DPW');
  const [isTransferring, setIsTransferring] = useState(false);

  // Manual Operational / Bank Mutasi Entry
  const [txAccount, setTxAccount] = useState<'PETTY_CASH' | 'BANK_DPW'>('PETTY_CASH');
  const [txDirection, setTxDirection] = useState<'OUT' | 'IN'>('OUT');
  const [txCategory, setTxCategory] = useState('Operasional Kantor');
  const [txDate, setTxDate] = useState(getTodayIsoDate());
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txProof, setTxProof] = useState('');
  const [isSavingTx, setIsSavingTx] = useState(false);

  const handleTransferToPetty = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(xferAmount || 0);
    if (amt <= 0) {
      showToast('⚠️ Nominal penarikan dana harus > 0');
      return;
    }
    setIsTransferring(true);
    try {
      await FinanceService.transferBankToPetty({
        amount: amt,
        txDate: xferDate,
        description: xferDesc,
      });
      showToast(`Dana ${formatRupiah(amt)} ditarik dari Bank DPW ke Kas Operasional`);
      setXferAmount('');
      await onSuccess();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mencatat penarikan dana'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount || 0);
    if (!txDesc.trim() || amt <= 0) {
      showToast('⚠️ Uraian dan nominal transaksi wajib diisi');
      return;
    }
    setIsSavingTx(true);
    try {
      await FinanceService.createTransaction({
        accountType: txAccount,
        direction: txDirection,
        category: txCategory,
        description: txDesc.trim(),
        amount: amt,
        txDate,
        proofUrl: txProof || undefined,
      });
      showToast(`Transaksi ${txCategory} (${formatRupiah(amt)}) berhasil dicatat`);
      setTxDesc('');
      setTxAmount('');
      setTxProof('');
      await onSuccess();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mencatat transaksi'}`);
    } finally {
      setIsSavingTx(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Form Kiri: Tarik Dana Bank -> Kas Operasional */}
      <form
        onSubmit={handleTransferToPetty}
        className="xl:col-span-5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Tarik Dana Bank &rarr; Kas Operasional Kantor</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Otomatis mengurangi sheet Saldo (Bank) &amp; masuk kolom DEBIT sheet Operational.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50">
            <span className="text-[10px] text-slate-500 block">Kas Bersih DPW di Bank</span>
            <strong className="font-mono text-sm text-blue-700 dark:text-blue-300">
              {formatRupiah(summary.balances.netDpwBankBalance)}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
            <span className="text-[10px] text-slate-500 block">Saldo Kas Operasional</span>
            <strong className="font-mono text-sm text-emerald-700 dark:text-emerald-300">
              {formatRupiah(summary.balances.pettyCashBalance)}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nominal Tarik (Rp)
            </label>
            <input
              type="number"
              min={1}
              value={xferAmount}
              onChange={(e) => setXferAmount(e.target.value)}
              placeholder="Mis. 25000000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal Penarikan
            </label>
            <input
              type="date"
              value={xferDate}
              onChange={(e) => setXferDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Uraian Penarikan
          </label>
          <input
            type="text"
            value={xferDesc}
            onChange={(e) => setXferDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isTransferring}
          className="w-full py-2 px-3 rounded-xl bg-[#1A3282] hover:bg-[#142663] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {isTransferring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />}
          <span>Catat Penarikan Dana Operasional</span>
        </button>
      </form>

      {/* Form Kanan: Catat Pengeluaran Operasional / Mutasi Bank */}
      <form
        onSubmit={handleCreateTx}
        className="xl:col-span-7 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-600" />
            <span>Catat Pengeluaran Operasional Kantor / Mutasi Bank</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gaji staf, satpam, listrik, wifi, maintenance lift, solar genset, biaya admin/bunga bank, dll.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Akun Kas
            </label>
            <select
              value={txAccount}
              onChange={(e) => setTxAccount(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
            >
              <option value="PETTY_CASH">Operational (Kas Kantor)</option>
              <option value="BANK_DPW">Saldo (Rekening Bank DPW)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Jenis Arus Dana
            </label>
            <select
              value={txDirection}
              onChange={(e) => setTxDirection(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
            >
              <option value="OUT">Pengeluaran (Credit / Keluar)</option>
              <option value="IN">Pemasukan / Penyesuaian (Masuk)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            >
              {FINANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nominal (Rp)
            </label>
            <input
              type="number"
              min={1}
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Mis. 950000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Foto Nota / Struk (Opsional)
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate text-[11px]">{txProof ? '✓ Nota siap' : 'Pilih foto nota'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setTxProof(await readImageAsDataUrl(f));
                }}
              />
            </label>
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Uraian Pengeluaran / Mutasi
          </label>
          <input
            type="text"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
            placeholder="Mis. Pembayaran listrik & wifi kantor bulan ini..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSavingTx}
          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSavingTx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>Simpan Transaksi Kas</span>
        </button>
      </form>
    </div>
  );
};
