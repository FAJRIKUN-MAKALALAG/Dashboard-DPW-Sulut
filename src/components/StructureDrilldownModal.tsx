import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS, LEVEL_PARTY_ROLES, PARTY_ROLES } from '../data/sulutRegions';
import {
  X,
  Building,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  ChevronRight,
  Shield,
  Search,
  ExternalLink,
} from 'lucide-react';

interface StructureDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  session: UserSession;
  initialFilter?: {
    level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt';
    dpd?: string;
  };
  onSelectMember?: (member: Member) => void;
}

export const StructureDrilldownModal: React.FC<StructureDrilldownModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  initialFilter,
  onSelectMember,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt'>(
    initialFilter?.level || 'ALL'
  );
  const [selectedDpd, setSelectedDpd] = useState<string>(
    initialFilter?.dpd || (session.role !== 'SUPER_ADMIN' ? session.dpdAccess : 'ALL')
  );
  const [selectedJabatan, setSelectedJabatan] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dropdown jabatan dinamis berdasarkan level struktur & data riil di database
  const availableJabatanOptionsWithCount = useMemo(() => {
    // Ambil anggota sesuai level & wilayah yang dipilih
    const matched = members.filter((m) => {
      if (m.status !== 'Aktif') return false;
      if (selectedLevel !== 'ALL' && m.tingkatKepengurusan !== selectedLevel) return false;
      if (selectedDpd !== 'ALL' && m.dpd !== selectedDpd) return false;
      return true;
    });

    const countMap = new Map<string, number>();
    matched.forEach((m) => {
      if (m.jabatan && m.jabatan.trim()) {
        const j = m.jabatan.trim();
        countMap.set(j, (countMap.get(j) || 0) + 1);
      }
    });

    const priority = [
      'Ketua',
      'Sekretaris',
      'Bendahara',
      'Wakil Sekretaris',
      'Wakil Bendahara',
    ];

    const sortedDbRoles = Array.from(countMap.keys()).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    if (sortedDbRoles.length === 0) {
      const fallback =
        selectedLevel === 'DPW'
          ? LEVEL_PARTY_ROLES.DPW
          : selectedLevel === 'DPD'
          ? LEVEL_PARTY_ROLES.DPD
          : selectedLevel === 'DPC'
          ? LEVEL_PARTY_ROLES.DPC
          : selectedLevel === 'DPRt'
          ? LEVEL_PARTY_ROLES.DPRt
          : PARTY_ROLES;
      return fallback.map((r: string) => ({ role: r, count: 0 }));
    }

    return sortedDbRoles.map((r: string) => ({ role: r, count: countMap.get(r) || 0 }));
  }, [members, selectedLevel, selectedDpd]);

  const availableJabatanOptions = useMemo(() => {
    return availableJabatanOptionsWithCount.map((o: { role: string; count: number }) => o.role);
  }, [availableJabatanOptionsWithCount]);

  // Reset jabatan jika tidak ada di opsi baru
  useEffect(() => {
    if (selectedJabatan !== 'ALL' && !availableJabatanOptions.includes(selectedJabatan)) {
      setSelectedJabatan('ALL');
    }
  }, [availableJabatanOptions, selectedJabatan]);

  if (!isOpen) return null;

  // Filter members based on structural positions & query
  const filteredList = members.filter((m) => {
    // Only active members
    if (m.status !== 'Aktif') return false;

    // Must be pengurus if a specific structural level is selected
    if (selectedLevel !== 'ALL') {
      if (m.tingkatKepengurusan !== selectedLevel) return false;
    }

    // Filter DPD
    if (selectedDpd !== 'ALL' && m.dpd !== selectedDpd) {
      return false;
    }

    // Filter Jabatan spesifik
    if (selectedJabatan !== 'ALL' && m.jabatan !== selectedJabatan) {
      return false;
    }

    // Role restrictions
    if (session.role === 'ADMIN_DPD' && m.dpd !== session.dpdAccess) {
      return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = m.namaLengkap.toLowerCase().includes(q);
      const matchJabatan = m.jabatan.toLowerCase().includes(q);
      const matchNik = m.nik.includes(q);
      const matchSK = m.nomorSK?.toLowerCase().includes(q);
      const matchRef = m.kodeReferral?.toLowerCase().includes(q);
      const matchDpc = m.dpc.toLowerCase().includes(q);
      const matchDprt = m.dprt.toLowerCase().includes(q);
      return matchName || matchJabatan || matchNik || matchSK || matchRef || matchDpc || matchDprt;
    }

    return true;
  });

  const countDpw = members.filter((m) => m.status === 'Aktif' && m.tingkatKepengurusan === 'DPW').length;
  const countDpd = members.filter((m) => m.status === 'Aktif' && m.tingkatKepengurusan === 'DPD').length;
  const countDpc = members.filter((m) => m.status === 'Aktif' && m.tingkatKepengurusan === 'DPC').length;
  const countDprt = members.filter((m) => m.status === 'Aktif' && m.tingkatKepengurusan === 'DPRt').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Daftar Pengurus & Pejabat Struktural
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                    {filteredList.length} Kader
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Partai NasDem Sulut &middot; Legalitas SK, kode referral & basis domisili KTP
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Level Selector Badges */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLevel === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua Pengurus ({members.filter((m) => m.status === 'Aktif' && m.isPengurus).length})
            </button>
            <button
              onClick={() => setSelectedLevel('DPW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLevel === 'DPW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tingkat DPW Sulut ({countDpw})
            </button>
            <button
              onClick={() => setSelectedLevel('DPD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLevel === 'DPD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tingkat DPD Kab/Kota ({countDpd})
            </button>
            <button
              onClick={() => setSelectedLevel('DPC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLevel === 'DPC'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tingkat DPC Kecamatan ({countDpc})
            </button>
            <button
              onClick={() => setSelectedLevel('DPRt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLevel === 'DPRt'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tingkat DPRt Desa/Kel ({countDprt})
            </button>
          </div>

          {/* Dropdown Filters (DPD & Dynamic Jabatan) */}
          <div className="flex flex-wrap items-center gap-2">
            {session.role === 'SUPER_ADMIN' && (
              <select
                value={selectedDpd}
                onChange={(e) => setSelectedDpd(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="ALL">Semua 15 Kab / Kota</option>
                {SULUT_REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedJabatan}
              onChange={(e) => setSelectedJabatan(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
            >
              <option value="ALL">Semua Jabatan ({filteredList.length})</option>
              {availableJabatanOptionsWithCount.map(({ role, count }: { role: string; count: number }) => (
                <option key={role} value={role}>
                  {role} {count > 0 ? `(${count})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pejabat, jabatan, nomor SK, kode referral, atau kelurahan..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredList.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum ada data pengurus ber-SK pada filter ini
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Data akan otomatis terisi saat pengurus yang mengeluarkan SK didaftarkan ke sistem.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Nama Lengkap & NIK</th>
                    <th className="p-3">Tingkat & Jabatan</th>
                    <th className="p-3">SK Resmi</th>
                    <th className="p-3">Kode Referral</th>
                    <th className="p-3">Domisili KTP (Basis DPRt)</th>
                    <th className="p-3">Kontak & Sosmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((m) => (
                    <tr
                      key={m.nik}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {m.namaLengkap}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          NIK: {m.nik}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-1">
                          {m.tingkatKepengurusan || 'DPW'}
                        </div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {m.jabatan}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {m.nomorSK ? (
                          <div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {m.nomorSK}
                            </span>
                            {m.tanggalSK && (
                              <div className="text-[10px] text-slate-400">{m.tanggalSK}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-500 italic">Menunggu Terbit SK</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {m.kodeReferral ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                            {m.kodeReferral}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {m.dprt}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Kec. {m.dpc}, {m.dpd}
                        </div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="font-mono text-slate-700 dark:text-slate-300">
                          {m.nomorHP || '-'}
                        </div>
                        {m.email && <div className="text-slate-500">{m.email}</div>}
                        {m.sosmed && (
                          <div className="text-blue-600 dark:text-blue-400">{m.sosmed}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 max-w-lg">
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">
              Sinkronisasi alamat KTP memastikan seluruh pengurus tetap terdaftar rapi pada basis DPRt masing-masing.
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  </div>
);
};
