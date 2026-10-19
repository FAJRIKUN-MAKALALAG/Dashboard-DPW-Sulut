import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS, STATUS_BADGE_CONFIG, PARTY_ROLES, STATUS_OPTIONS, LEVEL_PARTY_ROLES } from '../data/sulutRegions';
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
  Trash2,
  FileText,
  Building,
  Layers,
  ArrowLeft,
  Users,
  Award,
  UserCheck,
} from 'lucide-react';
import { exportMembersToExcel, exportMembersToCsv } from '../utils/excelUtils';
import { getInitials, getAvatarColor } from '../utils/imageUtils';
import { isDpdMatch, isDpcMatch, isDprtMatch, getDewanWilayahInfo, getMemberSubOrgCategory } from '../utils/structureReadinessUtils';

type SearchCategory = 'ALL' | 'NIK' | 'NAMA' | 'DPC';

interface MemberManagementProps {
  members: Member[];
  session: UserSession;
  initialDpdFilter?: string;
  initialStatusFilter?: MemberStatus;
  initialMembershipFilter?: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  onOpenAddModal: () => void;
  onOpenBulkImport: () => void;
  onOpenStatusModal: (member: Member) => void;
  onOpenCardModal: (member: Member) => void;
  onOpenEditModal: (member: Member) => void;
  onOpenDetailModal: (member: Member) => void;
  onOpenDeletionRequest: (member: Member) => void;
  onDirectDelete: (member: Member) => void;
  onBackToDashboard?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  session,
  initialDpdFilter,
  initialStatusFilter,
  initialMembershipFilter,
  onOpenAddModal,
  onOpenBulkImport,
  onOpenStatusModal,
  onOpenCardModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenDeletionRequest,
  onDirectDelete,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Selection state for batch CSV export
  const [selectedNiks, setSelectedNiks] = useState<Set<string>>(new Set());

  const [selectedDpd, setSelectedDpd] = useState<string>(
    session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW' && session.dpdAccess !== 'ALL'
      ? session.dpdAccess
      : initialDpdFilter || 'ALL'
  );
  const [selectedDpcFilter, setSelectedDpcFilter] = useState<string>(
    (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') && session.dpcAccess && session.dpcAccess !== 'ALL'
      ? session.dpcAccess
      : 'ALL'
  );
  const [selectedDprtFilter, setSelectedDprtFilter] = useState<string>(
    session.role === 'ADMIN_DPRT' && session.dprtAccess && session.dprtAccess !== 'ALL'
      ? session.dprtAccess
      : 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [membershipFilter, setMembershipFilter] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>(
    initialMembershipFilter || 'ALL'
  );
  const [selectedCouncilFilter, setSelectedCouncilFilter] = useState<'ALL' | 'PERTIMBANGAN' | 'PAKAR' | 'PIMPINAN'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Sinkronisasi saat ada navigasi filter dari komponen lain (misal dari dashboard)
  useEffect(() => {
    if (initialDpdFilter) {
      setSelectedDpd(initialDpdFilter);
      setSelectedDpcFilter('ALL');
      setSelectedDprtFilter('ALL');
      setCurrentPage(1);
    }
  }, [initialDpdFilter]);

  useEffect(() => {
    if (initialStatusFilter) {
      setSelectedStatus(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialMembershipFilter) {
      setMembershipFilter(initialMembershipFilter);
      setCurrentPage(1);
    }
  }, [initialMembershipFilter]);

  // Daftar DPD beserta jumlah data kader riil di database Supabase
  const dpdOptionsWithCount = useMemo(() => {
    const baseRegions =
      session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW' && session.dpdAccess !== 'ALL'
        ? SULUT_REGIONS.filter((r) => isDpdMatch(r.name, session.dpdAccess))
        : SULUT_REGIONS;

    return baseRegions.map((region) => {
      const count = members.filter((m) => isDpdMatch(m.dpd, region.name)).length;
      return {
        id: region.id,
        name: region.name,
        count,
      };
    });
  }, [members, session]);

  // DPD aktif yang terpilih
  const activeRegion = useMemo(() => {
    const effectiveDpd =
      session.role === 'ADMIN_DPD' && session.dpdAccess !== 'ALL'
        ? session.dpdAccess
        : selectedDpd;
    if (!effectiveDpd || effectiveDpd === 'ALL') return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, effectiveDpd)) || null;
  }, [selectedDpd, session]);

  // Daftar DPC (Kecamatan) dari DPD terpilih beserta hitungan data riil
  const availableDpcOptions = useMemo(() => {
    if (!activeRegion) return { dpdLevelCount: 0, subdistricts: [] };
    const effectiveDpd = activeRegion.name;

    // Anggota pengurus khusus tingkat DPD (yang dpc = 'Wilayah DPD' atau tingkat 'DPD' atau 'Umum (DPD)')
    const dpdLevelCount = members.filter(
      (m) =>
        isDpdMatch(m.dpd, effectiveDpd) &&
        (isDpcMatch(m.dpc, 'Wilayah DPD') ||
          isDpcMatch(m.dpc, 'Umum (DPD)') ||
          m.tingkatKepengurusan === 'DPD')
    ).length;

    // Ambil daftar kecamatan baku dari activeRegion
    const subdistrictMap = new Map<string, { name: string; count: number; villages: string[] }>();
    activeRegion.subdistricts.forEach((sub) => {
      subdistrictMap.set(sub.name.toLowerCase().trim(), {
        name: sub.name,
        count: 0,
        villages: [...sub.villages],
      });
    });

    // Tambahkan juga jika ada nama DPC riil anggota di database yang belum terdaftar di master
    members.forEach((m) => {
      if (isDpdMatch(m.dpd, effectiveDpd) && m.dpc && m.dpc.trim()) {
        const cleanName = m.dpc.replace(/^(kecamatan|kec\.|kec)\s+/gi, '').trim();
        const normKey = cleanName.toLowerCase();
        if (
          cleanName !== '-' &&
          cleanName !== 'Wilayah DPD' &&
          cleanName !== 'Umum (DPD)' &&
          normKey !== 'wilayah dpd' &&
          normKey !== 'umum (dpd)'
        ) {
          if (!Array.from(subdistrictMap.keys()).some((k) => isDpcMatch(k, cleanName))) {
            subdistrictMap.set(normKey, {
              name: cleanName,
              count: 0,
              villages: [],
            });
          }
        }
      }
    });

    const subdistricts = Array.from(subdistrictMap.values())
      .map((sub) => {
        const count = members.filter(
          (m) => isDpdMatch(m.dpd, effectiveDpd) && isDpcMatch(m.dpc, sub.name)
        ).length;
        return {
          name: sub.name,
          count,
          villages: sub.villages,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      dpdLevelCount,
      subdistricts,
    };
  }, [activeRegion, members]);

  // Daftar DPRt (Desa/Kelurahan) dari DPC terpilih beserta hitungan data riil
  const availableDprtOptions = useMemo(() => {
    if (!activeRegion || selectedDpcFilter === 'ALL' || selectedDpcFilter === 'Wilayah DPD') {
      return [];
    }
    const effectiveDpd = activeRegion.name;
    const subdistrict = activeRegion.subdistricts.find((s) => isDpcMatch(s.name, selectedDpcFilter));

    const villageMap = new Map<string, string>(); // normalized -> original name
    (subdistrict?.villages || []).forEach((v) => {
      villageMap.set(v.toLowerCase().trim(), v);
    });

    // Tambahkan desa riil anggota yang ada di database bila ada di luar daftar baku
    members.forEach((m) => {
      if (
        isDpdMatch(m.dpd, effectiveDpd) &&
        isDpcMatch(m.dpc, selectedDpcFilter) &&
        m.dprt &&
        m.dprt.trim()
      ) {
        const cleanVillage = m.dprt.replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '').trim();
        const normKey = cleanVillage.toLowerCase();
        if (
          cleanVillage !== '-' &&
          cleanVillage !== 'Wilayah DPC' &&
          cleanVillage !== 'Pusat/Umum' &&
          normKey !== 'wilayah dpc' &&
          normKey !== 'pusat/umum'
        ) {
          if (!villageMap.has(normKey)) {
            villageMap.set(normKey, cleanVillage);
          }
        }
      }
    });

    return Array.from(villageMap.values())
      .sort((a, b) => a.localeCompare(b))
      .map((villageName) => {
        const count = members.filter(
          (m) =>
            isDpdMatch(m.dpd, effectiveDpd) &&
            isDpcMatch(m.dpc, selectedDpcFilter) &&
            isDprtMatch(m.dprt, villageName)
        ).length;
        return {
          name: villageName,
          count,
        };
      });
  }, [activeRegion, selectedDpcFilter, members]);

  // Jabatan dinamis yang akurat sesuai data riil yang ada di database & filter wilayah cascading:
  const availableRolesWithCount = useMemo(() => {
    // Ambil anggota sesuai yurisdiksi dan wilayah cascading yang sedang dipilih
    const scopedMembers = members.filter((m) => {
      if (session.role === 'ADMIN_DPD') {
        if (session.dpdAccess !== 'ALL' && !isDpdMatch(m.dpd, session.dpdAccess)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(m.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(m.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPC') {
        if (!isDpdMatch(m.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(m.dpc, session.dpcAccess)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(m.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPRT') {
        if (!isDpdMatch(m.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(m.dpc, session.dpcAccess)) return false;
        if (session.dprtAccess && !isDprtMatch(m.dprt, session.dprtAccess)) return false;
      } else {
        if (selectedDpd !== 'ALL' && !isDpdMatch(m.dpd, selectedDpd)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(m.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(m.dprt, selectedDprtFilter)) return false;
      }

      if (selectedStatus !== 'ALL' && m.status !== selectedStatus) {
        return false;
      }

      return true;
    });

    // Hitung jumlah personil per jabatan riil di database sesuai filter wilayah & sub-organ
    const roleCounts = new Map<string, number>();
    scopedMembers.forEach((m) => {
      if (membershipFilter !== 'ANGGOTA' && selectedCouncilFilter !== 'ALL') {
        if (getMemberSubOrgCategory(m) !== selectedCouncilFilter) return;
      }
      if (m.jabatan && m.jabatan.trim()) {
        const j = m.jabatan.trim();
        roleCounts.set(j, (roleCounts.get(j) || 0) + 1);
      }
    });

    // Hierarki urutan jabatan standar NasDem
    const priority = [
      'Ketua',
      'Sekretaris',
      'Bendahara',
      'Wakil Sekretaris',
      'Wakil Bendahara',
    ];

    const sortedDbRoles = Array.from(roleCounts.keys()).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Jika database belum terisi atau baru, gunakan fallback standar resmi
    if (sortedDbRoles.length === 0) {
      const fallbackRoles =
        session.role === 'ADMIN_DPRT' || (selectedDprtFilter && selectedDprtFilter !== 'ALL')
          ? LEVEL_PARTY_ROLES.DPRt
          : selectedDpcFilter && selectedDpcFilter !== 'ALL' && selectedDpcFilter !== 'Wilayah DPD'
          ? LEVEL_PARTY_ROLES.DPC
          : selectedDpd && selectedDpd !== 'ALL'
          ? LEVEL_PARTY_ROLES.DPD
          : PARTY_ROLES;

      return fallbackRoles.map((r) => ({ role: r, count: 0 }));
    }

    return sortedDbRoles.map((r) => ({ role: r, count: roleCounts.get(r) || 0 }));
  }, [members, session, selectedDpd, selectedDpcFilter, selectedDprtFilter, selectedStatus, selectedCouncilFilter, membershipFilter]);

  const availableRoles = useMemo(() => {
    return availableRolesWithCount.map((item) => item.role);
  }, [availableRolesWithCount]);

  // Reset selectedRole jika tidak lagi ada di availableRoles
  useEffect(() => {
    if (selectedRole !== 'ALL' && !availableRoles.includes(selectedRole)) {
      setSelectedRole('ALL');
    }
  }, [availableRoles, selectedRole]);

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

  // Hitung jumlah pengurus vs anggota biasa dalam cakupan wilayah yang sedang aktif
  const territoryScopedMembers = useMemo(() => {
    return members.filter((member) => {
      if (session.role === 'ADMIN_DPD') {
        if (session.dpdAccess !== 'ALL' && !isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(member.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPC') {
        if (!isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(member.dpc, session.dpcAccess)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPRT') {
        if (!isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(member.dpc, session.dpcAccess)) return false;
        if (session.dprtAccess && !isDprtMatch(member.dprt, session.dprtAccess)) return false;
      } else {
        if (selectedDpd !== 'ALL' && !isDpdMatch(member.dpd, selectedDpd)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(member.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      }
      if (selectedStatus !== 'ALL' && member.status !== selectedStatus) return false;
      return true;
    });
  }, [members, selectedDpd, selectedDpcFilter, selectedDprtFilter, selectedStatus, session]);

  const countPengurusScope = useMemo(() => {
    return territoryScopedMembers.filter((m) => m.isPengurus || Boolean(m.nomorSK)).length;
  }, [territoryScopedMembers]);

  const countPertimbanganScope = useMemo(() => {
    return territoryScopedMembers.filter(
      (m) => (m.isPengurus || Boolean(m.nomorSK)) && getMemberSubOrgCategory(m) === 'PERTIMBANGAN'
    ).length;
  }, [territoryScopedMembers]);

  const countPakarScope = useMemo(() => {
    return territoryScopedMembers.filter(
      (m) => (m.isPengurus || Boolean(m.nomorSK)) && getMemberSubOrgCategory(m) === 'PAKAR'
    ).length;
  }, [territoryScopedMembers]);

  const countPimpinanScope = useMemo(() => {
    return territoryScopedMembers.filter(
      (m) => (m.isPengurus || Boolean(m.nomorSK)) && getMemberSubOrgCategory(m) === 'PIMPINAN'
    ).length;
  }, [territoryScopedMembers]);

  const countAnggotaScope = useMemo(() => {
    return territoryScopedMembers.filter((m) => !m.isPengurus && !m.nomorSK).length;
  }, [territoryScopedMembers]);

  // Filter pipeline dengan pencocokan teritorial riil isDpdMatch, isDpcMatch, isDprtMatch
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Role scope lock:
      if (session.role === 'ADMIN_DPD') {
        if (session.dpdAccess !== 'ALL' && !isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(member.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPC') {
        if (!isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(member.dpc, session.dpcAccess)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      } else if (session.role === 'ADMIN_DPRT') {
        if (!isDpdMatch(member.dpd, session.dpdAccess)) return false;
        if (session.dpcAccess && !isDpcMatch(member.dpc, session.dpcAccess)) return false;
        if (session.dprtAccess && !isDprtMatch(member.dprt, session.dprtAccess)) return false;
      } else {
        if (selectedDpd !== 'ALL' && !isDpdMatch(member.dpd, selectedDpd)) return false;
        if (selectedDpcFilter !== 'ALL' && !isDpcMatch(member.dpc, selectedDpcFilter)) return false;
        if (selectedDprtFilter !== 'ALL' && !isDprtMatch(member.dprt, selectedDprtFilter)) return false;
      }

      if (selectedStatus !== 'ALL' && member.status !== selectedStatus) {
        return false;
      }

      // Filter Pemisahan Pengurus vs Anggota Biasa
      if (membershipFilter === 'PENGURUS' && !member.isPengurus && !member.nomorSK) {
        return false;
      }
      if (membershipFilter === 'ANGGOTA' && (member.isPengurus || Boolean(member.nomorSK))) {
        return false;
      }

      // Filter Sub-Organisasi (Dewan Pertimbangan vs Dewan Pakar vs Dewan Pimpinan)
      if (membershipFilter !== 'ANGGOTA' && selectedCouncilFilter !== 'ALL') {
        if (getMemberSubOrgCategory(member) !== selectedCouncilFilter) {
          return false;
        }
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
  }, [
    members,
    selectedDpd,
    selectedDpcFilter,
    selectedDprtFilter,
    selectedStatus,
    membershipFilter,
    selectedCouncilFilter,
    selectedRole,
    searchTerm,
    searchCategory,
    session,
  ]);

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
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="btn-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mb-2.5 self-start"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kembali ke Dashboard Utama</span>
            </button>
          )}
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

        {/* Secondary Filters Bar: Cascading Teritorial (DPD -> DPC -> DPRt -> Status -> Jabatan) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. DPD Filter (Kabupaten/Kota) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              1. DPD (Kab/Kota):
            </label>
            {session.role === 'SUPER_ADMIN' ? (
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
                <option value="ALL">Semua 15 DPD ({members.length} kader)</option>
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

          {/* 2. DPC Filter (Kecamatan - Cascading dari DPD terpilih) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              2. DPC (Kecamatan):
            </label>
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
          </div>

          {/* 3. DPRt Filter (Desa/Kelurahan - Cascading dari DPC terpilih) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              3. DPRt (Desa/Kel.):
            </label>
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
          </div>

          {/* 4. Status Keanggotaan Filter */}
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

          {/* 5. Jabatan Struktur Filter - Dinamis sesuai wilayah cascading terpilih */}
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
              <option value="ALL">Semua Jabatan ({filteredMembers.length} kader)</option>
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
            {/* Breadcrumb Teritorial */}
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
                <strong className="text-slate-900 dark:text-white">{filteredMembers.length}</strong> ditemukan
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">
                Total: <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredMembers.length}</strong> kader
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
                searchInputRef.current?.focus();
              }}
              className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer font-medium hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
            >
              Reset Semua Filter
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

      {/* SEPARATED TABS: PENGURUS STRUKTURAL VS ANGGOTA BIASA (BASIS KTP) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tab 1: Semua Kader */}
          <button
            onClick={() => {
              setMembershipFilter('ALL');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              membershipFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Semua Kader</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'ALL'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {territoryScopedMembers.length}
            </span>
          </button>

          {/* Tab 2: Pengurus Ber-SK */}
          <button
            onClick={() => {
              setMembershipFilter('PENGURUS');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              membershipFilter === 'PENGURUS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pengurus Struktural (Ber-SK)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'PENGURUS'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
              }`}
            >
              {countPengurusScope}
            </span>
          </button>

          {/* Tab 3: Anggota Biasa (Basis KTP) */}
          <button
            onClick={() => {
              setMembershipFilter('ANGGOTA');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              membershipFilter === 'ANGGOTA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Anggota Biasa (Basis KTP)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
                membershipFilter === 'ANGGOTA'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {countAnggotaScope}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2">
          {membershipFilter === 'PENGURUS'
            ? 'Menampilkan pejabat struktural & dewan ber-SK'
            : membershipFilter === 'ANGGOTA'
            ? 'Menampilkan kader & anggota riil basis KTP (non-SK)'
            : 'Menampilkan gabungan seluruh kader & pengurus'}
        </div>
      </div>

      {/* SUB-ORGANISASI SEPARATION BAR: DEWAN PERTIMBANGAN, DEWAN PAKAR, DEWAN PIMPINAN */}
      {membershipFilter !== 'ANGGOTA' && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Pemisahan Sub-Organisasi:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setSelectedCouncilFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                selectedCouncilFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({countPengurusScope})
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PERTIMBANGAN');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border ${
                selectedCouncilFilter === 'PERTIMBANGAN'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>I. Dewan Pertimbangan</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PERTIMBANGAN'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                }`}
              >
                {countPertimbanganScope}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PAKAR');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border ${
                selectedCouncilFilter === 'PAKAR'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>II. Dewan Pakar</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PAKAR'
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-200/60 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200'
                }`}
              >
                {countPakarScope}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCouncilFilter('PIMPINAN');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border ${
                selectedCouncilFilter === 'PIMPINAN'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                  : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>III. Dewan Pimpinan</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedCouncilFilter === 'PIMPINAN'
                    ? 'bg-white/25 text-white'
                    : 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200'
                }`}
              >
                {countPimpinanScope}
              </span>
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
                    (session.role === 'ADMIN_DPD' && session.dpdAccess === member.dpd) ||
                    (session.role === 'ADMIN_DPC' && session.dpdAccess === member.dpd && session.dpcAccess === member.dpc) ||
                    (session.role === 'ADMIN_DPRT' && session.dpdAccess === member.dpd && session.dpcAccess === member.dpc && session.dprtAccess === member.dprt);

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

                      {/* Jabatan & SK (Dilengkapi Label Wilayah Dewan Pakar / Pertimbangan & Pembeda Pengurus vs Anggota) */}
                      <td className="p-3 text-slate-800 dark:text-slate-300 font-medium">
                        {(() => {
                          const dewanInfo = getDewanWilayahInfo(member);
                          return (
                            <div className="space-y-1">
                              {/* 1. Label Khusus Dewan Pertimbangan & Dewan Pakar beserta wilayah DPW/DPD/DPC */}
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
                                      <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                    ) : (
                                      <Award className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
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

                          {/* Hapus Data: Super Admin bisa langsung hapus, role daerah mengajukan permohonan ke DPW */}
                          {session.role === 'SUPER_ADMIN' ? (
                            <button
                              onClick={() => onDirectDelete(member)}
                              title="Hapus Data Kader Permanen (Super Admin DPW)"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          ) : (
                            <button
                              disabled={!canEdit}
                              onClick={() => onOpenDeletionRequest(member)}
                              title="Ajukan Permohonan Hapus Data ke DPW"
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


