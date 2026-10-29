import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Info,
  Award,
  Sparkles,
  Building2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GridRowItem } from './MatrixTableSheet';
import { Member } from '../../types';
import { isGeneratedNik } from '../../utils/generatedIds';

interface StructureComparisonTableProps {
  gridRows: GridRowItem[];
  rawMembers: Member[];
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  selectedDpd: string;
  officialTitle: { line1: string; line2: string };
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const StructureComparisonTable: React.FC<StructureComparisonTableProps> = ({
  gridRows,
  rawMembers,
  level,
  selectedDpd,
  officialTitle,
  searchQuery = '',
  onSearchChange,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'vacant'>('all');
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const activeSearch = onSearchChange ? searchQuery : localSearch;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  // Map raw members by NIK for instant 1-to-1 lookup
  const rawMemberMap = useMemo(() => {
    const map = new Map<string, Member>();
    rawMembers.forEach((m) => {
      if (m.nik) map.set(m.nik, m);
    });
    return map;
  }, [rawMembers]);

  // Kelompokkan per subOrg
  const comparisonSections = useMemo(() => {
    const map = new Map<string, GridRowItem[]>();
    gridRows.forEach((r) => {
      const key = r.subOrg || 'DEWAN PIMPINAN DAERAH';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    const sortPriority = (title: string) => {
      const t = title.toUpperCase();
      if (t.includes('PERTIMBANGAN')) return 1;
      if (t.includes('PAKAR')) return 2;
      return 3;
    };

    return Array.from(map.entries())
      .sort(([a], [b]) => sortPriority(a) - sortPriority(b))
      .map(([subOrgName, rows]) => {
        const filteredRows = rows.filter((r) => {
          const isFilled = !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-';
          if (statusFilter === 'filled' && !isFilled) return false;
          if (statusFilter === 'vacant' && isFilled) return false;

          if (!activeSearch.trim()) return true;
          const q = activeSearch.toLowerCase().trim();
          const rawM = rawMemberMap.get(r.nik);
          return (
            r.jabatan?.toLowerCase().includes(q) ||
            r.namaLengkap?.toLowerCase().includes(q) ||
            r.nik?.toLowerCase().includes(q) ||
            rawM?.jabatan?.toLowerCase().includes(q) ||
            rawM?.namaLengkap?.toLowerCase().includes(q)
          );
        });

        const isPertimbangan = subOrgName.toUpperCase().includes('PERTIMBANGAN');
        const isPakar = subOrgName.toUpperCase().includes('PAKAR');

        return {
          subOrg: subOrgName,
          rows: filteredRows,
          allRowsCount: rows.length,
          filledCount: rows.filter((r) => !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-').length,
          isPertimbangan,
          isPakar,
        };
      });
  }, [gridRows, rawMemberMap, statusFilter, activeSearch]);

  const totalFilled = gridRows.filter((r) => !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-').length;
  const totalSlots = gridRows.length;
  const totalRaw = rawMembers.length;

  // Ekspor Komparasi ke Excel
  const handleExportComparison = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[] = [];
    rows.push([officialTitle.line1]);
    rows.push([officialTitle.line2]);
    rows.push(['TABEL KOMPARASI: MATRIKS STANDAR SISTEM VS DATA ASLI BERKAS SK / EXCEL']);
    rows.push([]);
    rows.push([
      'Bagian',
      'No Slot',
      'Jabatan Standar Matriks',
      'Status',
      'Nama Pengurus di Sistem',
      'NIK',
      'Jabatan Asli di SK/Excel',
      'Nama Asli di SK/Excel',
      'Status Kesesuaian',
    ]);

    gridRows.forEach((r) => {
      const isFilled = !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-';
      const rawM = rawMemberMap.get(r.nik);
      let matchNote = '✓ Sesuai SK';
      if (!isFilled) {
        matchNote = '⚠️ Jabatan Belum Ada di SK (Slot Lowong)';
      } else if (rawM && rawM.jabatan && rawM.jabatan !== r.jabatan) {
        matchNote = `✓ Dipetakan dari: "${rawM.jabatan}"`;
      }

      rows.push([
        r.subOrg,
        r.no,
        r.jabatan,
        isFilled ? 'TERISI' : 'LOWONG',
        r.namaLengkap || '-',
        r.nik || '-',
        rawM?.jabatan || (isFilled ? r.jabatan : '-'),
        rawM?.namaLengkap || (isFilled ? r.namaLengkap : '-'),
        matchNote,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 8 },
      { wch: 40 },
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 40 },
      { wch: 30 },
      { wch: 35 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Komparasi Matriks vs SK');
    XLSX.writeFile(wb, `Komparasi_Matriks_vs_SK_${level}_${selectedDpd}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner Control */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                Mode Komparasi 1-to-1
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Audit Kepatuhan SK
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              Perbandingan Matriks Sistem vs Berkas SK
            </h2>
            <p className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400">
              Membandingkan posisi slot jabatan resmi di sistem dengan jabatan dan personil yang diimpor langsung dari berkas Excel asli.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportComparison}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Tabel Komparasi</span>
            </button>
          </div>
        </div>

        {/* Audit Stats Metric */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pengurus di Berkas Asli SK
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {totalRaw} <span className="text-xs font-normal text-slate-400">Personil</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
              SK
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Slot Matriks Terpenuhi
              </div>
              <div className="text-lg font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                {totalFilled} / {totalSlots} <span className="text-xs font-normal text-blue-500">Slot Terisi</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              {Math.round((totalFilled / (totalSlots || 1)) * 100)}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Slot Baku Lowong di SK
              </div>
              <div className="text-lg font-extrabold text-amber-900 dark:text-amber-200 mt-0.5">
                {totalSlots - totalFilled} <span className="text-xs font-normal text-amber-500">Jabatan Kosong</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
              ⚠️
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 mt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Baris ({gridRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('filled')}
              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                statusFilter === 'filled'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hanya Terisi ({totalFilled})
            </button>
            <button
              onClick={() => setStatusFilter('vacant')}
              className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                statusFilter === 'vacant'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hanya Lowong ({totalSlots - totalFilled})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari komparasi jabatan atau nama..."
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Comparison Tables per Section */}
      {comparisonSections.map((sec, secIdx) => {
        const icon = sec.isPertimbangan ? (
          <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : sec.isPakar ? (
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        );

        return (
          <div
            key={sec.subOrg}
            className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs mb-6"
          >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/90 px-4 py-3 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">{icon}</div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {sec.subOrg}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keterisian: {sec.filledCount} dari {sec.allRowsCount} slot baku
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {sec.rows.length} Baris Ditampilkan
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-[10px] sm:text-[11px]">
                    <th className="py-1.5 px-2 w-9 text-center">No</th>
                    <th className="py-1.5 px-2.5 min-w-[140px]">Slot Template</th>
                    <th className="py-1.5 px-2 w-20 text-center">Status</th>
                    <th className="py-1.5 px-2.5 min-w-[150px]">Pengurus Sistem</th>
                    <th className="py-1.5 px-2.5 min-w-[150px] bg-indigo-50/40 dark:bg-indigo-950/20">
                      Jabatan Asli SK
                    </th>
                    <th className="py-1.5 px-2.5 min-w-[130px]">Kesesuaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300 text-[10.5px]">
                  {sec.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        Tidak ada baris yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    sec.rows.map((r, idx) => {
                      const isFilled =
                        !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-';
                      const rawM = rawMemberMap.get(r.nik);
                      const isGenNik = isGeneratedNik(r.nik);

                      return (
                        <tr
                          key={r.id || idx}
                          className={
                            isFilled
                              ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors'
                              : 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 transition-colors'
                          }
                        >
                          {/* No Slot */}
                          <td className="py-1.5 px-2 text-center font-bold text-slate-400">
                            {r.no}
                          </td>

                          {/* Jabatan Slot Template */}
                          <td className="py-1.5 px-2.5 font-semibold text-slate-900 dark:text-slate-100">
                            {r.jabatan}
                          </td>

                          {/* Status */}
                          <td className="py-1.5 px-2 text-center">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                TERISI
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                LOWONG
                              </span>
                            )}
                          </td>

                          {/* Pengurus di Sistem */}
                          <td className="py-2.5 px-4">
                            {isFilled ? (
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {r.namaLengkap}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  NIK: {r.nik}{' '}
                                  {isGenNik && (
                                    <span className="text-amber-500 italic">(Otomatis)</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Belum ada pengurus
                              </span>
                            )}
                          </td>

                          {/* Jabatan Asli di Excel / SK */}
                          <td className="py-2.5 px-4 bg-indigo-50/30 dark:bg-indigo-950/15">
                            {isFilled ? (
                              <div>
                                <div className="font-semibold text-indigo-950 dark:text-indigo-200">
                                  {rawM?.jabatan || r.jabatan}
                                </div>
                                {rawM?.wilayahPenugasan && (
                                  <div className="text-[10px] text-indigo-500">
                                    {rawM.wilayahPenugasan}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                - (Tidak tercantum di SK)
                              </span>
                            )}
                          </td>

                          {/* Catatan Kesesuaian */}
                          <td className="py-2.5 px-4 text-[11px]">
                            {isFilled ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>Sesuai Dokumen SK</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Posisi lowong di SK</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default StructureComparisonTable;
