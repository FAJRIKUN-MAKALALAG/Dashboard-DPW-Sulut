import React, { useRef, useEffect, useMemo } from 'react';
import { Member, UserSession } from '../../types';
import { STATUS_BADGE_CONFIG } from '../../data/sulutRegions';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';
import { getDewanWilayahInfo } from '../../utils/structureReadinessUtils';
import { exportMembersToExcel, exportMembersToCsv } from '../../utils/excelUtils';
import { canEditMember, canDirectDeleteMember } from '../../utils/permissionUtils';
import {
  Search,
  Eye,
  Edit,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  CheckSquare,
  FileDown,
  Trash2,
  FileText,
  Award,
  FileSpreadsheet,
} from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  filteredMembers: Member[];
  paginatedMembers: Member[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (updater: number | ((p: number) => number)) => void;
  pageSize: number;
  session: UserSession;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedDpd: string;
  onOpenDetailModal: (m: Member) => void;
  onOpenStatusModal: (m: Member) => void;
  onOpenEditModal: (m: Member) => void;
  onOpenDeletionRequest: (m: Member) => void;
  onDirectDelete: (m: Member) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  filteredMembers,
  paginatedMembers,
  currentPage,
  totalPages,
  setCurrentPage,
  pageSize,
  session,
  searchTerm,
  setSearchTerm,
  selectedDpd,
  onOpenDetailModal,
  onOpenStatusModal,
  onOpenEditModal,
  onOpenDeletionRequest,
  onDirectDelete,
}) => {
  const [selectedNiks, setSelectedNiks] = React.useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const paginatedNiks = useMemo(() => paginatedMembers.map((m) => m.nik), [paginatedMembers]);
  const isAllCurrentPageSelected =
    paginatedNiks.length > 0 && paginatedNiks.every((nik) => selectedNiks.has(nik));
  const isSomeCurrentPageSelected =
    paginatedNiks.some((nik) => selectedNiks.has(nik)) && !isAllCurrentPageSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeCurrentPageSelected;
    }
  }, [isSomeCurrentPageSelected]);

  const handleToggleSelect = (nik: string) => {
    setSelectedNiks((prev) => {
      const next = new Set(prev);
      if (next.has(nik)) next.delete(nik);
      else next.add(nik);
      return next;
    });
  };

  const handleToggleSelectPage = () => {
    setSelectedNiks((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        paginatedNiks.forEach((nik) => next.delete(nik));
      } else {
        paginatedNiks.forEach((nik) => next.add(nik));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedNiks(new Set(filteredMembers.map((m) => m.nik)));
  };

  const handleClearSelection = () => {
    setSelectedNiks(new Set());
  };

  const handleExportSelectedCsv = () => {
    const selectedList = members.filter((m) => selectedNiks.has(m.nik));
    if (selectedList.length === 0) return;
    const filename = `ANGGOTA_TERPILIH_SULUT_${selectedList.length}_KADER.csv`;
    exportMembersToCsv(selectedList, filename);
  };

  const handleExportSelectedExcel = () => {
    const selectedList = members.filter((m) => selectedNiks.has(m.nik));
    if (selectedList.length === 0) return;
    const filename = `ANGGOTA_TERPILIH_SULUT_${selectedList.length}_KADER.xlsx`;
    exportMembersToExcel(selectedList, filename);
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim();
    const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={index} className="bg-amber-400 text-slate-950 px-0.5 rounded-xs font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* FLOATING / STICKY SELECTION ACTION BAR */}
      {selectedNiks.size > 0 && (
        <div className="sticky top-20 z-30 bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 text-white">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white text-sm font-mono" data-tabular="true">{selectedNiks.size}</strong> kader dipilih dari daftar
            </span>
            {selectedNiks.size < filteredMembers.length && (
              <button
                onClick={handleSelectAllFiltered}
                className="btn-white px-2 py-0.5 text-xs rounded-md ml-2 cursor-pointer font-medium"
              >
                Pilih Semua {filteredMembers.length} Hasil Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportSelectedCsv}
              className="btn-white flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Ekspor Terpilih ke CSV (.csv)</span>
            </button>
            <button
              onClick={handleExportSelectedExcel}
              className="btn-white flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleClearSelection}
              className="btn-white px-2.5 py-1.5 text-xs rounded-lg cursor-pointer font-normal"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Main High-Density Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectPage}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                    title={isAllCurrentPageSelected ? 'Batalkan pilihan halaman ini' : 'Pilih semua di halaman ini'}
                  />
                </th>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">Nama Lengkap & NIK</th>
                <th className="p-3">No e-KTA Pusat</th>
                <th className="p-3">Wilayah (DPD / DPC)</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Status Keanggotaan</th>
                <th className="p-3 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 bg-white dark:bg-slate-900/60">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                        Tidak ada data anggota yang cocok dengan kata kunci pencarian.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Periksa kembali NIK 16 digit, ejaan nama kader, atau nama kecamatan (DPC).
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setCurrentPage(1);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Hapus Kata Kunci</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const statusConfig = STATUS_BADGE_CONFIG[member.status];
                  const isSelected = selectedNiks.has(member.nik);
                  const canEdit = canEditMember(session, member);
                  const canDirectDelete = canDirectDeleteMember(session);

                  return (
                    <tr
                      key={member.id || `${member.nik}-${member.tingkatKepengurusan || ''}-${idx}`}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100/60 dark:hover:bg-amber-500/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(member.nik)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                          title="Pilih anggota ini untuk ekspor CSV"
                        />
                      </td>

                      {/* No */}
                      <td className="p-3 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {globalIdx}
                      </td>

                      {/* Nama & NIK */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => onOpenDetailModal(member)}
                            className="relative shrink-0 cursor-pointer group/avatar"
                            title="Klik untuk melihat detail profil kader"
                          >
                            <div className="w-9 h-11 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-amber-400 transition-all">
                              {member.fotoProfilUrl ? (
                                <img
                                  src={resolveImageUrl(member.fotoProfilUrl)}
                                  alt={member.namaLengkap}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex flex-col items-center justify-center text-[11px] font-bold font-mono ${getAvatarColor(member.namaLengkap).bgClass} ${getAvatarColor(member.namaLengkap).textClass}`}
                                >
                                  {getInitials(member.namaLengkap)}
                                </div>
                              )}
                            </div>

                            {member.fotoKtpUrl && (
                              <div
                                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-xs"
                                title="KTP Elektronik Terunggah & Terverifikasi"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <button
                              onClick={() => onOpenDetailModal(member)}
                              className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-left cursor-pointer hover:underline block truncate max-w-xs"
                            >
                              {highlightMatch(member.namaLengkap, searchTerm)}
                            </button>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>
                                NIK: <span className="text-slate-700 dark:text-slate-300">{highlightMatch(member.nik, searchTerm)}</span>
                              </span>
                              {member.fotoKtpUrl ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                  · KTP Ada
                                </span>
                              ) : null}
                              {member.nomorHP && member.nomorHP !== '-' && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-400 dark:text-slate-500">{member.nomorHP}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* No e-KTA Pusat */}
                      <td className="p-3 font-mono text-amber-700 dark:text-amber-300 font-bold" data-tabular="true">
                        {highlightMatch(member.nomorEKTA, searchTerm)}
                      </td>

                      {/* Wilayah (DPD / DPC) */}
                      <td className="p-3 text-slate-800 dark:text-slate-300">
                        <div className="font-medium text-slate-900 dark:text-slate-200">{member.dpd}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            DPC {highlightMatch(member.dpc, searchTerm)}
                          </span>
                          {member.dprt ? ` · ${highlightMatch(member.dprt, searchTerm)}` : ''}
                        </div>
                      </td>

                      {/* Jabatan & SK */}
                      <td className="p-3 text-slate-800 dark:text-slate-300 font-medium">
                        {(() => {
                          const dewanInfo = getDewanWilayahInfo(member);
                          return (
                            <div className="space-y-1">
                              {dewanInfo.isDewan ? (
                                <div className="flex flex-col items-start gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold border shadow-2xs ${
                                      dewanInfo.category === 'PERTIMBANGAN'
                                        ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                                        : 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700'
                                    }`}
                                  >
                                    {dewanInfo.category === 'PERTIMBANGAN' ? (
                                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    ) : (
                                      <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                    )}
                                    <span>{dewanInfo.councilName}</span>
                                    <span className="opacity-60">·</span>
                                    <span className="font-extrabold">{dewanInfo.shortLocationLabel}</span>
                                  </span>

                                  <div className="text-slate-900 dark:text-slate-200 font-bold text-xs">
                                    {member.jabatan}
                                  </div>
                                </div>
                              ) : member.isPengurus || Boolean(member.nomorSK) ? (
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      Pengurus {member.tingkatKepengurusan || 'Struktural'}
                                    </span>
                                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{member.jabatan}</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                      Anggota Biasa (Basis KTP)
                                    </span>
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{member.jabatan || 'Kader'}</span>
                                  </div>
                                </div>
                              )}

                              {member.nomorSK && (
                                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  SK: {member.nomorSK}
                                </div>
                              )}
                              {member.kodeReferral && (
                                <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                  Ref: {member.kodeReferral}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Keanggotaan */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                          >
                            {member.status}
                          </span>
                          {member.catatanMutasi && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1 max-w-xs" title={member.catatanMutasi}>
                              {member.catatanMutasi}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi Operasional */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDetailModal(member)}
                            title="Lihat Detail Profil & Dokumen KTP"
                            className="btn-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span>Detail</span>
                          </button>

                          <button
                            disabled={!canEdit}
                            onClick={() => onOpenStatusModal(member)}
                            title="Ubah Status (Aktif / Non-Aktif)"
                            className="btn-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ubah Status</span>
                          </button>

                          <button
                            disabled={!canEdit}
                            onClick={() => onOpenEditModal(member)}
                            title="Edit Data Lengkap Kader"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {canDirectDelete ? (
                            <button
                              onClick={() => onDirectDelete(member)}
                              title="Hapus Data Kader Permanen (Super Admin / Admin DPW)"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          ) : (
                            <button
                              disabled={!canEdit}
                              onClick={() => onOpenDeletionRequest(member)}
                              title={canEdit ? "Ajukan Permohonan Hapus Data ke DPW" : "Di luar wilayah wewenang"}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Ajukan Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono gap-2">
          <div className="text-center sm:text-left">
            Halaman <strong className="text-slate-900 dark:text-white">{currentPage}</strong> dari{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({filteredMembers.length} total)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="btn-white p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-slate-700 dark:text-slate-300">{currentPage}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="btn-white p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
