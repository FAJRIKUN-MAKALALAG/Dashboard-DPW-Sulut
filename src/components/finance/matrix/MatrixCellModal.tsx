import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { FinanceService } from '../../../services';
import {
  FinanceDuesPaymentRecord,
  FinanceMatrixCell,
  FinanceMatrixLegislatorRow,
} from '../../../types/finance';
import {
  PAYMENT_MODE_OPTIONS,
  PaymentSplitMode,
  computeManualSplitPreview,
  formatMonthLabel,
  formatRupiah,
  generateMonthOptions,
  getTodayIsoDate,
  readImageAsDataUrl,
} from '../financeHelpers';

interface MatrixCellModalProps {
  isOpen: boolean;
  legislator: FinanceMatrixLegislatorRow | null;
  periodMonth: string;
  cell: FinanceMatrixCell | null;
  onClose: () => void;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const MatrixCellModal: React.FC<MatrixCellModalProps> = ({
  isOpen,
  legislator,
  periodMonth,
  cell,
  onClose,
  onRefreshAll,
  showToast,
}) => {
  const [existingPayments, setExistingPayments] = useState<FinanceDuesPaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([periodMonth]);
  const [mode, setMode] = useState<PaymentSplitMode>('BOTH');
  const [customDpw, setCustomDpw] = useState('');
  const [customDpp, setCustomDpp] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const monthOptions = useMemo(() => generateMonthOptions('2026-01', 3).slice(-18), []);

  const loadExistingPayments = async (legId: string, ym: string) => {
    setLoadingPayments(true);
    try {
      const items = await FinanceService.listPayments({ legislatorId: legId, periodMonth: ym });
      setExistingPayments(items);
    } catch {
      setExistingPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !legislator || !periodMonth) return;

    setSelectedMonths([periodMonth]);
    setPaymentDate(getTodayIsoDate());
    setNotes('');
    setProofUrl('');

    const dpwPaid = cell?.amountDpw ?? 0;
    const dppPaid = cell?.amountDpp ?? 0;
    const dpwTarget = cell?.targetDpw ?? 0;
    const dppTarget = cell?.targetDpp ?? 0;

    if (dpwPaid === 0 && dppPaid === 0) {
      setMode('BOTH');
      setCustomDpw('');
      setCustomDpp('');
    } else if (dpwPaid < dpwTarget && dppPaid >= dppTarget) {
      setMode('DPW_ONLY');
      setCustomDpw('');
      setCustomDpp('');
    } else if (dppPaid < dppTarget && dpwPaid >= dpwTarget) {
      setMode('DPP_ONLY');
      setCustomDpw('');
      setCustomDpp('');
    } else {
      setMode('CUSTOM');
      setCustomDpw(String(Math.max(0, dpwTarget - dpwPaid)));
      setCustomDpp(String(Math.max(0, dppTarget - dppPaid)));
    }

    if (cell && cell.allPaymentIds.length > 0) {
      loadExistingPayments(legislator.id, periodMonth);
    } else {
      setExistingPayments([]);
    }
  }, [isOpen, legislator, periodMonth, cell]);

  if (!isOpen || !legislator) return null;

  const tariffDpw = cell?.targetDpw ?? 0;
  const tariffDpp = cell?.targetDpp ?? 0;
  const preview = computeManualSplitPreview(
    tariffDpw,
    tariffDpp,
    selectedMonths.length,
    mode,
    customDpw,
    customDpp
  );

  const handleDeletePayment = async (p: FinanceDuesPaymentRecord) => {
    if (!window.confirm(`Batalkan & hapus setoran ${formatRupiah(p.totalAmount)} (${p.paymentMethod})?`)) {
      return;
    }
    setDeletingId(p.id);
    try {
      await FinanceService.deletePayment(p.id);
      showToast(`Setoran ${legislator.namaLengkap} (${formatMonthLabel(periodMonth)}) dihapus`);
      await Promise.all([loadExistingPayments(legislator.id, periodMonth), onRefreshAll()]);
      if (existingPayments.length <= 1) {
        onClose();
      }
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menghapus setoran'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) {
      showToast('⚠️ Pilih minimal 1 bulan');
      return;
    }
    if (preview.total <= 0) {
      showToast('⚠️ Nominal setoran harus lebih besar dari Rp 0');
      return;
    }

    setIsSaving(true);
    try {
      const res = await FinanceService.recordManualPayment({
        legislatorId: legislator.id,
        periodMonths: selectedMonths,
        paymentDate,
        mode,
        customAmountDpw: mode === 'CUSTOM' ? Number(customDpw || 0) : undefined,
        customAmountDpp: mode === 'CUSTOM' ? Number(customDpp || 0) : undefined,
        proofUrl: proofUrl || undefined,
        notes: notes || undefined,
      });
      showToast(
        `Setoran ${legislator.namaLengkap} (${res.createdCount} bln) disimpan: DPW ${formatRupiah(res.totalDpw)} + DPP ${formatRupiah(res.totalDpp)}`
      );
      await onRefreshAll();
      onClose();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menyimpan setoran'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExtraMonth = (ym: string) => {
    setSelectedMonths((prev) =>
      prev.includes(ym) ? prev.filter((x) => x !== ym) : [...prev, ym].sort()
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#1A3282] text-white flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Sel Iuran · {formatMonthLabel(periodMonth)}
            </span>
            <h3 className="text-base font-extrabold">{legislator.namaLengkap}</h3>
            <p className="text-xs text-blue-100/90">
              {legislator.daerah} · Tarif: DPW {formatRupiah(tariffDpw)} + DPP {formatRupiah(tariffDpp)} ={' '}
              <strong>{formatRupiah(tariffDpw + tariffDpp)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Riwayat Tercatat di Sel Ini */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span>Riwayat Setoran Tercatat pada {formatMonthLabel(periodMonth)}</span>
              {cell && cell.amount > 0 && (
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  DPW {formatRupiah(cell.amountDpw)} · DPP {formatRupiah(cell.amountDpp)}
                </span>
              )}
            </h4>

            {loadingPayments ? (
              <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat rincian setoran...</span>
              </div>
            ) : existingPayments.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500">
                Belum ada setoran tercatat pada bulan {formatMonthLabel(periodMonth)}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                {existingPayments.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.paymentMethod === 'AUTODEBET'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {p.paymentMethod}
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatRupiah(p.totalAmount)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (DPW {formatRupiah(p.amountDpw)} · DPP {formatRupiah(p.amountDpp)})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Tgl: {p.paymentDate || '-'} · {p.notes || '-'}
                      </p>
                      {p.proofUrl && (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Lihat Bukti
                        </a>
                      )}
                    </div>

                    {p.canDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => handleDeletePayment(p)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Batalkan</span>
                      </button>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold flex items-center gap-1 shrink-0"
                        title="Batalkan batch pengiriman DPP terlebih dahulu jika ingin menghapus"
                      >
                        <Lock className="w-3 h-3" /> Terkunci di Batch DPP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Catat / Tambah Setoran */}
          <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">
              Catat / Tambah Setoran untuk Sel Ini
            </h4>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Bulan Setoran (bisa pilih lebih dari 1 untuk sekaligus rapel)
                </label>
                <span className="font-mono font-bold text-blue-600">{selectedMonths.length} bulan</span>
              </div>
              <div className="max-h-28 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {monthOptions.map((m) => {
                  const active = selectedMonths.includes(m.ym);
                  return (
                    <button
                      key={m.ym}
                      type="button"
                      onClick={() => toggleExtraMonth(m.ym)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#1A3282] text-white border-[#1A3282]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                    mode === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {mode === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nominal Hak DPW (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={customDpw}
                    onChange={(e) => setCustomDpw(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nominal Titipan DPP (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={customDpp}
                    onChange={(e) => setCustomDpp(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tanggal Masuk Bank
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Foto Bukti Transfer
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate text-[11px]">
                    {proofUrl ? '✓ Bukti siap' : 'Unggah foto'}
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
                  Catatan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mis. Transfer Bank SulutGo"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Masuk Bank: {formatRupiah(preview.total)}</span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                Hak DPW <strong className="text-emerald-700 dark:text-emerald-400">{formatRupiah(preview.dpw)}</strong> · Titipan DPP{' '}
                <strong className="text-amber-700 dark:text-amber-400">{formatRupiah(preview.dpp)}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSaving || preview.total <= 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Simpan Setoran ({formatRupiah(preview.total)})</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
