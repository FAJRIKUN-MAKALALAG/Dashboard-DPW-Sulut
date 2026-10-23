import React, { useRef, useEffect } from 'react';
import { UserSession } from '../../types';
import { SearchCategory } from '../../hooks/useMemberFilterLogic';
import {
  Search,
  Building,
  Layers,
  MapPin,
  CheckCircle2,
  IdCard,
  User,
  X,
} from 'lucide-react';

interface MemberFilterBarProps {
  session: UserSession;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  searchCategory: SearchCategory;
  setSearchCategory: (c: SearchCategory) => void;
  selectedDpd: string;
  setSelectedDpd: (d: string) => void;
  selectedDpcFilter: string;
  setSelectedDpcFilter: (d: string) => void;
  selectedDprtFilter: string;
  setSelectedDprtFilter: (d: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  setCurrentPage: (p: number) => void;
  membersCount: number;
  filteredCount: number;
  activeFilteredCount: number;
  nonActiveFilteredCount: number;
  dpdOptionsWithCount: Array<{ id: string; name: string; count: number }>;
  activeRegion: any;
  availableDpcOptions: { dpdLevelCount: number; subdistricts: Array<{ name: string; count: number }> };
  availableDprtOptions: Array<{ name: string; count: number }>;
  availableRolesWithCount: Array<{ role: string; count: number }>;
}

export const MemberFilterBar: React.FC<MemberFilterBarProps> = ({
  session,
  searchTerm,
  setSearchTerm,
  searchCategory,
  setSearchCategory,
  selectedDpd,
  setSelectedDpd,
  selectedDpcFilter,
  setSelectedDpcFilter,
  selectedDprtFilter,
  setSelectedDprtFilter,
  selectedStatus,
  setSelectedStatus,
  selectedRole,
  setSelectedRole,
  setCurrentPage,
  membersCount,
  filteredCount,
  activeFilteredCount,
  nonActiveFilteredCount,
  dpdOptionsWithCount,
  activeRegion,
  availableDpcOptions,
  availableDprtOptions,
  availableRolesWithCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  return (
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

      {/* Secondary Filters Bar: Cascading Teritorial (DPD -> DPC -> DPRt -> Status -> Jabatan) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. DPD Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            1. DPD (Kab/Kota):
          </label>
          {session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW' ? (
            <select
              value={selectedDpd}
              onChange={(e) => {
                setSelectedDpd(e.target.value);
                setSelectedDpcFilter('ALL');
                setSelectedDprtFilter('ALL');
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="ALL">Semua 15 DPD ({membersCount} kader)</option>
              {dpdOptionsWithCount.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} {r.count > 0 ? `(${r.count})` : '(0)'}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold truncate">
              {session.dpdAccess}
            </div>
          )}
        </div>

        {/* 2. DPC Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            2. DPC (Kecamatan):
          </label>
          {(session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') && session.dpcAccess && session.dpcAccess !== 'ALL' ? (
            <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold truncate">
              Kec. {session.dpcAccess}
            </div>
          ) : (
            <select
              value={selectedDpcFilter}
              disabled={!activeRegion}
              onChange={(e) => {
                setSelectedDpcFilter(e.target.value);
                setSelectedDprtFilter('ALL');
                setCurrentPage(1);
              }}
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium ${
                !activeRegion
                  ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer'
              }`}
            >
              {!activeRegion ? (
                <option value="ALL">Pilih DPD Terlebih Dahulu</option>
              ) : (
                <>
                  <option value="ALL">
                    Semua DPC ({activeRegion.subdistricts.length} Kec.)
                  </option>
                  {availableDpcOptions.dpdLevelCount > 0 && (
                    <option value="Wilayah DPD">
                      ⭐ Wilayah DPD (Tingkat Kab/Kota) ({availableDpcOptions.dpdLevelCount})
                    </option>
                  )}
                  {availableDpcOptions.subdistricts.map((sub) => (
                    <option key={sub.name} value={sub.name}>
                      Kec. {sub.name} {sub.count > 0 ? `(${sub.count})` : '(0)'}
                    </option>
                  ))}
                </>
              )}
            </select>
          )}
        </div>

        {/* 3. DPRt Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            3. DPRt (Desa/Kel.):
          </label>
          {session.role === 'ADMIN_DPRT' && session.dprtAccess && session.dprtAccess !== 'ALL' ? (
            <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold truncate">
              Desa/Kel. {session.dprtAccess}
            </div>
          ) : (
            <select
              value={selectedDprtFilter}
              disabled={!activeRegion || selectedDpcFilter === 'ALL' || selectedDpcFilter === 'Wilayah DPD'}
              onChange={(e) => {
                setSelectedDprtFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium ${
                !activeRegion || selectedDpcFilter === 'ALL' || selectedDpcFilter === 'Wilayah DPD'
                  ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer'
              }`}
            >
              {!activeRegion || selectedDpcFilter === 'ALL' ? (
                <option value="ALL">Pilih DPC Terlebih Dahulu</option>
              ) : selectedDpcFilter === 'Wilayah DPD' ? (
                <option value="ALL">Khusus Tingkat DPD</option>
              ) : (
                <>
                  <option value="ALL">
                    Semua DPRt di Kec. {selectedDpcFilter} ({availableDprtOptions.length} Desa)
                  </option>
                  {availableDprtOptions.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.count > 0 ? `(${v.count})` : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
          )}
        </div>

        {/* 4. Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            4. Status Kader:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
          >
            <option value="ALL">Semua Status (Aktif & Non-Aktif)</option>
            <option value="Aktif">Hanya Aktif</option>
            <option value="Non-Aktif (Meninggal)">Non-Aktif: Meninggal</option>
            <option value="Non-Aktif (Pindah Partai/Mundur)">Non-Aktif: Pindah Partai/Mundur</option>
            <option value="Non-Aktif (Pindah Domisili)">Non-Aktif: Pindah Domisili</option>
          </select>
        </div>

        {/* 5. Jabatan Struktur Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <IdCard className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            5. Jabatan Struktur:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer font-medium truncate"
          >
            <option value="ALL">Semua Jabatan ({filteredCount} kader)</option>
            {availableRolesWithCount.map(({ role, count }) => (
              <option key={role} value={role}>
                {role} {count > 0 ? `(${count})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Territorial Filter Breadcrumb & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2 font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 font-sans border border-slate-200 dark:border-slate-800">
            <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">Sulawesi Utara</span>
            <span className="text-slate-400">›</span>
            <span className={selectedDpd !== 'ALL' ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-slate-500'}>
              {selectedDpd !== 'ALL' ? selectedDpd.replace(/^(Kabupaten|Kota)\s+/, '') : 'Semua DPD'}
            </span>
            <span className="text-slate-400">›</span>
            <span className={selectedDpcFilter !== 'ALL' ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-slate-500'}>
              {selectedDpcFilter !== 'ALL' ? (selectedDpcFilter === 'Wilayah DPD' ? 'Pengurus DPD' : `Kec. ${selectedDpcFilter}`) : 'Semua DPC'}
            </span>
            <span className="text-slate-400">›</span>
            <span className={selectedDprtFilter !== 'ALL' ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}>
              {selectedDprtFilter !== 'ALL' ? `Desa ${selectedDprtFilter}` : 'Semua DPRt'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">·</span>

          {searchTerm.trim() ? (
            <span className="text-blue-800 dark:text-blue-300">
              Pencarian "<strong className="text-slate-900 dark:text-white">{searchTerm}</strong>":{' '}
              <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> ditemukan
            </span>
          ) : (
            <span className="text-slate-600 dark:text-slate-400">
              Total: <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredCount}</strong> kader
            </span>
          )}

          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
            <strong>{activeFilteredCount}</strong> Aktif
          </span>
          {nonActiveFilteredCount > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-semibold">
                <strong>{nonActiveFilteredCount}</strong> Non-Aktif
              </span>
            </>
          )}
        </div>

        {(searchTerm ||
          (session.role === 'SUPER_ADMIN' && selectedDpd !== 'ALL') ||
          selectedDpcFilter !== 'ALL' ||
          selectedDprtFilter !== 'ALL' ||
          selectedStatus !== 'ALL' ||
          selectedRole !== 'ALL' ||
          searchCategory !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchCategory('ALL');
              if (session.role === 'SUPER_ADMIN') setSelectedDpd('ALL');
              setSelectedDpcFilter('ALL');
              setSelectedDprtFilter('ALL');
              setSelectedStatus('ALL');
              setSelectedRole('ALL');
              setCurrentPage(1);
            }}
            className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer font-medium hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    </div>
  );
};
