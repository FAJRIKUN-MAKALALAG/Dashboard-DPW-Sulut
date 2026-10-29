import React, { useMemo, useState } from 'react';
import {
  Trash2,
  Plus,
  ShieldCheck,
  Award,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Search,
  X,
  Edit3,
  Copy,
  Check,
  Phone,
  MessageCircle,
  ChevronRight,
  User,
  AlertTriangle,
  Maximize2,
  Minimize2,
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
  const [activeSubOrgFilter, setActiveSubOrgFilter] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [isExpandedHeight, setIsExpandedHeight] = useState(false);
  const [activeDetailRow, setActiveDetailRow] = useState<GridRowItem | null>(null);

  // Overall metric counts
  const totalRows = gridRows.length;
  const totalFilled = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const totalEmpty = totalRows - totalFilled;
  const completionPercentage = totalRows > 0 ? Math.round((totalFilled / totalRows) * 100) : 0;

  // Group rows by subOrg (Dewan Pertimbangan -> Dewan Pakar -> Dewan Pimpinan)
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

  // Filter sections and rows based on activeSubOrgFilter and tableSearch
  const filteredSections = useMemo(() => {
    let result = sections;

    if (activeSubOrgFilter === 'LOWONG') {
      result = result
        .map((sec) => ({
          ...sec,
          rows: sec.rows.filter((r) => r.namaLengkap.trim() === ''),
        }))
        .filter((sec) => sec.rows.length > 0);
    } else if (activeSubOrgFilter !== 'ALL') {
      result = result.filter((sec) => sec.subOrg === activeSubOrgFilter);
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result
        .map((sec) => ({
          ...sec,
          rows: sec.rows.filter(
            (r) =>
              r.jabatan.toLowerCase().includes(q) ||
              r.namaLengkap.toLowerCase().includes(q) ||
              r.nik.toLowerCase().includes(q) ||
              r.nomorEKTA.toLowerCase().includes(q) ||
              r.nomorHP.toLowerCase().includes(q)
          ),
        }))
        .filter((sec) => sec.rows.length > 0);
    }

    return result;
  }, [sections, activeSubOrgFilter, tableSearch]);

  const displayedRowCount = useMemo(() => {
    return filteredSections.reduce((acc, sec) => acc + sec.rows.length, 0);
  }, [filteredSections]);

  const handleToggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
    } else {
      const allDisplayedIds = filteredSections.flatMap((s) => s.rows.map((r) => r.id));
      setSelectedIds(new Set(allDisplayedIds));
    }
  };

  const handleToggleSelectSection = (secRows: GridRowItem[]) => {
    const ids = secRows.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isAllDisplayedSelected =
    displayedRowCount > 0 &&
    filteredSections.every((sec) => sec.rows.every((r) => selectedIds.has(r.id)));

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* 1. Header Ringkas (Compact Banner) */}
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] uppercase tracking-wider shrink-0 border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Matriks Resmi</span>
          </span>
          <div className="min-w-0 truncate">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate font-sans">
              {officialTitle.line1}{' '}
              {officialTitle.line2 && (
                <span className="font-bold text-blue-700 dark:text-blue-400 text-xs ml-1">
                  • {officialTitle.line2}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Status Chips Ringkas */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Terisi: {totalFilled}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Lowong: {totalEmpty}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span>Total: {totalRows}</span>
          </span>
          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* 2. Quick Filter Tabs & Inline Search Toolbar */}
      <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveSubOrgFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
              activeSubOrgFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua Bagian ({totalRows})
          </button>

          {sections.map((sec) => (
            <button
              key={sec.subOrg}
              type="button"
              onClick={() => setActiveSubOrgFilter(sec.subOrg)}
              className={`px-2 py-1 rounded-md font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                activeSubOrgFilter === sec.subOrg
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="truncate max-w-[140px] sm:max-w-none">{sec.subOrg}</span>
              <span className="text-[10px] opacity-75 font-mono">({sec.rows.length})</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setActiveSubOrgFilter('LOWONG')}
            className={`px-2 py-1 rounded-md font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeSubOrgFilter === 'LOWONG'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <span>⚡ Lowong Saja</span>
            <span className="text-[10px] font-mono">({totalEmpty})</span>
          </button>
        </div>

        {/* Search & Height View Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / jabatan / NIK..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-7 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsExpandedHeight((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shrink-0"
            title={isExpandedHeight ? 'Kecilkan Tinggi Tabel' : 'Perluas Tinggi Tabel'}
          >
            {isExpandedHeight ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. Bar Seleksi Multi-Baris & Bulk Delete */}
      {selectedIds.size > 0 && (
        <div className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-semibold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{selectedIds.size} baris dipilih</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-0.5 text-[11px] font-medium rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmBulkDelete(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Bulk Delete */}
      {showConfirmBulkDelete && (
        <div className="p-3 bg-rose-100 dark:bg-rose-950 border-b border-rose-300 dark:border-rose-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <span className="text-rose-950 dark:text-rose-100 font-medium text-[11px]">
            Yakin ingin <strong>hard delete permanen</strong> {selectedIds.size} baris pengurus dari database?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConfirmBulkDelete(false)}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px]"
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
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
            >
              Ya, Hapus Sekarang
            </button>
          </div>
        </div>
      )}

      {/* 4. Table Scroll Container (Bounded max-height & Sticky Header) */}
      <div
        className={`overflow-x-auto overflow-y-auto ${
          isExpandedHeight ? 'max-h-[75vh]' : 'max-h-[56vh] sm:max-h-[62vh]'
        } border-collapse relative bg-white dark:bg-slate-900`}
      >
        <table className="w-full text-left border-collapse text-xs">
          {/* Main Column Header (Sticky top-0) */}
          <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-xs">
            <tr className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center border-b border-slate-700">
              <th className="border border-slate-700 px-1.5 py-1.5 w-8 text-center bg-slate-900">
                <input
                  type="checkbox"
                  checked={isAllDisplayedSelected}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  className="rounded cursor-pointer w-3.5 h-3.5"
                  title="Pilih semua baris yang tampil"
                  aria-label="Pilih semua baris"
                />
              </th>
              <th className="border border-slate-700 px-1 py-1.5 w-10 bg-slate-900">NO</th>
              <th className="border border-slate-700 px-1.5 py-1.5 w-20 bg-slate-900 text-center">
                STATUS
              </th>
              <th className="border border-slate-700 px-2.5 py-1.5 min-w-[190px] text-left bg-slate-900">
                JABATAN PENGURUS
              </th>
              <th className="border border-slate-700 px-2.5 py-1.5 min-w-[210px] text-left bg-slate-900">
                NAMA LENGKAP (SESUAI KTP)
              </th>
              <th className="border border-slate-700 px-2 py-1.5 min-w-[130px] bg-slate-900 text-center">
                NO. NIK KTP
              </th>
              <th className="border border-slate-700 px-2 py-1.5 min-w-[120px] bg-slate-900 text-center">
                E-KTA NASDEM
              </th>
              <th className="border border-slate-700 px-2 py-1.5 min-w-[110px] bg-slate-900 text-center">
                NO TELP / WA
              </th>
              <th className="border border-slate-700 px-2 py-1.5 min-w-[130px] bg-slate-900 text-left">
                EMAIL
              </th>
              <th className="border border-slate-700 px-2 py-1.5 min-w-[110px] bg-slate-900 text-left">
                SOSMED
              </th>
              <th className="border border-slate-700 px-1 py-1.5 w-20 text-center bg-slate-950">
                AKSI
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredSections.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="p-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40"
                >
                  {tableSearch
                    ? `Tidak ada baris yang cocok dengan kata kunci "${tableSearch}".`
                    : 'Tidak ada data untuk kategori ini.'}
                </td>
              </tr>
            ) : (
              filteredSections.map((sec) => {
                return (
                  <React.Fragment key={sec.subOrg}>
                    {/* Compact Section Subheader (Sticky top-[29px]) */}
                    <tr className="sticky top-[29px] z-10 bg-slate-800/95 dark:bg-slate-950/95 backdrop-blur-xs text-white border-y border-slate-700 shadow-2xs">
                      <td colSpan={11} className="py-1 px-2.5 text-[10px] sm:text-[11px] font-bold">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {sec.isPertimbangan ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            ) : sec.isPakar ? (
                              <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span className="uppercase tracking-wide font-black">
                              {sec.subOrg}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/15 text-white">
                              {sec.filledCount}/{sec.rows.length} Terisi
                            </span>
                            {sec.emptyCount > 0 ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-amber-950 font-bold">
                                ⚡ {sec.emptyCount} Lowong
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500 text-emerald-950 font-bold">
                                ✓ Lengkap
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectSection(sec.rows)}
                              className="text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-200 px-2 py-0.5 rounded cursor-pointer transition-all border border-white/20 flex items-center gap-1"
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>Pilih Seksi</span>
                            </button>

                            {onAddNewRowForSubOrg && (
                              <button
                                type="button"
                                onClick={() => onAddNewRowForSubOrg(sec.subOrg)}
                                className="text-[10px] font-bold bg-white text-slate-900 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title={`Tambah baris jabatan di ${sec.subOrg}`}
                              >
                                <Plus className="w-3 h-3 text-blue-600" />
                                <span>+ Baris</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Section Data Rows */}
                    {sec.rows.map((row, idx) => {
                      const isFilled = row.namaLengkap.trim() !== '';
                      const isRowSelected = selectedIds.has(row.id);
                      const isLeader = isDefinitiveLeader(row.jabatan);

                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors text-[11px] leading-tight ${
                            isRowSelected
                              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-l-3 border-l-rose-600'
                              : !isFilled
                              ? 'bg-amber-50/60 dark:bg-amber-950/25 border-l-3 border-l-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
                              : 'bg-white dark:bg-slate-900 border-l-3 border-l-emerald-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          {/* 0. Checkbox */}
                          <td className="border border-slate-200 dark:border-slate-800 px-1 py-1 text-center">
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
                              className="rounded cursor-pointer w-3.5 h-3.5"
                              aria-label={`Pilih baris ${row.jabatan}`}
                            />
                          </td>

                          {/* 1. NO */}
                          <td className="border border-slate-200 dark:border-slate-800 px-1 py-1 text-center font-mono font-bold text-slate-600 dark:text-slate-400 text-[10px]">
                            {isLeader ? (
                              <span
                                className="inline-flex items-center justify-center px-1 py-0.2 rounded font-black text-[9px] bg-amber-500 text-slate-950 shadow-2xs"
                                title="Ketua Definitif #1"
                              >
                                #1
                              </span>
                            ) : (
                              idx + 1
                            )}
                          </td>

                          {/* 2. STATUS FORMASI */}
                          <td className="border border-slate-200 dark:border-slate-800 px-1.5 py-1 text-center">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>TERISI</span>
                              </span>
                            ) : (
                              <div className="inline-flex items-center justify-center gap-1">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-400 dark:border-amber-700">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>LOWONG</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row.id)}
                                  className="p-0.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded transition-all cursor-pointer"
                                  title="Hapus slot lowong ini"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 3. JABATAN PENGURUS */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 font-semibold">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={row.jabatan}
                                onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                                className="w-full bg-blue-50/50 dark:bg-slate-800 border border-blue-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isFilled ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                />
                                {isLeader && (
                                  <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-amber-500 text-slate-950 tracking-wider">
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
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 font-medium">
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder="Nama sesuai KTP..."
                                value={row.namaLengkap}
                                onChange={(e) =>
                                  onCellChange(row.id, 'namaLengkap', e.target.value)
                                }
                                className={`w-full rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-1 ${
                                  isFilled
                                    ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-blue-500'
                                    : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-400 text-slate-900 dark:text-white placeholder-amber-700/60 focus:ring-amber-500'
                                }`}
                              />
                            ) : isFilled ? (
                              <span className="font-bold text-slate-900 dark:text-white">
                                {row.namaLengkap}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40 border border-dashed border-amber-400 dark:border-amber-700">
                                <span>+ Lowong (Siap Diisi)</span>
                              </span>
                            )}
                          </td>

                          {/* 5. NO. NIK KTP */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 font-mono text-center text-[10px]">
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder={isGeneratedNik(row.nik) ? '-' : '16 Digit NIK'}
                                value={isGeneratedNik(row.nik) ? '' : row.nik}
                                onChange={(e) => onCellChange(row.id, 'nik', e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : isGeneratedNik(row.nik) || !row.nik ? (
                              <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{row.nik}</span>
                            )}
                          </td>

                          {/* 6. E-KTA NASDEM */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 font-mono text-center text-[10px]">
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder={isGeneratedEkta(row.nomorEKTA) ? '-' : 'Nomor E-KTA'}
                                value={isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA}
                                onChange={(e) =>
                                  onCellChange(row.id, 'nomorEKTA', e.target.value)
                                }
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : isGeneratedEkta(row.nomorEKTA) || !row.nomorEKTA ? (
                              <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                            ) : (
                              <span className="font-semibold text-blue-700 dark:text-blue-400">
                                {row.nomorEKTA}
                              </span>
                            )}
                          </td>

                          {/* 7. NO TELEPON / WA */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 font-mono text-center text-[10px] text-slate-700 dark:text-slate-300">
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder="08xxxxxxxxxx"
                                value={row.nomorHP}
                                onChange={(e) => onCellChange(row.id, 'nomorHP', e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span>{row.nomorHP || '-'}</span>
                            )}
                          </td>

                          {/* 8. EMAIL */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 text-slate-600 dark:text-slate-400 text-[10px]">
                            {isEditMode ? (
                              <input
                                type="email"
                                placeholder="email@nasdem.id"
                                value={row.email}
                                onChange={(e) => onCellChange(row.id, 'email', e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="truncate block max-w-[140px]">
                                {row.email || '-'}
                              </span>
                            )}
                          </td>

                          {/* 9. SOSIAL MEDIA */}
                          <td className="border border-slate-200 dark:border-slate-800 px-2 py-1 text-slate-600 dark:text-slate-400 text-[10px]">
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder="@sosmed"
                                value={row.sosmed}
                                onChange={(e) => onCellChange(row.id, 'sosmed', e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="truncate block max-w-[110px]">
                                {row.sosmed || '-'}
                              </span>
                            )}
                          </td>

                          {/* 10. AKSI */}
                          <td className="border border-slate-200 dark:border-slate-800 px-1 py-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Quick Info & Direct Contact Modal Trigger */}
                              <button
                                type="button"
                                onClick={() => setActiveDetailRow(row)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Lihat detail & hubungi pengurus ini"
                              >
                                <User className="w-3 h-3" />
                              </button>

                              {onInsertRow && (
                                <button
                                  type="button"
                                  onClick={() => onInsertRow(row.id, 'below')}
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                  title={`Sisipkan baris baru di bawah No. ${idx + 1}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onDeleteRow(row.id)}
                                className="p-1 rounded text-rose-500 hover:text-white hover:bg-rose-600 transition-all cursor-pointer"
                                title={
                                  !isFilled
                                    ? 'Hapus slot lowong ini'
                                    : `Hapus baris: ${row.namaLengkap || row.jabatan}`
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Mobile Detail Modal & Direct Communication */}
      {activeDetailRow && (
        <MobileDetailModal
          row={activeDetailRow}
          isEditMode={isEditMode}
          onClose={() => setActiveDetailRow(null)}
          onCellChange={(field, value) => {
            onCellChange(activeDetailRow.id, field, value);
            setActiveDetailRow((prev) => (prev ? { ...prev, [field]: value } : null));
          }}
          onDeleteRow={() => {
            onDeleteRow(activeDetailRow.id);
            setActiveDetailRow(null);
          }}
          onInsertRow={
            onInsertRow
              ? () => {
                  onInsertRow(activeDetailRow.id, 'below');
                  setActiveDetailRow(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

// =============================================================================
// Quick Contact & Detail Modal (Bottom Sheet Slide-up)
// =============================================================================
interface MobileDetailModalProps {
  row: GridRowItem;
  isEditMode: boolean;
  onClose: () => void;
  onCellChange: (field: keyof GridRowItem, value: string) => void;
  onDeleteRow: () => void;
  onInsertRow?: () => void;
}

const MobileDetailModal: React.FC<MobileDetailModalProps> = ({
  row,
  isEditMode,
  onClose,
  onCellChange,
  onDeleteRow,
  onInsertRow,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const isFilled = row.namaLengkap.trim() !== '';
  const isLeader = isDefinitiveLeader(row.jabatan);
  const nik = isGeneratedNik(row.nik) ? '' : row.nik;
  const ekta = isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getWhatsAppLink = (hp?: string) => {
    if (!hp) return null;
    const digits = hp.replace(/\D/g, '');
    if (!digits) return null;
    let phone = digits;
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    return `https://wa.me/${phone}`;
  };

  const canEdit = isEditMode || isQuickEditing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isLeader && (
                <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-500 text-slate-950 uppercase tracking-wider">
                  #1 KETUA
                </span>
              )}
              {isFilled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>TERISI</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  <span>LOWONG (BELUM TERISI)</span>
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
              {row.jabatan}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.subOrg || 'Dewan Pimpinan'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {canEdit ? (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Nama Lengkap (Sesuai KTP)
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama lengkap..."
                  value={row.namaLengkap}
                  onChange={(e) => onCellChange('namaLengkap', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Jabatan Pengurus
                </label>
                <input
                  type="text"
                  value={row.jabatan}
                  onChange={(e) => onCellChange('jabatan', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    No. NIK KTP (16 Digit)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="16 Digit NIK"
                    value={nik}
                    onChange={(e) => onCellChange('nik', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Nomor E-KTA NasDem
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor E-KTA"
                    value={ekta}
                    onChange={(e) => onCellChange('nomorEKTA', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                    value={row.nomorHP}
                    onChange={(e) => onCellChange('nomorHP', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@nasdem.id"
                    value={row.email}
                    onChange={(e) => onCellChange('email', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Sosial Media
                </label>
                <input
                  type="text"
                  placeholder="@instagram / facebook"
                  value={row.sosmed}
                  onChange={(e) => onCellChange('sosmed', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Nama Kader Section */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-0.5">
                  Nama Pengurus Terdaftar
                </span>
                {isFilled ? (
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {row.namaLengkap}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      ⚡ Posisi ini belum memiliki pengurus aktif (Lowong).
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsQuickEditing(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ketik & Isi Data Kader Ini</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Data Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">
                      NIK KTP
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {nik || <span className="text-slate-400 italic font-normal">Belum ada</span>}
                    </span>
                  </div>
                  {nik && (
                    <button
                      type="button"
                      onClick={() => handleCopy(nik, 'nik')}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Salin NIK"
                    >
                      {copiedKey === 'nik' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">
                      E-KTA NasDem
                    </span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs">
                      {ekta || <span className="text-slate-400 italic font-normal">Belum ada</span>}
                    </span>
                  </div>
                  {ekta && (
                    <button
                      type="button"
                      onClick={() => handleCopy(ekta, 'ekta')}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Salin E-KTA"
                    >
                      {copiedKey === 'ekta' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Kontak & Direct Actions */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Kontak & Komunikasi Langsung
                </span>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {row.nomorHP || (
                      <span className="text-slate-400 font-sans italic text-[11px] font-normal">
                        Nomor HP belum terdaftar
                      </span>
                    )}
                  </div>

                  {row.nomorHP && (
                    <div className="flex items-center gap-1.5">
                      {getWhatsAppLink(row.nomorHP) && (
                        <a
                          href={getWhatsAppLink(row.nomorHP)!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <a
                        href={`tel:${row.nomorHP}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Telepon</span>
                      </a>
                    </div>
                  )}
                </div>

                {(row.email || row.sosmed) && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {row.email && (
                      <div>
                        <span className="text-slate-400 block">Email:</span>
                        <a
                          href={`mailto:${row.email}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {row.email}
                        </a>
                      </div>
                    )}
                    {row.sosmed && (
                      <div>
                        <span className="text-slate-400 block">Sosial Media:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {row.sosmed}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {onInsertRow && (
              <button
                type="button"
                onClick={onInsertRow}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Sisip Baris</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDeleteRow}
              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Posisi</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditMode && isFilled && !isQuickEditing && (
              <button
                type="button"
                onClick={() => setIsQuickEditing(true)}
                className="px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Data</span>
              </button>
            )}

            {isQuickEditing && (
              <button
                type="button"
                onClick={() => setIsQuickEditing(false)}
                className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
              >
                Selesai Edit
              </button>
            )}

            {!isQuickEditing && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer hover:bg-slate-300"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
