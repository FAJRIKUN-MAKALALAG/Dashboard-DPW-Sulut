import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Users,
  Award,
  Sparkles,
  Building2,
  Copy,
  Check,
  Search,
  Download,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Member } from '../../types';
import { getMemberSubOrgCategory } from '../../utils/structureReadinessUtils';
import { isGeneratedNik, isGeneratedEkta } from '../../utils/generatedIds';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';

interface RawSourceStructureTableProps {
  members: Member[];
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  selectedDpd: string;
  selectedDpc?: string;
  selectedDprt?: string;
  officialTitle: { line1: string; line2: string };
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const RawSourceStructureTable: React.FC<RawSourceStructureTableProps> = ({
  members,
  level,
  selectedDpd,
  selectedDpc,
  selectedDprt,
  officialTitle,
  searchQuery = '',
  onSearchChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const activeSearch = onSearchChange ? searchQuery : localSearch;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Saring berdasarkan kata kunci pencarian
  const filteredMembers = useMemo(() => {
    if (!activeSearch.trim()) return members;
    const q = activeSearch.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.namaLengkap?.toLowerCase().includes(q) ||
        m.jabatan?.toLowerCase().includes(q) ||
        m.nik?.toLowerCase().includes(q) ||
        m.nomorEKTA?.toLowerCase().includes(q) ||
        m.nomorHP?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, activeSearch]);

  // Kelompokkan per sub-organisasi resmi: Wantim, Wanpak, Pimpinan
  const { pertimbanganList, pakarList, pimpinanList } = useMemo(() => {
    const pertimbangan: Member[] = [];
    const pakar: Member[] = [];
    const pimpinan: Member[] = [];

    filteredMembers.forEach((m) => {
      const cat = getMemberSubOrgCategory(m);
      if (cat === 'PERTIMBANGAN') {
        pertimbangan.push(m);
      } else if (cat === 'PAKAR') {
        pakar.push(m);
      } else {
        pimpinan.push(m);
      }
    });

    return {
      pertimbanganList: pertimbangan,
      pakarList: pakar,
      pimpinanList: pimpinan,
    };
  }, [filteredMembers]);

  // Fungsi Ekspor Data Murni SK ke Excel
  const handleExportRawExcel = () => {
    const wb = XLSX.utils.book_new();

    const generateRows = (list: Member[], sectionTitle: string) => {
      const rows: any[] = [];
      rows.push([sectionTitle]);
      rows.push(['No', 'Jabatan Pengurus (SK)', 'Nama Lengkap (Sesuai KTP)', 'No. NIK', 'E-KTA NasDem', 'No Telepon', 'Email', 'Status']);
      list.forEach((m, idx) => {
        rows.push([
          m.urutan || idx + 1,
          m.jabatan,
          m.namaLengkap,
          m.nik,
          m.nomorEKTA || '-',
          m.nomorHP || '-',
          m.email || '-',
          m.status || 'Aktif',
        ]);
      });
      rows.push([]);
      return rows;
    };

    let allExportRows: any[] = [
      [officialTitle.line1],
      [officialTitle.line2],
      ['BERKAS DATA ASLI PENGURUS DOKUMEN SK / HASIL IMPORT'],
      [],
    ];

    if (level !== 'DPRt') {
      const wantimTitle = level === 'DPW' ? 'I. DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      const wanpakTitle = level === 'DPW' ? 'II. DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      allExportRows = allExportRows.concat(generateRows(pertimbanganList, wantimTitle));
      allExportRows = allExportRows.concat(generateRows(pakarList, wanpakTitle));
    }

    const pimpinanTitle =
      level === 'DPW'
        ? 'III. DEWAN PIMPINAN WILAYAH'
        : level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : 'DEWAN PIMPINAN RANTING';

    allExportRows = allExportRows.concat(generateRows(pimpinanList, pimpinanTitle));

    const ws = XLSX.utils.aoa_to_sheet(allExportRows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 35 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Asli SK');
    const safeTitle = (level === 'DPW' ? 'DPW_Sulut' : selectedDpd).replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Data_Asli_SK_${level}_${safeTitle}.xlsx`);
  };

  // Render Sub-Table Section
  const renderSectionTable = (
    title: string,
    subTitle: string,
    list: Member[],
    icon: React.ReactNode,
    badgeColor: string,
    emptyText: string,
    sectionNumber: string
  ) => {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs mb-6">
        {/* Section Header */}
        <div className="bg-slate-50 dark:bg-slate-800/90 px-4 py-3 border-b border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border shadow-xs ${badgeColor}`}>{icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  {title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {list.length} Personil
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subTitle}</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium self-end sm:self-auto">
            Bagian {sectionNumber}
          </div>
        </div>

        {/* Table Content */}
        {list.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{emptyText}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {activeSearch
                ? 'Coba sesuaikan kata kunci pencarian Anda.'
                : 'Posisi ini tidak diangkat atau belum dicantumkan dalam berkas SK yang diimpor.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-[10px] sm:text-[11px]">
                  <th className="py-1.5 px-2 w-10 text-center">No</th>
                  <th className="py-1.5 px-2.5 min-w-[150px]">Jabatan Pengurus</th>
                  <th className="py-1.5 px-2.5 min-w-[150px]">Nama Lengkap</th>
                  <th className="py-1.5 px-2 min-w-[125px]">No. NIK KTP</th>
                  <th className="py-1.5 px-2 min-w-[115px]">E-KTA NasDem</th>
                  <th className="py-1.5 px-2 min-w-[100px]">No. Telepon / WA</th>
                  <th className="py-1.5 px-2 min-w-[120px]">Email</th>
                  <th className="py-1.5 px-2 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300 text-[10.5px]">
                {list.map((m, idx) => {
                  const isGenNik = isGeneratedNik(m.nik);
                  const isGenEkta = isGeneratedEkta(m.nomorEKTA);
                  const displayNo = m.urutan || idx + 1;

                  return (
                    <tr
                      key={m.nik || idx}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* No */}
                      <td className="py-1.5 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                        {displayNo}
                      </td>

                      {/* Jabatan Asli */}
                      <td className="py-1.5 px-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {m.jabatan || 'Pengurus'}
                        </div>
                        {m.wilayahPenugasan && (
                          <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {m.wilayahPenugasan}
                          </div>
                        )}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-1.5 px-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-9 rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                            {m.fotoProfilUrl ? (
                              <img
                                src={resolveImageUrl(m.fotoProfilUrl)}
                                alt={m.namaLengkap}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center text-[9px] font-bold font-mono ${getAvatarColor(m.namaLengkap).bgClass} ${getAvatarColor(m.namaLengkap).textClass}`}
                              >
                                {getInitials(m.namaLengkap)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {m.namaLengkap}
                            </div>
                            {m.jenisKelamin && m.jenisKelamin !== '-' && (
                              <span className="text-[9.5px] text-slate-400">
                                {m.jenisKelamin}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span
                            className={
                              isGenNik
                                ? 'text-amber-600 dark:text-amber-400 italic'
                                : 'text-slate-700 dark:text-slate-300 font-medium'
                            }
                          >
                            {m.nik || '-'}
                          </span>
                          {m.nik && !isGenNik && (
                            <button
                              onClick={() => copyToClipboard(m.nik, `nik_${m.nik}`)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="Salin NIK"
                            >
                              {copiedId === `nik_${m.nik}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        {isGenNik && (
                          <span className="text-[9px] text-amber-500 block">
                            (Otomatis Dibuat Sistem)
                          </span>
                        )}
                      </td>

                      {/* E-KTA */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span
                            className={
                              isGenEkta
                                ? 'text-slate-400 italic'
                                : 'text-slate-700 dark:text-slate-300 font-medium'
                            }
                          >
                            {m.nomorEKTA || '-'}
                          </span>
                          {m.nomorEKTA && !isGenEkta && (
                            <button
                              onClick={() => copyToClipboard(m.nomorEKTA, `ekta_${m.nik}`)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="Salin E-KTA"
                            >
                              {copiedId === `ekta_${m.nik}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Nomor Telepon / WA */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {m.nomorHP && m.nomorHP !== '-' ? (
                          <a
                            href={`https://wa.me/${m.nomorHP.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-emerald-600 hover:underline"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{m.nomorHP}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                        {m.email && m.email !== '-' ? (
                          <a
                            href={`mailto:${m.email}`}
                            className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline truncate"
                            title={m.email}
                          >
                            <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{m.status || 'Aktif'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Bar Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Data Asli Berkas SK
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Tingkat {level}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              {officialTitle.line1}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {officialTitle.line2} — Menampilkan daftar personil riil yang diimpor langsung dari berkas Excel/SK tanpa slot lowong template.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleExportRawExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor Excel Asli</span>
            </button>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Personil di SK
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {filteredMembers.length} <span className="text-xs font-normal text-slate-400">Orang</span>
            </div>
          </div>

          {level !== 'DPRt' && (
            <>
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60">
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Dewan Pertimbangan
                </div>
                <div className="text-lg font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                  {pertimbanganList.length} <span className="text-xs font-normal text-blue-500">Orang</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/60">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Dewan Pakar
                </div>
                <div className="text-lg font-extrabold text-purple-900 dark:text-purple-200 mt-0.5">
                  {pakarList.length} <span className="text-xs font-normal text-purple-500">Orang</span>
                </div>
              </div>
            </>
          )}

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Dewan Pimpinan ({level})
            </div>
            <div className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
              {pimpinanList.length} <span className="text-xs font-normal text-emerald-500">Orang</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-4 mt-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama pengurus, jabatan asli, NIK, atau no telepon..."
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            {activeSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render Sections */}
      {level !== 'DPRt' && (
        <>
          {/* I. Dewan Pertimbangan */}
          {renderSectionTable(
            level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN',
            'Susunan pimpinan dan anggota Dewan Pertimbangan resmi dari berkas SK',
            pertimbanganList,
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
            'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700',
            'Belum ada personil Dewan Pertimbangan dalam dokumen SK ini.',
            'I'
          )}

          {/* II. Dewan Pakar */}
          {renderSectionTable(
            level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR',
            'Susunan pimpinan dan anggota Dewan Pakar resmi dari berkas SK',
            pakarList,
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
            'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700',
            'Belum ada personil Dewan Pakar dalam dokumen SK ini.',
            'II'
          )}
        </>
      )}

      {/* III. Dewan Pimpinan (DPW / DPD / DPC / DPRt) */}
      {renderSectionTable(
        level === 'DPW'
          ? 'DEWAN PIMPINAN WILAYAH'
          : level === 'DPD'
          ? 'III. DEWAN PIMPINAN DAERAH'
          : level === 'DPC'
          ? 'III. DEWAN PIMPINAN CABANG'
          : 'DEWAN PIMPINAN RANTING',
        `Jajaran kepengurusan harian eksekutif tingkat ${level} sesuai dokumen SK`,
        pimpinanList,
        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700',
        'Belum ada pengurus dewan pimpinan yang terdaftar.',
        level !== 'DPRt' ? 'III' : 'I'
      )}
    </div>
  );
};
export default RawSourceStructureTable;
