import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GridRowItem } from './matrixSheetTypes';
import { MatrixMemberAvatar } from './MatrixMemberAvatar';
import { isGeneratedNik, isGeneratedEkta, isIncompleteNik } from '../../../utils/generatedIds';
import { isDefinitiveLeader } from '../../../utils/jobMatchingUtils';

interface MatrixTabletTableProps {
  rows: GridRowItem[];
  selectedIds: Set<string>;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectRow: (id: string, checked: boolean) => void;
  isEditMode: boolean;
  onCellChange: (id: string, field: keyof GridRowItem, value: string) => void;
  onDeleteRow: (id: string) => void;
  onInsertRow?: (targetId: string, position: 'above' | 'below') => void;
}

export const MatrixTabletTable: React.FC<MatrixTabletTableProps> = ({
  rows,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  isEditMode,
  onCellChange,
  onDeleteRow,
  onInsertRow,
}) => {
  return (
    <div className="hidden md:block xl:hidden overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <th className="py-2.5 px-2.5 w-14 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
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
          {rows.map((row, idx) => {
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
                      onChange={(e) => onToggleSelectRow(row.id, e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span>{idx + 1}</span>
                  </div>
                </td>

                {/* Col 2: Jabatan & Nama Pengurus */}
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
                          <MatrixMemberAvatar
                            fotoProfilUrl={row.fotoProfilUrl}
                            namaLengkap={row.namaLengkap}
                            sizeCls="w-6 h-7"
                            initialsCls="text-[8px]"
                          />
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
                      <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                        <div>
                          <span className="text-slate-400 font-sans text-[10px] mr-1">NIK:</span>
                          <span>{nikVal || '-'}</span>
                        </div>
                        {isIncompleteNik(nikVal) && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-sans font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70"
                            title="NIK belum tepat 16 digit standar KTP"
                          >
                            {nikVal.replace(/[^0-9]/g, '').length} digit
                          </span>
                        )}
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
  );
};

