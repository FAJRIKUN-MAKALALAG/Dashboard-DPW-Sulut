import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GridRowItem } from './matrixSheetTypes';
import { MatrixMemberAvatar } from './MatrixMemberAvatar';
import { isGeneratedNik, isGeneratedEkta, isIncompleteNik } from '../../../utils/generatedIds';
import { isDefinitiveLeader } from '../../../utils/jobMatchingUtils';

interface MatrixDesktopTableProps {
  rows: GridRowItem[];
  selectedIds: Set<string>;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectRow: (id: string, checked: boolean) => void;
  isEditMode: boolean;
  onCellChange: (id: string, field: keyof GridRowItem, value: string) => void;
  onDeleteRow: (id: string) => void;
  onInsertRow?: (targetId: string, position: 'above' | 'below') => void;
}

export const MatrixDesktopTable: React.FC<MatrixDesktopTableProps> = ({
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
    <div className="hidden xl:block overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-700">
            <th className="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 w-9 text-center">
              <input
                type="checkbox"
                checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
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
          {rows.map((row, idx) => {
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
                    onChange={(e) => onToggleSelectRow(row.id, e.target.checked)}
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
                      <span>Belum Terisi </span>
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
                      <MatrixMemberAvatar
                        fotoProfilUrl={row.fotoProfilUrl}
                        namaLengkap={row.namaLengkap}
                        sizeCls="w-6 h-7.5"
                        initialsCls="text-[8px]"
                      />
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
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-slate-700 dark:text-slate-300">{row.nik}</span>
                      {isIncompleteNik(row.nik) && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-sans font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70"
                          title="NIK belum tepat 16 digit standar KTP"
                        >
                          {row.nik.replace(/[^0-9]/g, '').length} digit
                        </span>
                      )}
                    </div>
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
  );
};

