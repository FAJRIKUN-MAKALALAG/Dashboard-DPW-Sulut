import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  RotateCcw,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { FinanceService } from '../../../services';
import { FinanceSummary } from '../../../types/finance';
import {
  formatMonthLabel,
  formatRupiah,
  getMonthOptionsForYear,
  getTodayIsoDate,
  readImageAsDataUrl,
} from '../financeHelpers';

interface AutodebetQuickStripProps {
  summary: FinanceSummary;
  selectedYear: string;
  selectedMonth: string;
  onChangeMonth: (ym: string) => void;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const AutodebetQuickStrip: React.FC<AutodebetQuickStripProps> = ({
  summary,
  selectedYear,
  selectedMonth,
  onChangeMonth,
  onRefreshAll,
  showToast,
}) => {
  const [isOpen, setIsOpen] = useState(
    () => selectedYear !== '2024' && selectedYear !== '2025'
  );
  const [showProofFields, setShowProofFields] = useState(false);
  const [autoDate, setAutoDate] = useState(getTodayIsoDate());
  const [autoProof, setAutoProof] = useState('');
  const [autoNotes, setAutoNotes] = useState('');
  const [busyRegion, setBusyRegion] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [expandedMembersRegion, setExpandedMembersRegion] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Tahun historis otomatis diciutkan agar tabel keseluruhan tahun tampil penuh
    setIsOpen(selectedYear !== '2024' && selectedYear !== '2025');
  }, [selectedYear]);

  const monthOptions = useMemo(
    () => getMonthOptionsForYear(selectedYear).slice().reverse(),
    [selectedYear]
  );
  const groups = summary.autodebetRegionGroups || [];

  const handleRecordRegion = async (daerah: string) => {
    setBusyRegion(daerah);
    try {
      const res = await FinanceService.recordAutodebetBatch({
        daerah,
        periodMonth: selectedMonth,
        paymentDate: autoDate,
        proofUrl: autoProof || undefined,
        notes: autoNotes || undefined,
      });
      showToast(
        `Autodebet ${daerah} (${res.createdCount} org) dicatat: DPW ${formatRupiah(res.totalDpw)} + Titipan DPP ${formatRupiah(res.totalDpp)}`
      );
      setAutoProof('');
      setAutoNotes('');
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mencatat autodebet'}`);
    } finally {
      setBusyRegion(null);
    }
  };

  const handleCancelRegion = async (daerah: string, count: number) => {
    const label = formatMonthLabel(selectedMonth);
    const confirmed = window.confirm(
      `Batalkan catatan Autodebet ${daerah} bulan ${label} (${count} anggota)?\n\nMutasi Bank DPW, Antrean DPP, dan Matriks DPW/DPP untuk bulan ini akan dikembalikan seperti semula.`
    );
    if (!confirmed) return;

    setBusyRegion(daerah);
    try {
      const res = await FinanceService.cancelAutodebetBatch({
        daerah,
        periodMonth: selectedMonth,
        onlyAutodebet: true,
      });
      const lockNotice =
        res.skippedLockedCount > 0
          ? ` (${res.skippedLockedCount} entri dilewati karena sudah masuk batch DPP)`
          : '';
      showToast(
        `Autodebet ${daerah} ${label} dibatalkan (${res.deletedCount} org · ${formatRupiah(res.removedTotal)})${lockNotice}`
      );
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal membatalkan autodebet wilayah'}`);
    } finally {
      setBusyRegion(null);
    }
  };

  const handleCancelSingleMember = async (legId: string, nama: string) => {
    const label = formatMonthLabel(selectedMonth);
    if (!window.confirm(`Batalkan setoran ${nama} untuk bulan ${label}?`)) return;
    setBusyMemberId(legId);
    try {
      const res = await FinanceService.cancelAutodebetBatch({
        periodMonth: selectedMonth,
        legislatorId: legId,
        onlyAutodebet: false,
      });
      showToast(`Setoran ${nama} (${label}) dibatalkan: ${formatRupiah(res.removedTotal)}`);
      await onRefreshAll();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal membatalkan setoran anggota'}`);
    } finally {
      setBusyMemberId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Panel Cepat Autodebet Bulanan ({groups.length} Wilayah Aktif)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
            {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-white outline-none text-[11px]"
          >
            {monthOptions.map((m) => (
              <option key={m.ym} value={m.ym}>
                {m.label} ({m.ym})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={autoDate}
            onChange={(e) => setAutoDate(e.target.value)}
            title="Tanggal masuk rekening bank"
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none"
          />

          <button
            type="button"
            onClick={() => setShowProofFields((v) => !v)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            {showProofFields ? 'Tutup Bukti' : '+ Bukti & Catatan'}
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title={isOpen ? 'Ciutkan panel autodebet' : 'Buka panel autodebet'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 space-y-3">
          {showProofFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-white dark:hover:bg-slate-900">
                <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate text-[11px]">
                  {autoProof ? '✓ Foto mutasi siap diunggah' : 'Unggah foto rekening koran (opsional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setAutoProof(await readImageAsDataUrl(f));
                  }}
                />
              </label>
              <input
                type="text"
                value={autoNotes}
                onChange={(e) => setAutoNotes(e.target.value)}
                placeholder="Catatan mutasi bank autodebet (opsional)..."
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {groups.map((grp) => {
              const isBusy = busyRegion === grp.daerah;
              const isMemberListOpen = !!expandedMembersRegion[grp.daerah];

              return (
                <div
                  key={grp.daerah}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {grp.daerah}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500">
                          {grp.memberCount} org · Total{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatRupiah(grp.grandTotal)}
                          </strong>
                        </p>
                      </div>
                      {grp.isFullyRecorded ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> {grp.alreadyRecordedCount}/{grp.memberCount}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                          {grp.alreadyRecordedCount}/{grp.memberCount} Tercatat
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMembersRegion((prev) => ({
                          ...prev,
                          [grp.daerah]: !prev[grp.daerah],
                        }))
                      }
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isMemberListOpen ? 'Sembunyikan daftar' : 'Rincian / batal per anggota'}</span>
                      {isMemberListOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isMemberListOpen && (
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 text-[11px]">
                        {grp.members.map((m) => {
                          const canCancelMember = (m.cancellablePaymentIds?.length || 0) > 0;
                          const isMemberBusy = busyMemberId === m.id;
                          return (
                            <div key={m.id} className="py-1.5 flex items-center justify-between gap-2">
                              <span className="truncate text-slate-700 dark:text-slate-300">
                                {m.namaLengkap}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10.5px]">
                                {m.alreadyPaid ? (
                                  <span className="text-emerald-600 font-bold">✓ Lunas</span>
                                ) : (
                                  <span className="text-slate-500">
                                    {formatRupiah(m.amountDpw + m.amountDpp)}
                                  </span>
                                )}
                                {canCancelMember ? (
                                  <button
                                    type="button"
                                    disabled={isMemberBusy}
                                    onClick={() => handleCancelSingleMember(m.id, m.namaLengkap)}
                                    title={`Batalkan setoran ${m.namaLengkap} bulan ${formatMonthLabel(selectedMonth)}`}
                                    className="p-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                  >
                                    {isMemberBusy ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <X className="w-3 h-3" />
                                    )}
                                  </button>
                                ) : m.hasRemittedDpp ? (
                                  <span title="Sudah dikirim ke DPP — batalkan batch DPP dulu">
                                    <Lock className="w-3 h-3 text-amber-500" />
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Aksi Wilayah: Catat dan/atau Batalkan */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!grp.isFullyRecorded && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRecordRegion(grp.daerah)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#1A3282] hover:bg-[#142663] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>Catat {formatMonthLabel(selectedMonth)}</span>
                      </button>
                    )}

                    {grp.cancellableCount > 0 && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancelRegion(grp.daerah, grp.cancellableCount)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Batalkan ({grp.cancellableCount})</span>
                      </button>
                    )}

                    {grp.isFullyRecorded && grp.cancellableCount === 0 && grp.remittedLockedCount > 0 && (
                      <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10.5px] font-semibold flex items-center justify-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Terkunci (Sudah Kirim DPP)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
