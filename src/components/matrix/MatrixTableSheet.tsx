import React, { useMemo, useState, useCallback } from 'react';
import {
  Trash2,
  Plus,
  ShieldCheck,
  Award,
  Building2,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  FileSpreadsheet,
  Skull,
  CheckSquare,
  Square,
  X,
  Minus,
} from 'lucide-react';

export interface GridRowItem {
  id: string;
  no: number;
  subOrg: string;
  jabatan: string;
  namaLengkap: string;
  nik: string;
  nomorEKTA: string;
  email: string;
  nomorHP: string;
  sosmed: string;
  isExisting: boolean;
  originalNik?: string;
}

interface MatrixTableSheetProps {
  gridRows: GridRowItem[];
  isEditMode: boolean;
  officialTitle: { line1: string; line2: string };
  onCellChange: (id: string, field: keyof GridRowItem, value: string) => void;
  onDeleteRow: (id: string) => void;
  onHardDeleteRow?: (row: GridRowItem) => void;
  /** Bulk soft-delete: hapus baris dari tampilan (data DB aman) */
  onBulkSoftDelete?: (ids: string[]) => void;
  /** Bulk hard-delete: hapus permanen dari database */
  onBulkHardDelete?: (rows: GridRowItem[]) => void;
  onAddNewRowForSubOrg?: (subOrg: string) => void;
}

export const MatrixTableSheet: React.FC<MatrixTableSheetProps> = ({
  gridRows,
  isEditMode,
  officialTitle,
  onCellChange,
  onDeleteRow,
  onHardDeleteRow,
  onBulkSoftDelete,
  onBulkHardDelete,
  onAddNewRowForSubOrg,
}) => {
  // ── Selection State ──────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllInSection = useCallback((rows: GridRowItem[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  }, []);

  const selectAllGlobal = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(gridRows.map((r) => r.id)) : new Set());
  }, [gridRows]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedRows = useMemo(
    () => gridRows.filter((r) => selectedIds.has(r.id)),
    [gridRows, selectedIds]
  );

  // Baris yang valid untuk hard-delete (punya NIK/data anggota)
  const selectedDeletableRows = useMemo(
    () => selectedRows.filter((r) => r.isExisting || r.originalNik || (r.nik && r.nik.length >= 10)),
    [selectedRows]
  );

  const isAllSelected = gridRows.length > 0 && gridRows.every((r) => selectedIds.has(r.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Hitung metrik keseluruhan
  const totalRows = gridRows.length;
  const totalFilled = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const totalEmpty = totalRows - totalFilled;
  const completionPercentage = totalRows > 0 ? Math.round((totalFilled / totalRows) * 100) : 0;

  // Kelompokkan baris berdasarkan subOrg agar Dewan Pertimbangan dan Dewan Pakar menjadi tabel terpisah di paling atas
  const sections = useMemo(() => {
    const map = new Map<string, GridRowItem[]>();
    gridRows.forEach((row) => {
      const key = row.subOrg || 'DEWAN PIMPINAN DAERAH';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

    // Urutan resmi: I. Dewan Pertimbangan -> II. Dewan Pakar -> III. Dewan Pimpinan Daerah
    const sortPriority = (title: string) => {
      const t = title.toUpperCase();
      if (t.includes('PERTIMBANGAN')) return 1;
      if (t.includes('PAKAR')) return 2;
      if (
        t.includes('PIMPINAN') ||
        t.includes('DPD') ||
        t.includes('DPW') ||
        t.includes('CABANG') ||
        t.includes('RANTING')
      )
        return 3;
      return 4;
    };

    return Array.from(map.entries())
      .sort(([a], [b]) => sortPriority(a) - sortPriority(b))
      .map(([subOrgName, rows]) => {
        const filledCount = rows.filter((r) => r.namaLengkap.trim() !== '').length;
        const isPertimbangan = subOrgName.toUpperCase().includes('PERTIMBANGAN');
        const isPakar = subOrgName.toUpperCase().includes('PAKAR');

        return {
          subOrg: subOrgName,
          rows,
          filledCount,
          emptyCount: rows.length - filledCount,
          isPertimbangan,
          isPakar,
        };
      });
  }, [gridRows]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/70">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl p-5 sm:p-7 max-w-full space-y-6">

        {/* ── Floating Bulk Action Bar (muncul saat ada baris dipilih) ── */}
        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-600 shadow-2xl text-white animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Kiri: Info seleksi */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Global select-all toggle */}
              <button
                onClick={() => selectAllGlobal(!isAllSelected)}
                className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-300 transition-colors cursor-pointer"
                title={isAllSelected ? 'Batalkan semua pilihan' : 'Pilih semua baris'}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : isSomeSelected ? (
                  <Minus className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-slate-300">
                  {isAllSelected ? 'Batal semua' : 'Pilih semua'}
                </span>
              </button>

              <span className="text-slate-400">|</span>

              <span className="text-sm font-bold text-white">
                <span className="text-blue-400">{selectedIds.size}</span> baris dipilih
                {selectedDeletableRows.length > 0 && (
                  <span className="text-slate-400 text-xs font-normal ml-1.5">
                    ({selectedDeletableRows.length} ada data anggota)
                  </span>
                )}
              </span>
            </div>

            {/* Kanan: Aksi bulk */}
            <div className="flex items-center gap-2">
              {/* Soft Delete bulk */}
              <button
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  if (onBulkSoftDelete) {
                    onBulkSoftDelete(ids);
                  } else {
                    ids.forEach((id) => onDeleteRow(id));
                  }
                  clearSelection();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-600 text-white border border-rose-500 transition-all cursor-pointer shadow-sm"
                title="Sembunyikan baris yang dipilih dari tampilan (data di database tetap aman)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sembunyikan ({selectedIds.size})</span>
              </button>

              {/* Hard Delete bulk — hanya aktif jika ada baris dengan data anggota */}
              {selectedDeletableRows.length > 0 && (onBulkHardDelete || onHardDeleteRow) && (
                <button
                  onClick={() => {
                    const count = selectedDeletableRows.length;
                    const names = selectedDeletableRows
                      .slice(0, 5)
                      .map((r) => `• ${r.namaLengkap || r.jabatan}`)
                      .join('\n');
                    const more = count > 5 ? `\n  ...dan ${count - 5} lainnya` : '';
                    const confirmed = window.confirm(
                      `⚠️ HAPUS PERMANEN ${count} DATA ANGGOTA\n\n` +
                      `${names}${more}\n\n` +
                      `Semua data ini akan dihapus PERMANEN dari database Supabase.\n` +
                      `Tindakan ini TIDAK DAPAT DIBATALKAN.\n\n` +
                      `Yakin melanjutkan?`
                    );
                    if (!confirmed) return;

                    if (onBulkHardDelete) {
                      onBulkHardDelete(selectedDeletableRows);
                    } else if (onHardDeleteRow) {
                      // fallback: satu per satu tanpa konfirmasi ulang
                      selectedDeletableRows.forEach((r) => onHardDeleteRow(r));
                    }
                    // Soft-delete semua baris terpilih dari UI (sudah dihapus dari DB)
                    Array.from(selectedIds).forEach((id) => onDeleteRow(id));
                    clearSelection();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-900 hover:bg-red-800 text-white border border-red-600 transition-all cursor-pointer shadow-sm"
                  title={`Hapus PERMANEN ${selectedDeletableRows.length} anggota dari database Supabase`}
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Hapus Permanen ({selectedDeletableRows.length})</span>
                </button>
              )}

              {/* Tutup / Batal seleksi */}
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
                title="Batalkan seleksi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Official Header & Title */}
        <div className="text-center pb-5 border-b-2 border-slate-900 dark:border-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Matriks Resmi Susunan Pengurus Partai NasDem</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
            {officialTitle.line1}
          </h2>
          <h3 className="text-sm sm:text-base font-bold tracking-wider text-blue-700 dark:text-blue-400 uppercase mt-0.5 font-sans">
            {officialTitle.line2}
          </h3>
        </div>

        {/* 2. Visual Guide & Status Legend Bar (Memudahkan Pembacaan & Input Excel) */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/40 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Panduan Visual Input Matriks & Sinkronisasi Excel
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Warna dan badge baris diselaraskan langsung dengan format template Excel:
                </p>
              </div>
            </div>

            {/* Quick Status Legend Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Terisi: {totalFilled} Posisi</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Lowong: {totalEmpty} Posisi</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs">
                <span>Total Formasi: {totalRows}</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              💡 <strong>Tips Cepat:</strong> Baris bergaris oranye (⚡ <strong>LOWONG</strong>) menandakan jabatan formasi yang belum terisi di SK. Anda dapat mengunduh <strong>Template Excel</strong> di atas untuk diisi bersama tim, lalu klik <strong>Import Excel</strong>, atau klik <strong>Mode Edit</strong> untuk mengetik langsung.
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
              Kelengkapan: {completionPercentage}%
            </span>
          </div>
        </div>

        {/* 3. Section Tables Rendering */}
        {sections.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic border border-slate-300 dark:border-slate-700 rounded-lg">
            Belum ada data untuk wilayah ini. Klik Tambah Baris atau Edit Tabel untuk mulai mengisi.
          </div>
        ) : (
          sections.map((sec) => {
            return (
              <div
                key={sec.subOrg}
                className={`mb-8 last:mb-0 rounded-2xl overflow-hidden border shadow-sm transition-all ${
                  sec.isPertimbangan
                    ? 'border-indigo-300 dark:border-indigo-800/80 shadow-indigo-100/30'
                    : sec.isPakar
                    ? 'border-purple-300 dark:border-purple-800/80 shadow-purple-100/30'
                    : 'border-blue-300 dark:border-blue-900 shadow-blue-100/30'
                }`}
              >
                {/* Section Header Card */}
                <div
                  className={`px-4.5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white ${
                    sec.isPertimbangan
                      ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900'
                      : sec.isPakar
                      ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900'
                      : 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                      {sec.isPertimbangan ? (
                        <ShieldCheck className="w-5 h-5 text-indigo-300 shrink-0" />
                      ) : sec.isPakar ? (
                        <Award className="w-5 h-5 text-purple-300 shrink-0" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-300 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black tracking-wider uppercase">
                          {sec.subOrg}
                        </h4>
                        <span className="text-[10px] sm:text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 font-semibold text-white">
                          {sec.filledCount} / {sec.rows.length} Terisi
                        </span>
                        {sec.emptyCount > 0 ? (
                          <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/90 text-amber-950 border border-amber-300">
                            ⚡ {sec.emptyCount} Lowong
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-emerald-950 border border-emerald-300">
                            ✓ 100% Lengkap
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <span>Wilayah Teritorial:</span>
                        <span className="font-bold underline text-white">
                          {officialTitle.line2 || officialTitle.line1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isEditMode && onAddNewRowForSubOrg && (
                    <button
                      onClick={() => onAddNewRowForSubOrg(sec.subOrg)}
                      className="text-xs font-bold bg-white text-slate-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-white/40"
                      title={`Tambah baris jabatan baru di ${sec.subOrg}`}
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tambah Baris</span>
                    </button>
                  )}
                </div>

                {/* Section Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider text-center">
                        {/* Checkbox select-all untuk section ini */}
                        <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-9 text-center bg-slate-700">
                          <button
                            onClick={() => {
                              const allInSec = sec.rows.every((r) => selectedIds.has(r.id));
                              selectAllInSection(sec.rows, !allInSec);
                            }}
                            className="flex items-center justify-center w-full cursor-pointer"
                            title={sec.rows.every((r) => selectedIds.has(r.id)) ? 'Batal pilih semua di bagian ini' : 'Pilih semua di bagian ini'}
                          >
                            {sec.rows.every((r) => selectedIds.has(r.id)) ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : sec.rows.some((r) => selectedIds.has(r.id)) ? (
                              <Minus className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-12">
                          NO
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 w-28 text-center">
                          STATUS
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[210px] text-left">
                          JABATAN PENGURUS
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[230px] text-left">
                          NAMA LENGKAP (SESUAI KTP)
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[150px]">
                          NO. NIK KTP
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[140px]">
                          E-KTA NASDEM
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[130px]">
                          NO TELEPON / WA
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[150px]">
                          EMAIL
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[120px]">
                          SOSIAL MEDIA
                        </th>
                        {isEditMode && (
                          <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-24 text-center bg-rose-900 text-white">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-black tracking-wider">AKSI</span>
                              <div className="flex items-center gap-1 text-[9px] font-normal opacity-80">
                                <span title="Sembunyikan baris (data DB aman)">🗑️=hide</span>
                                <span>|</span>
                                <span title="Hapus permanen dari database">💀=hapus</span>
                              </div>
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, idx) => {
                        const isFilled = row.namaLengkap.trim() !== '';

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors text-[11px] ${
                              selectedIds.has(row.id)
                                ? 'bg-blue-100/80 dark:bg-blue-950/40 border-l-4 border-l-blue-500 ring-1 ring-inset ring-blue-400/30'
                                : !isFilled
                                ? 'bg-amber-50/70 dark:bg-amber-950/25 border-l-4 border-l-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                                : 'bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            {/* 0. CHECKBOX SELECT */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center">
                              <button
                                onClick={() => toggleSelect(row.id)}
                                className="flex items-center justify-center w-full cursor-pointer"
                                title={selectedIds.has(row.id) ? 'Batalkan pilihan baris ini' : 'Pilih baris ini'}
                              >
                                {selectedIds.has(row.id) ? (
                                  <CheckSquare className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                )}
                              </button>
                            </td>

                            {/* 1. NO */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {idx + 1}
                            </td>

                            {/* 2. STATUS FORMASI */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-center">
                              {isFilled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>TERISI</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shadow-2xs">
                                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>LOWONG</span>
                                </span>
                              )}
                            </td>

                            {/* 3. JABATAN PENGURUS */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-semibold">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={row.jabatan}
                                  onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                                  className="w-full bg-blue-50/60 dark:bg-slate-800 border border-blue-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isFilled ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                  ></span>
                                  <span
                                    className={
                                      isFilled
                                        ? 'text-slate-800 dark:text-slate-200 font-semibold'
                                        : 'text-amber-950 dark:text-amber-200 font-bold'
                                    }
                                  >
                                    {row.jabatan}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 4. NAMA LENGKAP */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-medium">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="👉 Masukkan Nama KTP..."
                                  value={row.namaLengkap}
                                  onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                                  className={`w-full rounded px-2.5 py-1 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 ${
                                    isFilled
                                      ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                                      : 'bg-amber-50/90 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-500 placeholder-amber-700/60 dark:placeholder-amber-400/60 focus:ring-amber-500'
                                  }`}
                                />
                              ) : isFilled ? (
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {row.namaLengkap}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/80 dark:bg-slate-900 text-amber-900 dark:text-amber-300 border border-dashed border-amber-400 dark:border-amber-700 shadow-2xs">
                                  <span className="text-amber-600 font-extrabold">+</span>
                                  <span>Lowong (Siap Diisi)</span>
                                </span>
                              )}
                            </td>

                            {/* 5. NO. NIK */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono text-center">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="16 Digit NIK..."
                                  value={row.nik}
                                  onChange={(e) => onCellChange(row.id, 'nik', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300">
                                  {row.nik || '-'}
                                </span>
                              )}
                            </td>

                            {/* 6. E-KTA NASDEM */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono text-center">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="Nomor E-KTA..."
                                  value={row.nomorEKTA}
                                  onChange={(e) => onCellChange(row.id, 'nomorEKTA', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="font-semibold text-blue-700 dark:text-blue-400">
                                  {row.nomorEKTA || '-'}
                                </span>
                              )}
                            </td>

                            {/* 7. NO TELEPON / WA */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono text-center text-slate-700 dark:text-slate-300">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="08xxxxxxxxxx"
                                  value={row.nomorHP}
                                  onChange={(e) => onCellChange(row.id, 'nomorHP', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span>{row.nomorHP || '-'}</span>
                              )}
                            </td>

                            {/* 8. EMAIL */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-slate-600 dark:text-slate-400">
                              {isEditMode ? (
                                <input
                                  type="email"
                                  placeholder="email@nasdem.id"
                                  value={row.email}
                                  onChange={(e) => onCellChange(row.id, 'email', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="truncate block max-w-[160px]">
                                  {row.email || '-'}
                                </span>
                              )}
                            </td>

                            {/* 9. SOSIAL MEDIA */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-slate-600 dark:text-slate-400">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="@instagram / facebook"
                                  value={row.sosmed}
                                  onChange={(e) => onCellChange(row.id, 'sosmed', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="truncate block max-w-[130px]">
                                  {row.sosmed || '-'}
                                </span>
                              )}
                            </td>

                            {/* Action Column (Edit Mode) */}
                            {isEditMode && (
                              <td className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* SOFT DELETE: Hapus baris dari tampilan (data DB aman) */}
                                  <button
                                    type="button"
                                    onClick={() => onDeleteRow(row.id)}
                                    className="inline-flex items-center justify-center p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-lg transition-all duration-150 cursor-pointer shadow-xs border border-rose-200 dark:border-rose-900/50 hover:border-rose-500"
                                    title={`Sembunyikan baris jabatan: ${row.jabatan} (data di DB tetap aman)`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* HARD DELETE: Hapus permanen dari database — hanya untuk baris yang punya data anggota */}
                                  {onHardDeleteRow && (row.isExisting || row.originalNik || (row.nik && row.nik.length >= 10)) && (
                                    <button
                                      type="button"
                                      onClick={() => onHardDeleteRow(row)}
                                      className="inline-flex items-center justify-center p-1.5 text-red-700 dark:text-red-400 hover:text-white hover:bg-red-800 dark:hover:bg-red-900 rounded-lg transition-all duration-150 cursor-pointer shadow-xs border border-red-400 dark:border-red-900/70 hover:border-red-800 bg-red-50 dark:bg-red-950/30"
                                      title={`⚠️ HAPUS PERMANEN dari Database: ${row.namaLengkap || row.jabatan} — Tidak dapat dibatalkan!`}
                                    >
                                      <Skull className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
