import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  Loader2,
  RotateCcw,
  Search,
  Send,
  Upload,
} from 'lucide-react';
import { FinanceService } from '../../services';
import { FinanceDppRemittance, FinancePendingDppResponse } from '../../types/finance';
import { exportDppRemittancesExcel } from '../../utils/financeExportUtils';
import {
  formatMonthLabel,
  formatRupiah,
  getMonthOptionsForYear,
  getTodayIsoDate,
  readImageAsDataUrl,
} from './financeHelpers';
import { MonthDrilldownBar, MonthDrilldownOption } from './shared/MonthDrilldownBar';

interface FinanceDppRemittanceTabProps {
  selectedYear: string;
  focusedMonth: string;
  setFocusedMonth: (ym: string) => void;
  refreshKey?: number;
  onRefreshSummary: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const FinanceDppRemittanceTab: React.FC<FinanceDppRemittanceTabProps> = ({
  selectedYear,
  focusedMonth,
  setFocusedMonth,
  refreshKey,
  onRefreshSummary,
  showToast,
}) => {
  const [pending, setPending] = useState<FinancePendingDppResponse | null>(null);
  const [remittances, setRemittances] = useState<FinanceDppRemittance[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [daerahFilter, setDaerahFilter] = useState<string>('ALL');
  const [remSearch, setRemSearch] = useState<string>('');

  const [remDate, setRemDate] = useState(getTodayIsoDate());
  const [bankFee, setBankFee] = useState('2500');
  const [recipientAccount, setRecipientAccount] = useState('Rekening DPP Partai NasDem Pusat');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        FinanceService.getPendingDppRemittances(),
        FinanceService.listDppRemittances(),
      ]);
      setPending(pRes);
      setRemittances(rRes);
      setSelectedIds(pRes.items.map((x) => x.id));
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memuat antrean pengiriman DPP'}`);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const validFocusedMonth =
    focusedMonth && (selectedYear === 'ALL' || focusedMonth.startsWith(`${selectedYear}-`))
      ? focusedMonth
      : '';

  const drilldownMonths: MonthDrilldownOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of pending?.items || []) {
      counts[it.periodMonth] = (counts[it.periodMonth] || 0) + 1;
    }
    for (const rem of remittances) {
      for (const it of rem.items || []) {
        counts[it.periodMonth] = (counts[it.periodMonth] || 0) + 1;
      }
    }
    return getMonthOptionsForYear(selectedYear).map((m) => {
      const cnt = counts[m.ym] || 0;
      return {
        ym: m.ym,
        label: m.label,
        badge: cnt > 0 ? String(cnt) : undefined,
        hasData: cnt > 0,
      };
    });
  }, [selectedYear, pending, remittances]);

  const scopePendingItems = useMemo(() => {
    const all = pending?.items || [];
    if (validFocusedMonth) {
      return all.filter((it) => it.periodMonth === validFocusedMonth);
    }
    return selectedYear === 'ALL'
      ? all
      : all.filter((it) => it.periodMonth.startsWith(`${selectedYear}-`));
  }, [pending, selectedYear, validFocusedMonth]);

  const pendingDaerahChips = useMemo(() => {
    const map = new Map<string, { daerah: string; totalAmount: number; count: number }>();
    for (const it of scopePendingItems) {
      const cur = map.get(it.daerah) || { daerah: it.daerah, totalAmount: 0, count: 0 };
      cur.totalAmount += it.amountDpp;
      cur.count += 1;
      map.set(it.daerah, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [scopePendingItems]);

  const filteredPendingItems = useMemo(() => {
    return daerahFilter === 'ALL'
      ? scopePendingItems
      : scopePendingItems.filter((it) => it.daerah === daerahFilter);
  }, [scopePendingItems, daerahFilter]);

  useEffect(() => {
    setSelectedIds(filteredPendingItems.map((x) => x.id));
  }, [filteredPendingItems]);

  const visibleIdSet = useMemo(() => new Set(filteredPendingItems.map((x) => x.id)), [filteredPendingItems]);
  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => visibleIdSet.has(id)),
    [selectedIds, visibleIdSet]
  );

  const selectedTotal = filteredPendingItems
    .filter((x) => activeSelectedIds.includes(x.id))
    .reduce((acc, x) => acc + x.amountDpp, 0);

  const totalTransferred = selectedTotal + Number(bankFee || 0);

  const filteredRemittances = useMemo(() => {
    const q = remSearch.trim().toLowerCase();
    return remittances
      .map((rem) => {
        const items = rem.items || [];
        const scopedItems = validFocusedMonth
          ? items.filter((it) => it.periodMonth === validFocusedMonth)
          : selectedYear === 'ALL'
          ? items
          : items.filter((it) => it.periodMonth.startsWith(`${selectedYear}-`));

        const matchesScope = validFocusedMonth
          ? rem.remittanceDate?.startsWith(`${validFocusedMonth}-`) || scopedItems.length > 0
          : selectedYear === 'ALL' ||
            rem.remittanceDate?.startsWith(`${selectedYear}-`) ||
            scopedItems.length > 0;
        if (!matchesScope) return null;

        if (q) {
          const batchHay = `${rem.periodLabel} ${rem.referenceNo} ${rem.notes} ${rem.remittanceDate} ${rem.createdBy || ''}`.toLowerCase();
          const itemMatches = scopedItems.some(
            (it) =>
              it.namaLengkap.toLowerCase().includes(q) ||
              it.daerah.toLowerCase().includes(q) ||
              it.periodMonth.includes(q)
          );
          if (!batchHay.includes(q) && !itemMatches) return null;
        }

        const displayItems = scopedItems;
        const displayAmount =
          !validFocusedMonth && selectedYear === 'ALL'
            ? rem.totalDppAmount
            : scopedItems.length > 0
            ? scopedItems.reduce((s, it) => s + it.amountDpp, 0)
            : rem.totalDppAmount;

        return { rem, displayItems, displayAmount };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [remittances, selectedYear, validFocusedMonth, remSearch]);

  const totalPendingScopeAmount = scopePendingItems.reduce((s, x) => s + x.amountDpp, 0);
  const totalRemittedScopeAmount = filteredRemittances.reduce((s, r) => s + r.displayAmount, 0);
  const totalBankFeeScope = filteredRemittances.reduce((s, r) => s + r.rem.bankFee, 0);

  const toggleAll = () => {
    if (activeSelectedIds.length === filteredPendingItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPendingItems.map((x) => x.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSelectedIds.length === 0) {
      showToast('⚠️ Centang minimal 1 setoran DPP untuk dikirim');
      return;
    }
    setIsSubmitting(true);
    try {
      const rem = await FinanceService.createDppRemittance({
        paymentIds: activeSelectedIds,
        remittanceDate: remDate,
        bankFee: Number(bankFee || 0),
        recipientAccount,
        referenceNo,
        proofUrl: proofUrl || undefined,
        notes,
      });
      showToast(
        `Pengiriman ke DPP (${rem.itemCount} item) berhasil dicatat: ${formatRupiah(rem.totalTransferred)}`
      );
      setReferenceNo('');
      setNotes('');
      setProofUrl('');
      await Promise.all([loadData(), onRefreshSummary()]);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mencatat pengiriman ke DPP'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBatch = async (rem: FinanceDppRemittance) => {
    const confirmed = window.confirm(
      `Batalkan batch pengiriman ke DPP "${rem.periodLabel}" (${formatRupiah(rem.totalDppAmount)})?\n\nDana titipan DPP (${rem.itemCount} setoran) akan kembali ke antrean dan mutasi keluar Bank DPW akan dihapus.`
    );
    if (!confirmed) return;

    setCancellingId(rem.id);
    try {
      const res = await FinanceService.deleteDppRemittance(rem.id);
      showToast(`Batch DPP "${rem.periodLabel}" dibatalkan (${res.releasedCount} setoran dilepaskan kembali)`);
      await Promise.all([loadData(), onRefreshSummary()]);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal membatalkan batch DPP'}`);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        <span>Memuat antrean &amp; riwayat pengiriman ke DPP...</span>
      </div>
    );
  }

  const scopeLabel = validFocusedMonth
    ? formatMonthLabel(validFocusedMonth)
    : selectedYear === 'ALL'
    ? '2026–Berjalan'
    : `Tahun ${selectedYear}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Bar Drill-Down Bulan di Dalam Tahun Terpilih */}
      <MonthDrilldownBar
        selectedYear={selectedYear}
        focusedMonth={validFocusedMonth}
        onSelectMonth={setFocusedMonth}
        months={drilldownMonths}
      />

      {/* Strip Ringkasan Rekonsiliasi DPP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
            Antrean Siap Kirim ({scopeLabel})
          </span>
          <span className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-300 mt-0.5 block">
            {formatRupiah(totalPendingScopeAmount)}
          </span>
          <span className="text-[10.5px] text-amber-700/80 dark:text-amber-400/80">
            {scopePendingItems.length} entri menunggu transfer ke DPP
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Jumlah Batch ({scopeLabel})
          </span>
          <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
            {filteredRemittances.length} Batch
          </span>
          <span className="text-[10.5px] text-slate-400">
            Tercatat dalam riwayat pengiriman DPP
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 block">
            Total Pokok DPP Terkirim ({scopeLabel})
          </span>
          <span className="text-base font-extrabold font-mono text-blue-700 dark:text-blue-300 mt-0.5 block">
            {formatRupiah(totalRemittedScopeAmount)}
          </span>
          <span className="text-[10.5px] text-blue-700/80 dark:text-blue-400/80">
            Akumulasi porsi DPP periode tampil
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Total Biaya Admin Bank
          </span>
          <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
            {formatRupiah(totalBankFeeScope)}
          </span>
          <span className="text-[10.5px] text-slate-400">
            Biaya transfer antarbank batch tampil
          </span>
        </div>
      </div>

      {/* Bagian 1: Antrean Dana Siap Kirim ke DPP */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 dark:bg-amber-950/25">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Antrean Dana Titipan DPP ({filteredPendingItems.length} item · {scopeLabel})
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Centang setoran yang ditransfer hari ini ke rekening DPP Pusat agar status otomatis menjadi terkirim.
              </p>
            </div>
            {filteredPendingItems.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer"
              >
                {activeSelectedIds.length === filteredPendingItems.length ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>
            )}
          </div>

          {pendingDaerahChips.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setDaerahFilter('ALL')}
                className={`px-2.5 py-1 rounded-full font-bold border cursor-pointer ${
                  daerahFilter === 'ALL'
                    ? 'bg-[#1A3282] text-white border-[#1A3282]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Semua Daerah ({scopePendingItems.length})
              </button>
              {pendingDaerahChips.map((chip) => (
                <button
                  key={chip.daerah}
                  type="button"
                  onClick={() =>
                    setDaerahFilter((cur) => (cur === chip.daerah ? 'ALL' : chip.daerah))
                  }
                  className={`px-2.5 py-1 rounded-full font-semibold border cursor-pointer ${
                    daerahFilter === chip.daerah
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {chip.daerah} ({chip.count}) · {formatRupiah(chip.totalAmount)}
                </button>
              ))}
            </div>
          )}

          {filteredPendingItems.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak Ada Dana DPP Tertahan ({scopeLabel})
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Seluruh porsi kewajiban DPP untuk periode terpilih sudah tercatat terkirim ke DPP. Setoran baru yang mengandung porsi DPP akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[420px] overflow-y-auto">
              {filteredPendingItems.map((item) => {
                const checked = activeSelectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 accent-[#1A3282] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {item.namaLengkap}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {item.daerah} · Bulan <strong>{item.periodLabel}</strong> ({item.paymentMethod})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                      {formatRupiah(item.amountDpp)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Eksekusi Batch Pengiriman DPP */}
        <form
          onSubmit={handleSubmitRemittance}
          className="xl:col-span-5 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-2xs h-fit"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-[#1A3282] dark:text-blue-400" />
            <span>Eksekusi Batch Pengiriman ke DPP</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Item Dipilih:</span>
              <strong className="font-mono">{activeSelectedIds.length} setoran</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pokok DPP:</span>
              <strong className="font-mono text-amber-700 dark:text-amber-300">
                {formatRupiah(selectedTotal)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Biaya Admin Transfer Bank:</span>
              <strong className="font-mono">{formatRupiah(Number(bankFee || 0))}</strong>
            </div>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm">
              <span className="font-bold text-slate-800 dark:text-white">Total Keluar Rekening Bank:</span>
              <strong className="font-mono text-blue-700 dark:text-blue-400">
                {formatRupiah(totalTransferred)}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tanggal Transfer DPP
              </label>
              <input
                type="date"
                value={remDate}
                onChange={(e) => setRemDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Biaya Admin Transfer (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={bankFee}
                onChange={(e) => setBankFee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Rekening Tujuan DPP
              </label>
              <input
                type="text"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                No. Referensi Bank (Opsional)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Mis. TRF-20261119-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Foto Bukti Transfer DPP
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate text-[11px]">
                  {proofUrl ? '✓ Bukti siap' : 'Unggah struk transfer'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setProofUrl(await readImageAsDataUrl(f));
                  }}
                />
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Catatan Pengiriman
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan batch..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || activeSelectedIds.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1A3282] hover:bg-[#142663] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim &amp; Mengupdate Buku Kas...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                <span>Catat Pengiriman ke DPP ({formatRupiah(selectedTotal)})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bagian 2: Riwayat Pengiriman ke DPP */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>
              Riwayat Pengiriman Dana ke DPP Pusat ({filteredRemittances.length} batch · {scopeLabel})
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={remSearch}
                onChange={(e) => setRemSearch(e.target.value)}
                placeholder="Cari anggota / no. ref / catatan..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none w-56"
              />
            </div>

            <button
              type="button"
              onClick={() => exportDppRemittancesExcel(filteredRemittances.map((r) => r.rem))}
              className="btn-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Riwayat (.xlsx)</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredRemittances.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada batch pengiriman DPP yang cocok pada {scopeLabel}.
            </div>
          ) : (
            filteredRemittances.map(({ rem, displayItems, displayAmount }) => {
              const isOpen = expandedBatchId === rem.id;
              const isCancelling = cancellingId === rem.id;
              const isPartial =
                (validFocusedMonth || selectedYear !== 'ALL') &&
                displayAmount !== rem.totalDppAmount;

              return (
                <div key={rem.id} className="text-xs">
                  <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setExpandedBatchId(isOpen ? null : rem.id)}
                      className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rem.periodLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rem.isHistorical
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {rem.isHistorical ? 'Historis Excel 2026' : 'Terkirim via Sistem'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tanggal: <strong>{rem.remittanceDate}</strong> ·{' '}
                          {!validFocusedMonth && selectedYear === 'ALL'
                            ? `${rem.itemCount} entri`
                            : `${displayItems.length} entri pada ${scopeLabel} (dari ${rem.itemCount} total)`}{' '}
                          · Ref: {rem.referenceNo || '-'} · Oleh {rem.createdBy || 'Bendahara'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-mono font-extrabold text-sm text-blue-700 dark:text-blue-400 block">
                          {formatRupiah(displayAmount)}
                        </span>
                        <span className="text-[10.5px] font-mono text-slate-500">
                          {isPartial
                            ? `Porsi ${scopeLabel} · Total batch ${formatRupiah(rem.totalDppAmount)}`
                            : `Admin Bank: ${formatRupiah(rem.bankFee)} · Klik lihat rincian`}
                        </span>
                      </div>
                    </button>

                    {!rem.isHistorical && (
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => handleCancelBatch(rem)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Batalkan pengiriman batch DPP ini"
                      >
                        {isCancelling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Batalkan Batch</span>
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {rem.notes && <p className="text-[11px] text-slate-600 dark:text-slate-400">{rem.notes}</p>}
                      {rem.proofUrl && (
                        <a
                          href={rem.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" /> Lihat Bukti Transfer DPP
                        </a>
                      )}
                      {displayItems.length > 0 && (
                        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                          {displayItems.slice(0, 120).map((it) => (
                            <div key={it.id} className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                              <span>
                                <strong>{it.namaLengkap}</strong>{' '}
                                <span className="text-slate-400">({it.daerah} · {it.periodMonth})</span>
                              </span>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {formatRupiah(it.amountDpp)}
                              </span>
                            </div>
                          ))}
                          {displayItems.length > 120 && (
                            <div className="px-3 py-1.5 text-[11px] text-slate-500">
                              Menampilkan 120 dari {displayItems.length} item (gunakan Export Excel untuk daftar penuh).
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
