import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS, LEVEL_PARTY_ROLES, PARTY_ROLES } from '../data/sulutRegions';
import {
  isDpdMatch,
  getMemberSubOrgCategory,
  getDewanWilayahInfo,
  SubOrgCategory,
  getDpdPimpinanCompliance,
} from '../utils/structureReadinessUtils';
import { sortMembersByHierarchy, isDefinitiveLeader } from '../utils/jobMatchingUtils';
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
  Award,
  Table,
  AlertTriangle,
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
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const StructureDrilldownModal: React.FC<StructureDrilldownModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  initialFilter,
  onSelectMember,
  onOpenTerritorialMatrix,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt'>(
    initialFilter?.level || 'ALL'
  );
  const [selectedDpd, setSelectedDpd] = useState<string>(
    initialFilter?.dpd || (session.role !== 'SUPER_ADMIN' ? session.dpdAccess : 'ALL')
  );
  const [selectedSubOrg, setSelectedSubOrg] = useState<'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR'>('ALL');
  const [selectedJabatan, setSelectedJabatan] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showVacantOnly, setShowVacantOnly] = useState<boolean>(false);

  // Sinkronisasi state saat initialFilter atau modal dibuka kembali
  useEffect(() => {
    if (isOpen) {
      setSelectedLevel(initialFilter?.level || 'ALL');
      setSelectedDpd(
        initialFilter?.dpd || (session.role !== 'SUPER_ADMIN' ? session.dpdAccess : 'ALL')
      );
      setSelectedSubOrg('ALL');
      setSelectedJabatan('ALL');
      setSearchTerm('');
      setShowVacantOnly(false);
    }
  }, [isOpen, initialFilter, session]);

  // Dropdown jabatan dinamis berdasarkan level struktur & data riil di database
  const availableJabatanOptionsWithCount = useMemo(() => {
    // Ambil anggota sesuai level & wilayah yang dipilih
    const matched = members.filter((m) => {
      if (m.status !== 'Aktif') return false;
      if (selectedLevel !== 'ALL' && m.tingkatKepengurusan !== selectedLevel) return false;
      if (selectedDpd !== 'ALL' && !isDpdMatch(m.dpd, selectedDpd)) return false;
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

  // Base members according to level & DPD for calculating organ counts
  const baseScopeMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status !== 'Aktif') return false;
      if (selectedLevel !== 'ALL' && m.tingkatKepengurusan !== selectedLevel) return false;
      if (selectedDpd !== 'ALL' && !isDpdMatch(m.dpd, selectedDpd)) return false;
      if (session.role === 'ADMIN_DPD' && !isDpdMatch(m.dpd, session.dpdAccess)) return false;
      return true;
    });
  }, [members, selectedLevel, selectedDpd, session]);

  const countOrganAll = baseScopeMembers.length;
  const countPimpinan = baseScopeMembers.filter((m) => getMemberSubOrgCategory(m) === 'PIMPINAN').length;
  const countPertimbangan = baseScopeMembers.filter((m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN').length;
  const countPakar = baseScopeMembers.filter((m) => getMemberSubOrgCategory(m) === 'PAKAR').length;

  // Filter members based on structural positions, sub-organ & query
  const filteredList = useMemo(() => {
    const list = baseScopeMembers.filter((m) => {
      // Filter Sub-Organ (Dewan Pimpinan vs Pertimbangan vs Pakar)
      if (selectedSubOrg !== 'ALL' && getMemberSubOrgCategory(m) !== selectedSubOrg) {
        return false;
      }

      // Filter Jabatan spesifik
      if (selectedJabatan !== 'ALL' && m.jabatan !== selectedJabatan) {
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

    return sortMembersByHierarchy(list);
  }, [baseScopeMembers, selectedSubOrg, selectedJabatan, searchTerm]);

  // Anggota ber-SK yang tersaring berdasarkan wilayah yang sedang dipilih
  const dpdScopedMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status !== 'Aktif' || !m.isPengurus) return false;
      if (selectedDpd !== 'ALL' && !isDpdMatch(m.dpd, selectedDpd)) return false;
      return true;
    });
  }, [members, selectedDpd]);

  const countDpw = dpdScopedMembers.filter((m) => m.tingkatKepengurusan === 'DPW').length;
  const countDpd = dpdScopedMembers.filter((m) => m.tingkatKepengurusan === 'DPD').length;
  const countDpc = dpdScopedMembers.filter((m) => m.tingkatKepengurusan === 'DPC').length;
  const countDprt = dpdScopedMembers.filter((m) => m.tingkatKepengurusan === 'DPRt').length;

  // Kepatuhan formasi 36 jabatan DPD Bagian A (Dewan Pimpinan Daerah)
  const dpdCompliance = useMemo(() => {
    if (selectedDpd === 'ALL' || selectedDpd === 'Sulawesi Utara') return null;
    return getDpdPimpinanCompliance(selectedDpd, members);
  }, [selectedDpd, members]);

  const modalTitle = useMemo(() => {
    if (selectedDpd !== 'ALL') {
      if (selectedLevel === 'DPC') return `Pengurus DPC di ${selectedDpd}`;
      if (selectedLevel === 'DPRt') return `Pengurus DPRt di ${selectedDpd}`;
      if (selectedLevel === 'DPD') return `Susunan Pengurus DPD ${selectedDpd}`;
      return `Daftar Pengurus Ber-SK ${selectedDpd}`;
    }
    if (selectedLevel === 'DPW') return 'Susunan Pengurus DPW Partai NasDem Sulut';
    if (selectedLevel === 'DPD') return 'Daftar Pengurus DPD Se-Sulawesi Utara';
    if (selectedLevel === 'DPC') return 'Daftar Pengurus DPC Kecamatan Se-Sulut';
    if (selectedLevel === 'DPRt') return 'Daftar Pengurus DPRt Basis Desa Se-Sulut';
    return 'Daftar Pengurus & Pejabat Struktural';
  }, [selectedDpd, selectedLevel]);

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {modalTitle}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                    {filteredList.length} Pengurus Terdata
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDpd !== 'ALL'
                    ? `Wilayah: ${selectedDpd} · Menampilkan pengurus ber-SK resmi`
                    : 'Partai NasDem Sulut · Legalitas SK, kode referral & basis domisili KTP'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenTerritorialMatrix && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTerritorialMatrix(
                      selectedDpd !== 'ALL' ? selectedDpd : undefined,
                      undefined,
                      selectedLevel === 'ALL' ? 'DPD' : selectedLevel
                    );
                  }}
                  className="hidden sm:flex btn-white text-xs font-semibold px-3 py-1.5 rounded-lg items-center gap-1.5 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shadow-2xs"
                  title="Buka tabel matriks untuk menginput atau mengedit jabatan"
                >
                  <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Input Matriks Jabatan</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Level Selector Badges */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedLevel === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua Tingkat ({dpdScopedMembers.length})
              </button>
              {(selectedDpd === 'ALL' || selectedDpd === 'Sulawesi Utara') && (
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
              )}
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

          {/* Sub-Organ Filter (Dewan Pimpinan, Dewan Pertimbangan, Dewan Pakar) */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
              Organ Struktur:
            </span>
            <button
              onClick={() => setSelectedSubOrg('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-all ${
                selectedSubOrg === 'ALL'
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Semua ({countOrganAll})
            </button>
            <button
              onClick={() => setSelectedSubOrg('PIMPINAN')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-all ${
                selectedSubOrg === 'PIMPINAN'
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900'
              }`}
            >
              Dewan Pimpinan ({countPimpinan})
            </button>
            <button
              onClick={() => setSelectedSubOrg('PERTIMBANGAN')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-all ${
                selectedSubOrg === 'PERTIMBANGAN'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-900'
              }`}
            >
              Dewan Pertimbangan ({countPertimbangan})
            </button>
            <button
              onClick={() => setSelectedSubOrg('PAKAR')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-all ${
                selectedSubOrg === 'PAKAR'
                  ? 'bg-purple-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-900'
              }`}
            >
              Dewan Pakar ({countPakar})
            </button>
          </div>

          {/* Sub-banner Kepatuhan Formasi DPD Bagian A */}
          {dpdCompliance && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/30 dark:to-blue-950/30 border-b border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  Formasi DPD Bagian A:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    dpdCompliance.isComplete
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {dpdCompliance.filledCount}/36 Terisi
                </span>
                {dpdCompliance.vacantCount > 0 && (
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    (Kurang {dpdCompliance.vacantCount} posisi lagi)
                  </span>
                )}
              </div>

              {dpdCompliance.vacantCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowVacantOnly(!showVacantOnly)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    showVacantOnly
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span>
                    {showVacantOnly
                      ? '✓ Tampilkan Semua Pengurus'
                      : `⚡ Buka ${dpdCompliance.vacantCount} Jabatan Belum Terisi`}
                  </span>
                </button>
              )}
            </div>
          )}

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
          {showVacantOnly && dpdCompliance ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold">
                    Daftar {dpdCompliance.vacantCount} Jabatan DPD Bagian A yang Belum Terisi
                  </span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Wilayah: <strong>{selectedDpd}</strong> &middot; Perlu dilengkapi pengurus ber-SK resmi.
                  </p>
                </div>
                {onOpenTerritorialMatrix && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTerritorialMatrix(selectedDpd, undefined, 'DPD');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs shrink-0"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>+ Isi di Matriks DPD</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama Jabatan Baku (36 Formasi Resmi DPD)</th>
                      <th className="p-3 text-center w-32">Status Keterisian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dpdCompliance.slots.map((slot) => (
                      <tr
                        key={slot.no}
                        className={
                          slot.isFilled
                            ? 'bg-slate-50/40 dark:bg-slate-900/40'
                            : 'bg-amber-50/30 dark:bg-amber-950/20'
                        }
                      >
                        <td className="p-3 text-center font-mono font-bold text-slate-500">
                          #{slot.no}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {slot.jabatan}
                          </div>
                          {slot.isFilled && slot.member ? (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Terisi: {slot.member.namaLengkap} (NIK: {slot.member.nik})
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                              ⚡ Belum terisi / lowong di data SK
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {slot.isFilled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Terisi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              <span>Lowong</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : filteredList.length === 0 ? (
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
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Nama Lengkap & NIK</th>
                    <th className="p-3">Organ & Jabatan SK</th>
                    <th className="p-3">SK Resmi</th>
                    <th className="p-3">Kode Referral</th>
                    <th className="p-3">Domisili KTP (Basis DPRt)</th>
                    <th className="p-3">Kontak & Sosmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((m, idx) => {
                    const isKetua = isDefinitiveLeader(m.jabatan);
                    return (
                      <tr
                        key={m.nik}
                        className={`transition-colors ${
                          isKetua
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
                            : 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <td className="p-3 text-center shrink-0">
                          {isKetua ? (
                            <span
                              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-black bg-amber-500 text-slate-950 font-mono shadow-xs"
                              title={`Ketua Definitif ${m.tingkatKepengurusan || ''} (Peringkat #1 Database)`}
                            >
                              #1
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-semibold text-slate-400">
                              #{idx + 1}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>{m.namaLengkap}</span>
                            {isKetua && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50">
                                Ketua #{m.tingkatKepengurusan || ''}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            NIK: {m.nik}
                          </div>
                        </td>
                      <td className="p-3">
                        {(() => {
                          const dewan = getDewanWilayahInfo(m);
                          if (dewan.isDewan) {
                            return (
                              <div className="flex flex-wrap items-center gap-1 mb-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                                    dewan.category === 'PERTIMBANGAN'
                                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                      : 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                                  }`}
                                >
                                  <Award className="w-3 h-3 text-current" />
                                  <span>{dewan.councilName}</span>
                                  <span className="opacity-50">·</span>
                                  <span className="font-extrabold">{dewan.shortLocationLabel}</span>
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {m.tingkatKepengurusan || 'DPW'}
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Dewan Pimpinan
                              </span>
                            </div>
                          );
                        })()}
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
                  );
                })}
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
