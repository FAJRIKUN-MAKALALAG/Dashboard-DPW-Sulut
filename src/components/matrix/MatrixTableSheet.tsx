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
import { isGeneratedNik, isGeneratedEkta } from '../../utils/generatedIds';
import { isDefinitiveLeader } from '../../utils/jobMatchingUtils';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';

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
  fotoProfilUrl?: string;
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
              <span>Lowong: <strong className="font-mono">{totalEmpty}</strong></span>
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
                            <span>{sec.emptyCount} Lowong</span>
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

                {/* ========================================================================= */}
                {/* VIEW 1: PHONE MODE (< md / < 768px) - Compact Slot Rows & Clean Cards     */}
                {/* ========================================================================= */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                  {sec.rows.map((row, idx) => (
                    <MobileRowCard
                      key={row.id}
                      row={row}
                      idx={idx}
                      isEditMode={isEditMode}
                      isSelected={selectedIds.has(row.id)}
                      onToggleSelect={(checked) =>
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        })
                      }
                      onCellChange={onCellChange}
                      onDeleteRow={onDeleteRow}
                      onInsertRow={onInsertRow}
                    />
                  ))}
                </div>

                {/* ========================================================================= */}
                {/* VIEW 2: TABLET MODE (md to xl / 768px - 1279px) - Smart 5-Col Grouped     */}
                {/* Prevents 10-column vertical text squishing on iPads & Tablets!            */}
                {/* ========================================================================= */}
                <div className="hidden md:block xl:hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-2.5 w-14 text-center">
                          <div className="flex items-center justify-center gap-1.5">
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
                            />
                            <span>No</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">Jabatan &amp; Nama Pengurus</th>
                        <th className="py-2.5 px-3 w-48">Identitas (NIK &amp; E-KTA)</th>
                        <th className="py-2.5 px-3 w-48">Kontak &amp; Email</th>
                        <th className="py-2.5 px-2.5 w-20 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {sec.rows.map((row, idx) => {
                        const isFilled = row.namaLengkap.trim() !== '';
                        const isRowSelected = selectedIds.has(row.id);
                        const nikVal = isGeneratedNik(row.nik) ? '' : row.nik;
                        const ektaVal = isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA;

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors align-top ${
                              isRowSelected
                                ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                : isFilled
                                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                : 'bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/60'
                            }`}
                          >
                            {/* Col 1: Checkbox + No */}
                            <td className="py-2.5 px-2.5 text-center font-mono text-xs font-bold text-slate-500">
                              <div className="flex items-center justify-center gap-1.5 pt-0.5">
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
                                <span>{idx + 1}</span>
                              </div>
                            </td>

                            {/* Col 2: Jabatan & Nama Pengurus (Stacked cleanly) */}
                            <td className="py-2.5 px-3">
                              {isEditMode ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={row.jabatan}
                                    onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                                    placeholder="Nama Jabatan..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                  />
                                  <input
                                    type="text"
                                    value={row.namaLengkap}
                                    onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                                    placeholder="Nama Lengkap sesuai KTP..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isFilled ? 'bg-emerald-500' : 'bg-[#FDB813]'
                                      }`}
                                    />
                                    {isDefinitiveLeader(row.jabatan) && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#FDB813] text-slate-950">
                                        KETUA
                                      </span>
                                    )}
                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                      {row.jabatan}
                                    </span>
                                  </div>

                                  {isFilled ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-6 h-7 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        {row.fotoProfilUrl ? (
                                          <img
                                            src={resolveImageUrl(row.fotoProfilUrl)}
                                            alt={row.namaLengkap}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div
                                            className={`w-full h-full flex items-center justify-center text-[8px] font-bold font-mono ${getAvatarColor(row.namaLengkap).bgClass} ${getAvatarColor(row.namaLengkap).textClass}`}
                                          >
                                            {getInitials(row.namaLengkap)}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {row.namaLengkap}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-block mt-1 text-[11px] italic text-slate-400">
                                      Belum terisi (Lowong)
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Col 3: Identitas (NIK & E-KTA) */}
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {isEditMode ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={nikVal}
                                    onChange={(e) => onCellChange(row.id, 'nik', e.target.value)}
                                    placeholder="16 Digit NIK..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-[11px] font-mono"
                                  />
                                  <input
                                    type="text"
                                    value={ektaVal}
                                    onChange={(e) => onCellChange(row.id, 'nomorEKTA', e.target.value)}
                                    placeholder="No. E-KTA..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-[11px] font-mono"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-slate-700 dark:text-slate-300 truncate">
                                    <span className="text-slate-400 font-sans text-[10px] mr-1">NIK:</span>
                                    {nikVal || '-'}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400 truncate">
                                    <span className="text-slate-400 font-sans text-[10px] mr-1">KTA:</span>
                                    {ektaVal || '-'}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Col 4: Kontak (HP, Email, Sosmed) */}
                            <td className="py-2.5 px-3 text-[11px]">
                              {isEditMode ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={row.nomorHP}
                                    onChange={(e) => onCellChange(row.id, 'nomorHP', e.target.value)}
                                    placeholder="No. WA / HP..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-[11px] font-mono"
                                  />
                                  <input
                                    type="email"
                                    value={row.email}
                                    onChange={(e) => onCellChange(row.id, 'email', e.target.value)}
                                    placeholder="Email..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-[11px]"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                                    {row.nomorHP || '-'}
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                                    {row.email || row.sosmed || '-'}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Col 5: Aksi */}
                            <td className="py-2.5 px-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onInsertRow && (
                                  <button
                                    type="button"
                                    onClick={() => onInsertRow(row.id, 'below')}
                                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                    title="Sisipkan baris di bawah"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                  title="Hapus baris"
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

                {/* ========================================================================= */}
                {/* VIEW 3: DESKTOP MODE (xl+ / >= 1280px) - Full 10-Col Spreadsheet Matrix   */}
                {/* ========================================================================= */}
                <div className="hidden xl:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-700">
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 w-9 text-center">
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
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 w-10">
                          NO
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 w-24 text-center">
                          STATUS
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 min-w-[180px] text-left">
                          JABATAN PENGURUS
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 min-w-[190px] text-left">
                          NAMA LENGKAP (SESUAI KTP)
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 min-w-[130px]">
                          NO. NIK KTP
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 min-w-[120px]">
                          E-KTA NASDEM
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 min-w-[115px]">
                          NO TELEPON / WA
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 min-w-[130px]">
                          EMAIL
                        </th>
                        <th className="border-r border-slate-200 dark:border-slate-700 px-2.5 py-2.5 min-w-[105px]">
                          SOSIAL MEDIA
                        </th>
                        <th className="px-2 py-2.5 w-20 text-center">
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {sec.rows.map((row, idx) => {
                        const isFilled = row.namaLengkap.trim() !== '';
                        const isRowSelected = selectedIds.has(row.id);

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors text-[11px] ${
                              isRowSelected
                                ? 'bg-rose-50/80 dark:bg-rose-950/40'
                                : !isFilled
                                ? 'bg-slate-50/60 dark:bg-slate-950/30 hover:bg-slate-100/60 dark:hover:bg-slate-900/50'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Checkbox Seleksi Baris */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-2 text-center">
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
                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                              {isDefinitiveLeader(row.jabatan) ? (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-black text-[10px] bg-[#FDB813] text-slate-950" title="Ketua Definitif #1">
                                  #1
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </td>

                            {/* 2. STATUS FORMASI */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-2 py-1.5 text-center">
                              {isFilled ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Terisi</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FDB813]/15 dark:bg-slate-800 text-[#9E6706] dark:text-[#FDB813] border border-[#FDB813]/30 dark:border-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
                                  <span>Lowong</span>
                                </span>
                              )}
                            </td>

                            {/* 3. JABATAN PENGURUS */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 font-semibold">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={row.jabatan}
                                  onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isDefinitiveLeader(row.jabatan) && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FDB813] text-slate-950 tracking-wider">
                                      KETUA
                                    </span>
                                  )}
                                  <span
                                    className={
                                      isFilled
                                        ? 'text-slate-800 dark:text-slate-200 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 font-medium'
                                    }
                                  >
                                    {row.jabatan}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 4. NAMA LENGKAP */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 font-medium">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="Masukkan Nama KTP..."
                                  value={row.namaLengkap}
                                  onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                                  className="w-full rounded px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : isFilled ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-7.5 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    {row.fotoProfilUrl ? (
                                      <img
                                        src={resolveImageUrl(row.fotoProfilUrl)}
                                        alt={row.namaLengkap}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div
                                        className={`w-full h-full flex items-center justify-center text-[8px] font-bold font-mono ${getAvatarColor(row.namaLengkap).bgClass} ${getAvatarColor(row.namaLengkap).textClass}`}
                                      >
                                        {getInitials(row.namaLengkap)}
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {row.namaLengkap}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Belum terisi
                                </span>
                              )}
                            </td>

                            {/* 5. NO. NIK */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 font-mono text-center">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder={isGeneratedNik(row.nik) ? '- (Belum ada NIK)' : '16 Digit NIK...'}
                                  value={isGeneratedNik(row.nik) ? '' : row.nik}
                                  onChange={(e) => onCellChange(row.id, 'nik', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : isGeneratedNik(row.nik) || !row.nik ? (
                                <span className="text-slate-400 dark:text-slate-500 font-sans">-</span>
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300">{row.nik}</span>
                              )}
                            </td>

                            {/* 6. E-KTA NASDEM */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 font-mono text-center">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder={isGeneratedEkta(row.nomorEKTA) ? '- (Belum ada KTA)' : 'Nomor E-KTA...'}
                                  value={isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA}
                                  onChange={(e) => onCellChange(row.id, 'nomorEKTA', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : isGeneratedEkta(row.nomorEKTA) || !row.nomorEKTA ? (
                                <span className="text-slate-400 dark:text-slate-500 font-sans">-</span>
                              ) : (
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {row.nomorEKTA}
                                </span>
                              )}
                            </td>

                            {/* 7. NO TELEPON / WA */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 font-mono text-center text-slate-700 dark:text-slate-300">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="08xxxxxxxxxx"
                                  value={row.nomorHP}
                                  onChange={(e) => onCellChange(row.id, 'nomorHP', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : (
                                <span>{row.nomorHP || '-'}</span>
                              )}
                            </td>

                            {/* 8. EMAIL */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 text-slate-600 dark:text-slate-400">
                              {isEditMode ? (
                                <input
                                  type="email"
                                  placeholder="email@nasdem.id"
                                  value={row.email}
                                  onChange={(e) => onCellChange(row.id, 'email', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : (
                                <span className="truncate block max-w-[160px]">{row.email || '-'}</span>
                              )}
                            </td>

                            {/* 9. SOSIAL MEDIA */}
                            <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 text-slate-600 dark:text-slate-400">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  placeholder="@instagram"
                                  value={row.sosmed}
                                  onChange={(e) => onCellChange(row.id, 'sosmed', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              ) : (
                                <span className="truncate block max-w-[130px]">{row.sosmed || '-'}</span>
                              )}
                            </td>

                            {/* 10. AKSI */}
                            <td className="px-1.5 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onInsertRow && (
                                  <button
                                    type="button"
                                    onClick={() => onInsertRow(row.id, 'below')}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                    title={`Sisipkan baris baru di bawah No. ${idx + 1}`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
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

// =============================================================================
// Mobile Row Card (< md / < 768px):
// - When !isEditMode and !isFilled (Lowong): Compact 1-Line Slot Row
// - When isFilled or isEditMode: Clean Executive Card with 2-Col Identity Grid
// =============================================================================
interface MobileRowCardProps {
  row: GridRowItem;
  idx: number;
  isEditMode: boolean;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onCellChange: (id: string, field: keyof GridRowItem, value: string) => void;
  onDeleteRow: (id: string) => void;
  onInsertRow?: (targetId: string, position: 'above' | 'below') => void;
}

const mobileInputCls =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900';

const MobileRowCard: React.FC<MobileRowCardProps> = ({
  row,
  idx,
  isEditMode,
  isSelected,
  onToggleSelect,
  onCellChange,
  onDeleteRow,
  onInsertRow,
}) => {
  const isFilled = row.namaLengkap.trim() !== '';
  const isLeader = isDefinitiveLeader(row.jabatan);
  const nik = isGeneratedNik(row.nik) ? '' : row.nik;
  const ekta = isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA;

  // COMPACT 1-LINE ROW FOR VACANT SLOTS (WHEN NOT IN EDIT MODE)
  if (!isEditMode && !isFilled) {
    return (
      <div
        className={`px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${
          isSelected
            ? 'bg-rose-50 dark:bg-rose-950/30'
            : 'bg-slate-50/60 dark:bg-slate-950/30'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="w-3.5 h-3.5 rounded cursor-pointer shrink-0"
          />
          <span className="font-mono font-bold text-[11px] text-slate-400 w-5 shrink-0">
            {idx + 1}.
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            {row.jabatan}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDB813]/15 dark:bg-slate-900 text-[#9E6706] dark:text-[#FDB813] border border-[#FDB813]/30 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
            <span>Lowong</span>
          </span>
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
            title="Hapus slot lowong"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // FULL CARD FOR FILLED MEMBERS OR EDIT MODE
  const details: {
    label: string;
    field: keyof GridRowItem;
    value: string;
    placeholder: string;
    mono?: boolean;
    type?: string;
  }[] = [
    { label: 'NIK KTP', field: 'nik', value: nik, placeholder: '16 Digit NIK', mono: true },
    { label: 'No. E-KTA', field: 'nomorEKTA', value: ekta, placeholder: 'Nomor E-KTA', mono: true },
    { label: 'Telepon / WA', field: 'nomorHP', value: row.nomorHP, placeholder: '08xxxxxxxxxx', mono: true, type: 'tel' },
    { label: 'Email', field: 'email', value: row.email, placeholder: 'email@nasdem.id', type: 'email' },
    { label: 'Sosial Media', field: 'sosmed', value: row.sosmed, placeholder: '@instagram' },
  ];

  return (
    <div
      className={`p-3.5 transition-colors ${
        isSelected
          ? 'bg-rose-50 dark:bg-rose-950/40'
          : 'bg-white dark:bg-slate-900'
      }`}
    >
      {/* Top row: checkbox, number, status, actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="w-3.5 h-3.5 rounded cursor-pointer shrink-0"
          />
          <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
          {isLeader && (
            <span className="px-1.5 py-0.5 rounded font-black text-[9.5px] bg-[#FDB813] text-slate-950 uppercase">
              Ketua
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-emerald-500' : 'bg-[#FDB813]'}`} />
            <span>{isFilled ? 'Terisi' : 'Lowong'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onInsertRow && (
            <button
              type="button"
              onClick={() => onInsertRow(row.id, 'below')}
              className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Sisip
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Hapus baris"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Jabatan & Nama */}
      <div className="mt-2.5">
        {isEditMode ? (
          <div className="space-y-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jabatan</span>
              <input
                type="text"
                value={row.jabatan}
                onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                className={`${mobileInputCls} mt-0.5 font-semibold`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nama Lengkap (KTP)</span>
              <input
                type="text"
                placeholder="Masukkan Nama KTP..."
                value={row.namaLengkap}
                onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                className={`${mobileInputCls} mt-0.5 font-bold`}
              />
            </label>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-10 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {row.fotoProfilUrl ? (
                <img
                  src={resolveImageUrl(row.fotoProfilUrl)}
                  alt={row.namaLengkap}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-[10px] font-bold font-mono ${getAvatarColor(row.namaLengkap).bgClass} ${getAvatarColor(row.namaLengkap).textClass}`}
                >
                  {getInitials(row.namaLengkap)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {row.jabatan}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {row.namaLengkap}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Detail Grid */}
      {isEditMode ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {details.map((d) => (
            <label key={d.field} className={d.field === 'sosmed' ? 'col-span-2' : 'block'}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{d.label}</span>
              <input
                type={d.type || 'text'}
                inputMode={d.field === 'nik' || d.field === 'nomorHP' ? 'numeric' : undefined}
                placeholder={d.placeholder}
                value={d.value}
                onChange={(e) => onCellChange(row.id, d.field, e.target.value)}
                className={`${mobileInputCls} mt-0.5 ${d.mono ? 'font-mono' : ''}`}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">NIK KTP</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {nik || '-'}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">No. E-KTA</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {ekta || '-'}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Telepon / WA</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {row.nomorHP || '-'}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Email / Sosmed</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {row.email || row.sosmed || '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
