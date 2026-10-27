import React, { useMemo, useState } from 'react';
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
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { isGeneratedNik, isGeneratedEkta } from '../../utils/generatedIds';
import { isDefinitiveLeader } from '../../utils/jobMatchingUtils';

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
  onDeleteSelectedRows?: (selectedIds: string[]) => void;
  onAddNewRowForSubOrg?: (subOrg: string) => void;
  onInsertRow?: (targetId: string, position: 'above' | 'below') => void;
}

export const MatrixTableSheet: React.FC<MatrixTableSheetProps> = ({
  gridRows,
  isEditMode,
  officialTitle,
  onCellChange,
  onDeleteRow,
  onDeleteSelectedRows,
  onAddNewRowForSubOrg,
  onInsertRow,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);
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

        {/* Bar Seleksi Multi-Baris & Hard Delete Terpilih */}
        {selectedIds.size > 0 && (
          <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{selectedIds.size} baris pengurus dipilih di matriks ini.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batalkan Pilihan
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmBulkDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hard Delete {selectedIds.size} Data Terpilih</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hard Delete Bulk */}
        {showConfirmBulkDelete && (
          <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/80 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 dark:text-rose-100">
                <p className="font-bold text-sm">
                  Konfirmasi Hard Delete Permanen ({selectedIds.size} Data Pengurus)?
                </p>
                <p className="mt-1 text-rose-800 dark:text-rose-300">
                  Data pengurus yang dipilih akan <strong>dihapus permanen dari database Supabase (melalui backend)</strong> dan slot posisinya akan dikosongkan/dibersihkan dari matriks ini.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmBulkDelete(false)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSelectedRows) {
                    onDeleteSelectedRows(Array.from(selectedIds));
                  }
                  setSelectedIds(new Set());
                  setShowConfirmBulkDelete(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Permanen Sekarang</span>
              </button>
            </div>
          </div>
        )}

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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const secIds = sec.rows.map((r) => r.id);
                        const allSelected = secIds.every((id) => selectedIds.has(id));
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (allSelected) {
                            secIds.forEach((id) => next.delete(id));
                          } else {
                            secIds.forEach((id) => next.add(id));
                          }
                          return next;
                        });
                      }}
                      className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Pilih Bagian Ini</span>
                    </button>
                    {onAddNewRowForSubOrg && (
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
                </div>

                {/* Section Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider text-center">
                        <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={sec.rows.length > 0 && sec.rows.every((r) => selectedIds.has(r.id))}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                sec.rows.forEach((r) => {
                                  if (checked) next.add(r.id);
                                  else next.delete(r.id);
                                });
                                return next;
                              });
                            }}
                            className="rounded cursor-pointer"
                            title="Pilih semua baris di seksi ini"
                          />
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
                        <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-24 text-center bg-slate-900 text-white">
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, idx) => {
                        const isFilled = row.namaLengkap.trim() !== '';
                        const isRowSelected = selectedIds.has(row.id);

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors text-[11px] ${
                              isRowSelected
                                ? 'bg-rose-100/70 dark:bg-rose-950/40 border-l-4 border-l-rose-600'
                                : !isFilled
                                ? 'bg-amber-50/70 dark:bg-amber-950/25 border-l-4 border-l-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                                : 'bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            {/* Checkbox Seleksi Baris */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (checked) next.add(row.id);
                                    else next.delete(row.id);
                                    return next;
                                  });
                                }}
                                className="rounded cursor-pointer"
                              />
                            </td>

                            {/* 1. NO */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {isDefinitiveLeader(row.jabatan) ? (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-black text-[10px] bg-amber-500 text-slate-950 shadow-xs" title="Ketua Definitif #1">
                                  #1
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </td>

                            {/* 2. STATUS FORMASI */}
                            <td className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center">
                              {isFilled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>TERISI</span>
                                </span>
                              ) : (
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shadow-2xs">
                                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span>LOWONG</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteRow(row.id)}
                                    className="p-1 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 rounded-md transition-all cursor-pointer border border-rose-200 dark:border-rose-900/50 hover:border-rose-600 shadow-2xs"
                                    title="Hapus slot lowong ini"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isFilled ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                  ></span>
                                  {isDefinitiveLeader(row.jabatan) && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 tracking-wider">
                                      KETUA
                                    </span>
                                  )}
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
                                  placeholder={isGeneratedNik(row.nik) ? '- (Belum ada NIK)' : '16 Digit NIK...'}
                                  value={isGeneratedNik(row.nik) ? '' : row.nik}
                                  onChange={(e) => onCellChange(row.id, 'nik', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : isGeneratedNik(row.nik) || !row.nik ? (
                                <span className="text-slate-400 dark:text-slate-500 font-sans italic font-normal" title="NIK belum ada / tidak tertera di Excel">
                                  -
                                </span>
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300">
                                  {row.nik}
                                </span>
                              )}
                            </td>

                            {/* 6. E-KTA NASDEM */}
                            <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-mono text-center">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder={isGeneratedEkta(row.nomorEKTA) ? '- (Belum ada KTA)' : 'Nomor E-KTA...'}
                                  value={isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA}
                                  onChange={(e) => onCellChange(row.id, 'nomorEKTA', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : isGeneratedEkta(row.nomorEKTA) || !row.nomorEKTA ? (
                                <span className="text-slate-400 dark:text-slate-500 font-sans italic font-normal" title="E-KTA belum ada">
                                  -
                                </span>
                              ) : (
                                <span className="font-semibold text-blue-700 dark:text-blue-400">
                                  {row.nomorEKTA}
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

                            {/* Action Column */}
                            <td className="border border-slate-300 dark:border-slate-700 px-1.5 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onInsertRow && (
                                  <button
                                    type="button"
                                    onClick={() => onInsertRow(row.id, 'below')}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 rounded-md transition-all cursor-pointer border border-blue-300 dark:border-blue-800 shadow-2xs"
                                    title={`Sisipkan baris baru di bawah No. ${idx + 1}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Sisip</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row.id)}
                                  className="inline-flex items-center justify-center p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 rounded-md transition-all cursor-pointer border border-rose-200 dark:border-rose-900/50 hover:border-rose-600 shadow-2xs"
                                  title={!isFilled ? 'Hapus slot lowong ini' : `Hapus baris: ${row.namaLengkap || row.jabatan}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
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
