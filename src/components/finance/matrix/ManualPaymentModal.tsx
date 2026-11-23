import React, { useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, Upload, Wallet, X } from 'lucide-react';
import { FinanceService } from '../../../services';
import { FinanceLegislator } from '../../../types/finance';
import {
  PAYMENT_MODE_OPTIONS,
  PaymentSplitMode,
  computeManualSplitPreview,
  formatMonthLabel,
  formatRupiah,
  generateMonthOptions,
  getCurrentYearMonth,
  getTodayIsoDate,
  readImageAsDataUrl,
} from '../financeHelpers';

interface ManualPaymentModalProps {
  isOpen: boolean;
  legislators: FinanceLegislator[];
  onClose: () => void;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  legislators,
  onClose,
  onRefreshAll,
  showToast,
}) => {
  const monthOptions = useMemo(() => generateMonthOptions('2026-01', 3).slice(-18), []);
  const [selectedLegId, setSelectedLegId] = useState<string>(() => legislators[0]?.id || '');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => [getCurrentYearMonth()]);
  const [mode, setMode] = useState<PaymentSplitMode>('BOTH');
  const [customDpw, setCustomDpw] = useState('');
  const [customDpp, setCustomDpp] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedLeg = useMemo(
    () => legislators.find((l) => l.id === selectedLegId) || legislators[0],
    [legislators, selectedLegId]
  );

  if (!isOpen) return null;

  const preview = selectedLeg
    ? computeManualSplitPreview(
        selectedLeg.currentTariffDpw,
        selectedLeg.currentTariffDpp,
        selectedMonths.length,
        mode,
        customDpw,
        customDpp
      )
    : { dpw: 0, dpp: 0, total: 0 };

  const handleToggleMonth = (ym: string) => {
    setSelectedMonths((prev) =>
      prev.includes(ym) ? prev.filter((x) => x !== ym) : [...prev, ym].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeg) {
      showToast('⚠️ Pilih anggota dewan terlebih dahulu');
      return;
    }
    if (selectedMonths.length === 0) {
      showToast('⚠️ Pilih minimal 1 bulan setoran');
      return;
    }
    setIsSaving(true);
    try {
      const res = await FinanceService.recordManualPayment({
        legislatorId: selectedLeg.id,
        periodMonths: selectedMonths,
        paymentDate,
        mode,
        customAmountDpw: mode === 'CUSTOM' ? Number(customDpw || 0) : undefined,
        customAmountDpp: mode === 'CUSTOM' ? Number(customDpp || 0) : undefined,
        proofUrl: proofUrl || undefined,
        notes: notes || undefined,
      });
      showToast(
        `Setoran ${selectedLeg.namaLengkap} tersimpan (${res.createdCount} bln): DPW ${formatRupiah(res.totalDpw)} + DPP ${formatRupiah(res.totalDpp)}`
      );
      setNotes('');
      setProofUrl('');
      setCustomDpw('');
      setCustomDpp('');
      await onRefreshAll();
      onClose();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menyimpan setoran manual'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-3.5 bg-[#002B49] text-white flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Input Setoran Fraksi Manual / Rapel Multi-Bulan</span>
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Pilih Anggota Dewan
              </label>
              <select
                value={selectedLeg?.id || ''}
                onChange={(e) => setSelectedLegId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
              >
                {legislators.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.namaLengkap} — {l.daerah}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tanggal Uang Masuk Bank
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          {selectedLeg && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  {selectedLeg.daerah} ({selectedLeg.tingkat === 'PROVINSI' ? 'DPRD Provinsi' : 'DPRD Kab/Kota'})
                </span>
                <span className="text-[11px] text-slate-500">
                  Tarif: DPW <strong>{formatRupiah(selectedLeg.currentTariffDpw)}</strong> + DPP{' '}
                  <strong>{formatRupiah(selectedLeg.currentTariffDpp)}</strong> ={' '}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {formatRupiah(selectedLeg.currentTariffTotal)}/bln
                  </strong>
                </span>
              </div>
              {selectedLeg.isAutodebetActive ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Autodebet Aktif (sejak {formatMonthLabel(selectedLeg.autodebetStartMonth)})
                </span>
              ) : null}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Pilih Bulan Iuran (centang beberapa bulan untuk rapel)
              </label>
              <span className="font-mono font-bold text-blue-600">{selectedMonths.length} bulan dipilih</span>
            </div>
            <div className="max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {monthOptions.map((m) => {
                const active = selectedMonths.includes(m.ym);
                return (
                  <button
                    key={m.ym}
                    type="button"
                    onClick={() => handleToggleMonth(m.ym)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
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
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
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
              <input
                type="number"
                min={0}
                value={customDpw}
                onChange={(e) => setCustomDpw(e.target.value)}
                placeholder="Nominal Hak DPW (Rp)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
              />
              <input
                type="number"
                min={0}
                value={customDpp}
                onChange={(e) => setCustomDpp(e.target.value)}
                placeholder="Nominal Titipan DPP (Rp)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate text-[11px]">
                {proofUrl ? '✓ Bukti transfer siap' : 'Upload foto bukti transfer (opsional)'}
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
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan / catatan transfer..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Rincian Pembukuan Otomatis:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Total Masuk Bank</span>
                <strong className="text-sm text-slate-900 dark:text-white">{formatRupiah(preview.total)}</strong>
              </div>
              <div>
                <span className="text-emerald-700 dark:text-emerald-400 block">Hak Kas DPW</span>
                <strong className="text-sm text-emerald-700 dark:text-emerald-300">{formatRupiah(preview.dpw)}</strong>
              </div>
              <div>
                <span className="text-amber-700 dark:text-amber-400 block">Titipan Kirim DPP</span>
                <strong className="text-sm text-amber-700 dark:text-amber-300">{formatRupiah(preview.dpp)}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || preview.total <= 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Simpan Setoran ({formatRupiah(preview.total)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
