import React from 'react';
import { Trash2 } from 'lucide-react';

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
}

export const MatrixTableSheet: React.FC<MatrixTableSheetProps> = ({
  gridRows,
  isEditMode,
  officialTitle,
  onCellChange,
  onDeleteRow,
}) => {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/70">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg p-6 max-w-full overflow-x-auto">
        {/* Official Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-slate-900 dark:border-white">
          <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
            {officialTitle.line1}
          </h2>
          <h3 className="text-sm sm:text-base font-bold tracking-wider text-blue-900 dark:text-blue-400 uppercase mt-0.5 font-sans">
            {officialTitle.line2}
          </h3>
        </div>

        {/* Matrix Table with Exact 8 Columns */}
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#1e3a8a] text-white text-[11px] font-bold uppercase tracking-wider text-center">
              <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-10">NO</th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[200px] text-left">
                JABATAN PENGURUS
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[220px] text-left">
                NAMA LENGKAP (SESUAI KTP)
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[150px]">
                NO. NIK
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[150px]">
                E-KTA NASDEM
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[160px]">
                EMAIL
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[130px]">
                NO TELEPON
              </th>
              <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[130px]">
                SOSIAL MEDIA
              </th>
              {isEditMode && (
                <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-12 text-center bg-rose-800 text-white">
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {gridRows.length === 0 ? (
              <tr>
                <td
                  colSpan={isEditMode ? 9 : 8}
                  className="border border-slate-300 dark:border-slate-700 p-8 text-center text-slate-400 italic"
                >
                  Belum ada data untuk wilayah ini. Klik Tambah Baris atau Edit Tabel untuk mulai mengisi.
                </td>
              </tr>
            ) : (
              gridRows.map((row, idx) => {
                const isFilled = row.namaLengkap.trim() !== '';

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors text-[11px] ${
                      !isFilled
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40'
                        : idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900 hover:bg-blue-50/30'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/30'
                    }`}
                  >
                    {/* 1. NO */}
                    <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {idx + 1}
                    </td>

                    {/* 2. JABATAN PENGURUS */}
                    <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200">
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
                              isFilled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          ></span>
                          <span className="truncate">{row.jabatan}</span>
                        </div>
                      )}
                    </td>

                    {/* 3. NAMA LENGKAP */}
                    <td className="border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-medium">
                      {isEditMode ? (
                        <input
                          type="text"
                          placeholder="Masukkan Nama Sesuai KTP..."
                          value={row.namaLengkap}
                          onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span
                          className={
                            isFilled
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-600 italic'
                          }
                        >
                          {row.namaLengkap || '(Belum Terisi)'}
                        </span>
                      )}
                    </td>

                    {/* 4. NO. NIK */}
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
                        <span className="text-slate-700 dark:text-slate-300">{row.nik || '-'}</span>
                      )}
                    </td>

                    {/* 5. E-KTA NASDEM */}
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

                    {/* 6. EMAIL */}
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
                        <span className="truncate block max-w-[160px]">{row.email || '-'}</span>
                      )}
                    </td>

                    {/* 7. NO TELEPON */}
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

                    {/* 8. SOSIAL MEDIA */}
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
                        <span className="truncate block max-w-[130px]">{row.sosmed || '-'}</span>
                      )}
                    </td>

                    {/* Action Column (Edit Mode) */}
                    {isEditMode && (
                      <td className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center">
                        <button
                          onClick={() => onDeleteRow(row.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
