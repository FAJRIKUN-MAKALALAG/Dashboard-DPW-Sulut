import { useState, useMemo, useEffect } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import {
  SULUT_REGIONS,
  PARTY_ROLES,
  LEVEL_PARTY_ROLES,
} from '../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getMemberSubOrgCategory,
} from '../utils/structureReadinessUtils';

export type SearchCategory = 'ALL' | 'NIK' | 'NAMA' | 'DPC';

interface UseMemberFilterLogicProps {
  members: Member[];
  session: UserSession;
  initialDpdFilter?: string;
  initialStatusFilter?: MemberStatus;
  initialMembershipFilter?: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  pageSize?: number;
}

export function useMemberFilterLogic({
  members,
  session,
  initialDpdFilter,
  initialStatusFilter,
  initialMembershipFilter,
  pageSize = 15,
}: UseMemberFilterLogicProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('ALL');

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

  // Sync external filters (e.g. from Dashboard navigations)
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

  // Daftar DPD beserta hitungan data
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

  // Daftar DPC (Kecamatan)
  const availableDpcOptions = useMemo(() => {
    if (!activeRegion) return { dpdLevelCount: 0, subdistricts: [] };
    const effectiveDpd = activeRegion.name;

    const dpdLevelCount = members.filter(
      (m) =>
        isDpdMatch(m.dpd, effectiveDpd) &&
        (isDpcMatch(m.dpc, 'Wilayah DPD') ||
          isDpcMatch(m.dpc, 'Umum (DPD)') ||
          m.tingkatKepengurusan === 'DPD')
    ).length;

    const subdistrictMap = new Map<string, { name: string; count: number; villages: string[] }>();
    activeRegion.subdistricts.forEach((sub) => {
      subdistrictMap.set(sub.name.toLowerCase().trim(), {
        name: sub.name,
        count: 0,
        villages: [...sub.villages],
      });
    });

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

    return { dpdLevelCount, subdistricts };
  }, [activeRegion, members]);

  // Daftar DPRt (Desa/Kelurahan)
  const availableDprtOptions = useMemo(() => {
    if (!activeRegion || selectedDpcFilter === 'ALL' || selectedDpcFilter === 'Wilayah DPD') {
      return [];
    }
    const effectiveDpd = activeRegion.name;
    const subdistrict = activeRegion.subdistricts.find((s) => isDpcMatch(s.name, selectedDpcFilter));

    const villageMap = new Map<string, string>();
    (subdistrict?.villages || []).forEach((v) => {
      villageMap.set(v.toLowerCase().trim(), v);
    });

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
          if (!Array.from(villageMap.keys()).some((k) => isDprtMatch(k, cleanVillage))) {
            villageMap.set(normKey, cleanVillage);
          }
        }
      }
    });

    return Array.from(villageMap.values())
      .map((villageName) => {
        const count = members.filter(
          (m) =>
            isDpdMatch(m.dpd, effectiveDpd) &&
            isDpcMatch(m.dpc, selectedDpcFilter) &&
            isDprtMatch(m.dprt, villageName)
        ).length;
        return { name: villageName, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeRegion, members, selectedDpcFilter]);

  // Hitung jumlah personil per jabatan riil
  const availableRolesWithCount = useMemo(() => {
    const scopedMembers = members.filter((member) => {
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
      if (membershipFilter === 'PENGURUS' && !member.isPengurus && !member.nomorSK) return false;
      if (membershipFilter === 'ANGGOTA' && (member.isPengurus || Boolean(member.nomorSK))) return false;
      return true;
    });

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

    const priority = ['Ketua', 'Sekretaris', 'Bendahara', 'Wakil Sekretaris', 'Wakil Bendahara'];
    const sortedDbRoles = Array.from(roleCounts.keys()).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

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

  useEffect(() => {
    if (selectedRole !== 'ALL' && !availableRoles.includes(selectedRole)) {
      setSelectedRole('ALL');
    }
  }, [availableRoles, selectedRole]);

  // Hitung jumlah pengurus vs anggota biasa dalam cakupan
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

  // Filter pipeline utama
  const filteredMembers = useMemo(() => {
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

      if (selectedStatus !== 'ALL' && member.status !== selectedStatus) {
        return false;
      }

      if (membershipFilter === 'PENGURUS' && !member.isPengurus && !member.nomorSK) {
        return false;
      }
      if (membershipFilter === 'ANGGOTA' && (member.isPengurus || Boolean(member.nomorSK))) {
        return false;
      }

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

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  return {
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
    membershipFilter,
    setMembershipFilter,
    selectedCouncilFilter,
    setSelectedCouncilFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    // Calculated values
    dpdOptionsWithCount,
    activeRegion,
    availableDpcOptions,
    availableDprtOptions,
    availableRolesWithCount,
    availableRoles,
    countPengurusScope,
    countAnggotaScope,
    countPertimbanganScope,
    countPakarScope,
    countPimpinanScope,
    filteredMembers,
    paginatedMembers,
    totalPages,
  };
}
