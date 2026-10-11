import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS, STATUS_BADGE_CONFIG, PARTY_ROLES, STATUS_OPTIONS } from '../data/sulutRegions';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  MapPin,
  IdCard,
  User,
  CheckSquare,
  FileDown,
} from 'lucide-react';
import { exportMembersToExcel, exportMembersToCsv } from '../utils/excelUtils';
import { getInitials, getAvatarColor } from '../utils/imageUtils';

type SearchCategory = 'ALL' | 'NIK' | 'NAMA' | 'DPC';

interface MemberManagementProps {
  members: Member[];
  session: UserSession;
  initialDpdFilter?: string;
  initialStatusFilter?: MemberStatus;
  onOpenAddModal: () => void;
  onOpenBulkImport: () => void;
  onOpenStatusModal: (member: Member) => void;
  onOpenCardModal: (member: Member) => void;
  onOpenEditModal: (member: Member) => void;
  onOpenDetailModal: (member: Member) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  session,
  initialDpdFilter,
  initialStatusFilter,
  onOpenAddModal,
  onOpenBulkImport,
  onOpenStatusModal,
  onOpenCardModal,
  onOpenEditModal,
  onOpenDetailModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Selection state for batch CSV export
  const [selectedNiks, setSelectedNiks] = useState<Set<string>>(new Set());

  const [selectedDpd, setSelectedDpd] = useState<string>(
    session.role === 'ADMIN_DPD' && session.dpdAccess !== 'ALL'
      ? session.dpdAccess
      : initialDpdFilter || 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Keyboard shortcut: Press '/' to focus global search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter pipeline
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Role scope lock: Admin DPD can only view and manage their assigned DPD
      if (session.role === 'ADMIN_DPD' && session.dpdAccess !== 'ALL') {
        if (member.dpd !== session.dpdAccess) return false;
      } else if (selectedDpd !== 'ALL' && member.dpd !== selectedDpd) {
        return false;
      }

      if (selectedStatus !== 'ALL' && member.status !== selectedStatus) {
        return false;
      }

      if (selectedRole !== 'ALL' && member.jabatan !== selectedRole) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNik = member.nik.includes(query);
        const matchName = member.namaLengkap.toLowerCase().includes(query);
        const matchDpc = member.dpc.toLowerCase().includes(query);
        const matchEkta = member.nomorEKTA.toLowerCase().includes(query);
        const matchDprt = member.dprt.toLowerCase().includes(query);

        if (searchCategory === 'NIK') {
          return matchNik;
        } else if (searchCategory === 'NAMA') {
          return matchName;
        } else if (searchCategory === 'DPC') {
          return matchDpc;
        } else {
          // Global search: searches across NIK, Name, DPC, e-KTA, and DPRt
          return matchNik || matchName || matchDpc || matchEkta || matchDprt;
        }
      }

      return true;
    });
  }, [members, selectedDpd, selectedStatus, selectedRole, searchTerm, searchCategory, session]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const activeFilteredCount = filteredMembers.filter((m) => m.status === 'Aktif').length;
  const nonActiveFilteredCount = filteredMembers.length - activeFilteredCount;

  // Selection calculations
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
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modul Manajemen Kader NasDem
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              DPW Partai NasDem Sulut
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Daftar & Pembaruan Status e-KTA Kader NasDem
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Data keanggotaan teritorial Partai NasDem di 15 DPD se-Sulawesi Utara. Gunakan filter DPD, status, atau jabatan untuk pencarian cepat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedNiks.size > 0 ? (
            <button
              onClick={handleExportSelectedCsv}
              className="btn-white flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer animate-in fade-in"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ekspor Terpilih ke CSV ({selectedNiks.size})</span>
            </button>
          ) : (
            <button
              onClick={() =>
                exportMembersToCsv(
                  filteredMembers,
                  `EKSPOR_KADER_SULUT_${selectedDpd !== 'ALL' ? selectedDpd : 'SEMUA'}.csv`
                )
              }
              className="btn-white flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ekspor Semua ke CSV ({filteredMembers.length})</span>
            </button>
          )}

          <button
            onClick={() =>
              exportMembersToExcel(
                selectedNiks.size > 0
                  ? members.filter((m) => selectedNiks.has(m.nik))
                  : filteredMembers,
                `EKSPOR_KADER_SULUT_${selectedNiks.size > 0 ? `TERPILIH_${selectedNiks.size}` : selectedDpd}.xlsx`
              )
            }
            className="btn-white flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel ({selectedNiks.size > 0 ? selectedNiks.size : filteredMembers.length})</span>
          </button>
          <button
            onClick={onOpenBulkImport}
            className="btn-white flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import Massal</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tambah Kader</span>
          </button>
        </div>
      </div>

      {/* DEDICATED GLOBAL SEARCH BAR HERO CONTAINER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs space-y-3.5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Pencarian Global Anggota (NIK · Nama · DPC)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Temukan kader spesifik seketika dengan memasukkan 16 digit NIK, nama lengkap, atau kecamatan (DPC).
            </p>
          </div>

          {/* Quick Scope Filter Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg self-start md:self-auto text-xs">
            <button
              onClick={() => {
                setSearchCategory('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                searchCategory === 'ALL'
                  ? 'btn-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Field
            </button>
            <button
              onClick={() => {
                setSearchCategory('NIK');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                searchCategory === 'NIK'
                  ? 'btn-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IdCard className="w-3.5 h-3.5 text-blue-500" />
              <span>NIK</span>
            </button>
            <button
              onClick={() => {
                setSearchCategory('NAMA');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                searchCategory === 'NAMA'
                  ? 'btn-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Nama</span>
            </button>
            <button
              onClick={() => {
                setSearchCategory('DPC');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                searchCategory === 'DPC'
                  ? 'btn-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>DPC (Kecamatan)</span>
            </button>
          </div>
        </div>

        {/* Global Search Input Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              searchCategory === 'NIK'
                ? 'Ketik NIK 16 digit (contoh: 710201...)'
                : searchCategory === 'NAMA'
                ? 'Ketik nama lengkap anggota (contoh: Lumentut, Runtuwene...)'
                : searchCategory === 'DPC'
                ? 'Ketik nama kecamatan / DPC (contoh: Malalayang, Tondano, Kaidipang...)'
                : 'Cari seketika: NIK (16 digit), Nama Lengkap, atau Kecamatan (DPC)...'
            }
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 dark:text-white rounded-xl pl-11 pr-24 py-3 text-sm placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-inner"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-2">
            {searchTerm ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  searchInputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                Tekan / untuk mencari
              </span>
            )}
          </div>
        </div>

        {/* Secondary Filters Bar (DPD, Status, Role) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* DPD Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Filter Wilayah DPD:
            </label>
            <select
              value={selectedDpd}
              disabled={session.role === 'ADMIN_DPD' && session.dpdAccess !== 'ALL'}
              onChange={(e) => {
                setSelectedDpd(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 disabled:opacity-60 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="ALL">Semua 15 DPD Kabupaten/Kota</option>
              {SULUT_REGIONS.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Filter Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="ALL">Semua Status (Aktif & Non-Aktif)</option>
              <option value="Aktif">Hanya Aktif</option>
              <option value="Non-Aktif (Meninggal)">Non-Aktif: Meninggal</option>
              <option value="Non-Aktif (Pindah Partai/Mundur)">Non-Aktif: Pindah Partai/Mundur</option>
              <option value="Non-Aktif (Pindah Domisili)">Non-Aktif: Pindah Domisili</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Filter Jabatan:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="ALL">Semua Jabatan Partai</option>
              {PARTY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results Summary & Badges */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2 font-mono">
          <div className="flex items-center gap-3">
            {searchTerm.trim() ? (
              <span className="text-blue-800 dark:text-blue-300">
                Hasil pencarian untuk "<strong className="text-slate-900 dark:text-white">{searchTerm}</strong>" ({searchCategory}):{' '}
                <strong className="text-slate-900 dark:text-white">{filteredMembers.length}</strong> anggota ditemukan
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">
                Menampilkan <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredMembers.length}</strong> anggota
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
              <strong>{activeFilteredCount}</strong> Aktif Riil
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-semibold">
              <strong>{nonActiveFilteredCount}</strong> Non-Aktif
            </span>
          </div>

          {(searchTerm || selectedDpd !== 'ALL' || selectedStatus !== 'ALL' || selectedRole !== 'ALL' || searchCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchCategory('ALL');
                if (session.role === 'SUPER_ADMIN') setSelectedDpd('ALL');
                setSelectedStatus('ALL');
                setSelectedRole('ALL');
                setCurrentPage(1);
                searchInputRef.current?.focus();
              }}
              className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer font-medium"
            >
              Reset Pencarian & Filter
            </button>
          )}
        </div>
      </div>

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
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <tr>
                {/* Checkbox Header */}
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
                            searchInputRef.current?.focus();
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
                  const canEdit =
                    session.role === 'SUPER_ADMIN' ||
                    session.dpdAccess === 'ALL' ||
                    session.dpdAccess === member.dpd;

                  return (
                    <tr
                      key={member.nik}
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
                          {/* Avatar Thumbnail */}
                          <div
                            onClick={() => onOpenDetailModal(member)}
                            className="relative shrink-0 cursor-pointer group/avatar"
                            title="Klik untuk melihat detail profil kader"
                          >
                            <div className="w-9 h-11 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-amber-400 transition-all">
                              {member.fotoProfilUrl ? (
                                <img
                                  src={member.fotoProfilUrl}
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

                            {/* Small indicator if KTP file is attached */}
                            {member.fotoKtpUrl && (
                              <div
                                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-xs"
                                title="KTP Elektronik Terunggah & Terverifikasi"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Name and NIK */}
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

                      {/* Jabatan */}
                      <td className="p-3 text-slate-800 dark:text-slate-300 font-medium">
                        <span className="text-slate-900 dark:text-slate-200">{member.jabatan}</span>
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
                          {/* Detail & Lihat Data Kader */}
                          <button
                            onClick={() => onOpenDetailModal(member)}
                            title="Lihat Detail Profil & Dokumen KTP"
                            className="btn-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span>Detail</span>
                          </button>

                          {/* Quick Status Update (Soft-Delete) */}
                          <button
                            disabled={!canEdit}
                            onClick={() => onOpenStatusModal(member)}
                            title="Ubah Status (Aktif / Non-Aktif)"
                            className="btn-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ubah Status</span>
                          </button>

                          {/* Edit Details (Distinctive Edit Color as Requested) */}
                          <button
                            disabled={!canEdit}
                            onClick={() => onOpenEditModal(member)}
                            title="Edit Data Lengkap Kader"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
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
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <div>
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


