import React from 'react';
import { Search, Check, Sparkles } from 'lucide-react';
import { ParsedTerritoryRow } from '../../../utils/territorial';

interface ImportPreviewTableProps {
  filteredRows: ParsedTerritoryRow[];
  filterMode: 'all' | 'filled' | 'empty';
  setFilterMode: (m: 'all' | 'filled' | 'empty') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filledRowsCount: number;
  totalRowsCount: number;
  emptyRowsCount: number;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  filteredRows,
  filterMode,
  setFilterMode,
  searchQuery,
  setSearchQuery,
  filledRowsCount,
  totalRowsCount,
  emptyRowsCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Filter & Search Bar Tabel Preview */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setFilterMode('filled')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterMode === 'filled'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Hanya Yang Terisi ({filledRowsCount})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua ({totalRowsCount})
          </button>
          <button
            onClick={() => setFilterMode('empty')}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              filterMode === 'empty'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Posisi Kosong ({emptyRowsCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabel Preview */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2 px-3 w-10">No</th>
              <th className="py-2 px-3">Jabatan di Excel</th>
              <th className="py-2 px-3">Nama Lengkap & Gelar</th>
              <th className="py-2 px-3">No. NIK</th>
              <th className="py-2 px-3">Kesesuaian Template</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                  Tidak ada baris yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr
                  key={idx}
                  className={
                    r.isVacantSlot
                      ? 'bg-amber-50/60 dark:bg-amber-950/25 border-l-3 border-amber-500'
                      : r.isFilled
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400'
                  }
                >
                  <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-500">
                    {r.no}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    <div>
                      <span
                        className={
                          r.isVacantSlot ? 'font-semibold text-amber-900 dark:text-amber-200' : ''
                        }
                      >
                        {r.jabatanExcel}
                      </span>
                      {r.subOrg && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                              r.subOrg.toUpperCase().includes('PERTIMBANGAN')
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : r.subOrg.toUpperCase().includes('PAKAR')
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {r.subOrg}
                          </span>
                          {r.dpd && (
                            <span className="text-[10px] text-slate-400">· {r.dpd}</span>
                          )}
                        </div>
                      )}
                      {r.aiNote && (
                        <span
                          className={`block text-[9.5px] font-mono mt-0.5 ${
                            r.isVacantSlot
                              ? 'text-amber-700 dark:text-amber-400 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {r.aiNote}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {r.isVacantSlot ? (
                      <span className="italic font-medium text-amber-600 dark:text-amber-400">
                        (Slot Kosong / Belum Terisi)
                      </span>
                    ) : r.namaLengkap && r.namaLengkap !== '-' ? (
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {r.namaLengkap}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">(Belum Terisi)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                    {r.nik || '-'}
                  </td>
                  <td className="py-2 px-3">
                    {r.isVacantSlot ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                        ⚠️ Slot Kosong #{r.no}
                      </span>
                    ) : r.isMatched ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Cocok Slot #{r.no}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        <Sparkles className="w-3 h-3" /> Tambahan #{r.no}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
