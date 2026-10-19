import React, { useMemo } from 'react';
import { Trash2, Plus, ShieldCheck, Award, Building2 } from 'lucide-react';

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
  onAddNewRowForSubOrg?: (subOrg: string) => void;
}

export const MatrixTableSheet: React.FC<MatrixTableSheetProps> = ({
  gridRows,
  isEditMode,
  officialTitle,
  onCellChange,
  onDeleteRow,
  onAddNewRowForSubOrg,
}) => {
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
      if (t.includes('PIMPINAN') || t.includes('DPD') || t.includes('DPW') || t.includes('CABANG') || t.includes('RANTING'))
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
          isPertimbangan,
          isPakar,
        };
      });
  }, [gridRows]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/70">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg p-6 max-w-full">
        {/* Official Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-slate-900 dark:border-white">
          <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
            {officialTitle.line1}
          </h2>
          <h3 className="text-sm sm:text-base font-bold tracking-wider text-blue-900 dark:text-blue-400 uppercase mt-0.5 font-sans">
            {officialTitle.line2}
          </h3>
        </div>

        {sections.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic border border-slate-300 dark:border-slate-700 rounded-lg">
            Belum ada data untuk wilayah ini. Klik Tambah Baris atau Edit Tabel untuk mulai mengisi.
          </div>
        ) : (
          sections.map((sec, secIdx) => {
            return (
              <div
                key={sec.subOrg}
                className={`mb-8 last:mb-0 rounded-xl overflow-hidden border ${
                  sec.isPertimbangan
                    ? 'border-indigo-300 dark:border-indigo-800/80 shadow-md'
                    : sec.isPakar
                    ? 'border-amber-300 dark:border-amber-800/80 shadow-md'
                    : 'border-blue-300 dark:border-blue-900 shadow-md'
                }`}
              >
                {/* Section Header Card */}
                <div
                  className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 ${
                    sec.isPertimbangan
                      ? 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white'
                      : sec.isPakar
                      ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white'
                      : 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {sec.isPertimbangan ? (
                      <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : sec.isPakar ? (
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <h4 className="text-xs sm:text-sm font-black tracking-wider uppercase">
                      {sec.subOrg}
                    </h4>
                    <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/20 font-semibold">
                      {sec.filledCount} / {sec.rows.length} Terisi
                    </span>
                  </div>

                  {isEditMode && onAddNewRowForSubOrg && (
                    <button
                      onClick={() => onAddNewRowForSubOrg(sec.subOrg)}
                      className="text-[11px] font-semibold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                      title={`Tambah baris jabatan baru di ${sec.subOrg}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris</span>
                    </button>
                  )}
                </div>

                {/* Section Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider text-center">
                        <th className="border border-slate-400 dark:border-slate-700 px-2 py-2.5 w-12">
                          NO
                        </th>
                        <th className="border border-slate-400 dark:border-slate-700 px-3 py-2.5 min-w-[210px] text-left">
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
                      {sec.rows.map((row, idx) => {
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
                                <span className="text-slate-700 dark:text-slate-300">
                                  {row.nik || '-'}
                                </span>
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
                                <span className="truncate block max-w-[160px]">
                                  {row.email || '-'}
                                </span>
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
                                <span className="truncate block max-w-[130px]">
                                  {row.sosmed || '-'}
                                </span>
                              )}
                            </td>

                            {/* Action Column (Edit Mode) */}
                            {isEditMode && (
                              <td className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row.id)}
                                  className="inline-flex items-center justify-center p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 rounded-lg transition-all duration-150 cursor-pointer shadow-xs border border-rose-200 dark:border-rose-900/50 hover:border-rose-600"
                                  title={`Hapus baris jabatan: ${row.jabatan}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
