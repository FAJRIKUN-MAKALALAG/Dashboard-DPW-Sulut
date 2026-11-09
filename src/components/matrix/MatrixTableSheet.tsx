import React, { useMemo, useState } from 'react';
import {
  Trash2,
  Plus,
  ShieldCheck,
  Award,
  Building2,
  Info,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { isDefinitiveLeader } from '../../utils/jobMatchingUtils';
import { GridRowItem } from './sheet/matrixSheetTypes';
import { MatrixMobileRowCard } from './sheet/MatrixMobileRowCard';
import { MatrixTabletTable } from './sheet/MatrixTabletTable';
import { MatrixDesktopTable } from './sheet/MatrixDesktopTable';

export type { GridRowItem };

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
  const [showGuide, setShowGuide] = useState(false);

  // Hitung metrik keseluruhan
  const totalRows = gridRows.length;
  const totalFilled = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const totalEmpty = totalRows - totalFilled;
  const completionPercentage = totalRows > 0 ? Math.round((totalFilled / totalRows) * 100) : 0;

  // Kelompokkan baris berdasarkan subOrg
  const sections = useMemo(() => {
    const map = new Map<string, GridRowItem[]>();
    gridRows.forEach((row) => {
      const key = row.subOrg || 'DEWAN PIMPINAN DAERAH';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

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
      .map(([subOrgName, rawRows]) => {
        // JAMINAN STRUKTUR: Ketua SELALU di posisi nomor 1, disusul nomor urut formasi resmi
        const leaders = rawRows.filter((r) => isDefinitiveLeader(r.jabatan));
        const others = rawRows.filter((r) => !isDefinitiveLeader(r.jabatan));
        others.sort((a, b) => a.no - b.no);
        const sortedRows = [...leaders, ...others].map((r, idx) => ({
          ...r,
          no: idx + 1,
        }));

        const filledCount = sortedRows.filter((r) => r.namaLengkap.trim() !== '').length;
        const isPertimbangan = subOrgName.toUpperCase().includes('PERTIMBANGAN');
        const isPakar = subOrgName.toUpperCase().includes('PAKAR');

        return {
          subOrg: subOrgName,
          rows: sortedRows,
          filledCount,
          emptyCount: sortedRows.length - filledCount,
          isPertimbangan,
          isPakar,
        };
      });
  }, [gridRows]);

  const handleToggleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleToggleSelectAllForSection = (secRows: GridRowItem[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      secRows.forEach((r) => {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      });
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto p-0 sm:p-4 lg:p-6 bg-white sm:bg-slate-50/70 dark:bg-slate-950/60">
      <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl p-2.5 sm:p-5 lg:p-6 max-w-full space-y-4 sm:space-y-5">
        {/* 1. Compact Official Header & Legend Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Matriks Resmi Susunan Pengurus
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Kelengkapan: <strong className="text-slate-900 dark:text-white">{completionPercentage}%</strong>
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase mt-1">
              {officialTitle.line1} — <span className="text-slate-600 dark:text-slate-300">{officialTitle.line2}</span>
            </h2>
          </div>

          {/* Right Status Summary & Guide Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Terisi: <strong className="font-mono">{totalFilled}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FDB813]/15 dark:bg-slate-800 text-[#9E6706] dark:text-[#FDB813] border border-[#FDB813]/30 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
              <span>Belum Terisi: <strong className="font-mono">{totalEmpty}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Panduan</span>
              {showGuide ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Visual Guide */}
        {showGuide && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in">
            <p className="font-semibold text-slate-900 dark:text-white">
              Panduan Input Matriks &amp; Sinkronisasi Excel:
            </p>
            <p className="leading-relaxed">
              Baris berstatus <strong>Lowong</strong> menandakan posisi jabatan baku yang belum terisi di SK. Anda dapat mengunduh <strong>Template Excel</strong> dari menu <em>Import &amp; Alat</em> di atas untuk diisi bersama tim lalu klik <strong>Import Excel</strong>, atau klik tombol <strong>Mode Edit</strong> untuk mengetik langsung di tabel/kartu ini.
            </p>
          </div>
        )}

        {/* Bar Seleksi Multi-Baris & Hard Delete Terpilih */}
        {selectedIds.size > 0 && (
          <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{selectedIds.size} baris dipilih.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmBulkDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.size} Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hard Delete Bulk */}
        {showConfirmBulkDelete && (
          <div className="p-4 rounded-xl border border-rose-500 bg-rose-50 dark:bg-rose-950/80 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 dark:text-rose-100">
                <p className="font-bold text-sm">
                  Konfirmasi Hapus ({selectedIds.size} Baris Pengurus)?
                </p>
                <p className="mt-1 text-rose-800 dark:text-rose-300">
                  Data pengurus yang dipilih akan dihapus/diajukan penghapusan dan slot posisinya akan dikosongkan dari matriks ini.
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
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Lanjutkan Hapus</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Section Tables Rendering */}
        {sections.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic border border-slate-200 dark:border-slate-800 rounded-xl">
            Belum ada data untuk wilayah ini. Klik Tambah Baris atau Mode Edit untuk mulai mengisi.
          </div>
        ) : (
          sections.map((sec) => {
            return (
              <div
                key={sec.subOrg}
                className="mb-6 last:mb-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
              >
                {/* Clean Biru Tua NasDem Section Header with Gold Bottom Line */}
                <div className="px-3.5 sm:px-4 py-3 bg-gradient-to-r from-[#1A3282] to-[#21409A] dark:from-[#1A3282] dark:to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b-2 border-[#FDB813]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white/10 text-[#FFDD00] shrink-0">
                      {sec.isPertimbangan ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : sec.isPakar ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold tracking-wide uppercase truncate">
                          {sec.subOrg}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15 font-semibold">
                          {sec.filledCount}/{sec.rows.length} Terisi
                        </span>
                        {sec.emptyCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFDD00]" />
                            <span>{sec.emptyCount} Belum Terisi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Lengkap</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const secIds = sec.rows.map((r) => r.id);
                        const allSelected = secIds.every((id) => selectedIds.has(id));
                        handleToggleSelectAllForSection(sec.rows, !allSelected);
                      }}
                      className="text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>Pilih Semua</span>
                    </button>
                    {onAddNewRowForSubOrg && (
                      <button
                        onClick={() => onAddNewRowForSubOrg(sec.subOrg)}
                        className="text-[11px] font-bold bg-white text-slate-900 hover:bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Tambah baris jabatan baru di ${sec.subOrg}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Baris</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* VIEW 1: PHONE MODE (< md / < 768px) */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                  {sec.rows.map((row, idx) => (
                    <MatrixMobileRowCard
                      key={row.id}
                      row={row}
                      idx={idx}
                      isEditMode={isEditMode}
                      isSelected={selectedIds.has(row.id)}
                      onToggleSelect={(checked) => handleToggleSelectRow(row.id, checked)}
                      onCellChange={onCellChange}
                      onDeleteRow={onDeleteRow}
                      onInsertRow={onInsertRow}
                    />
                  ))}
                </div>

                {/* VIEW 2: TABLET MODE (md to xl / 768px - 1279px) */}
                <MatrixTabletTable
                  rows={sec.rows}
                  selectedIds={selectedIds}
                  onToggleSelectAll={(checked) => handleToggleSelectAllForSection(sec.rows, checked)}
                  onToggleSelectRow={handleToggleSelectRow}
                  isEditMode={isEditMode}
                  onCellChange={onCellChange}
                  onDeleteRow={onDeleteRow}
                  onInsertRow={onInsertRow}
                />

                {/* VIEW 3: DESKTOP MODE (xl+ / >= 1280px) */}
                <MatrixDesktopTable
                  rows={sec.rows}
                  selectedIds={selectedIds}
                  onToggleSelectAll={(checked) => handleToggleSelectAllForSection(sec.rows, checked)}
                  onToggleSelectRow={handleToggleSelectRow}
                  isEditMode={isEditMode}
                  onCellChange={onCellChange}
                  onDeleteRow={onDeleteRow}
                  onInsertRow={onInsertRow}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
