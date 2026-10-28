import { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { getStructureTemplate } from '../data/structureTemplates';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  cleanJobTitle,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
  getDpdPimpinanCompliance,
  getExpandedStructuralMembers,
} from '../utils/structureReadinessUtils';
import {
  isJobTitleMatch,
  getCouncilRank,
  sortMembersByHierarchy,
  assignItemsToTemplateSlots,
} from '../utils/jobMatchingUtils';
import { generateUniqueTerritoryNik } from '../utils/territorialExcelTemplateUtils';
import { GridRowItem } from '../components/matrix';
import * as XLSX from 'xlsx';

interface UseTerritorialMatrixProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  selectedDpd: string;
  selectedDpc: string;
  selectedDprt: string;
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[]) => void;
  onDeleteMembersBatch?: (niksToDelete: string[], territoryLabel: string) => void;
}

export function useTerritorialMatrix({
  level,
  members,
  selectedDpd,
  selectedDpc,
  selectedDprt,
  session,
  onSaveMembersBatch,
  onDeleteMembersBatch,
}: UseTerritorialMatrixProps) {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'empty'>('all');
  const [gridRows, setGridRows] = useState<GridRowItem[]>([]);
  const [rawTerritoryMembers, setRawTerritoryMembers] = useState<Member[]>([]);
  const [deletedMemberNiks, setDeletedMemberNiks] = useState<string[]>([]);
  const [showVacantModal, setShowVacantModal] = useState<boolean>(false);

  // Kepatuhan formasi jabatan DPD Bagian A (Dewan Pimpinan Daerah) dihitung dinamis sesuai slot aktif
  const dpdPimpinanCompliance = useMemo(() => {
    if (level !== 'DPD') return null;
    const pimpinanRows = gridRows.filter(
      (r) => r.subOrg.includes('PIMPINAN') || r.subOrg.includes('DPD')
    );
    const totalRequired = pimpinanRows.length || 36;
    const filledPimpinan = pimpinanRows.filter(
      (r) => !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-'
    );
    const vacantPimpinan = pimpinanRows.filter(
      (r) => !r.namaLengkap || r.namaLengkap.trim() === '' || r.namaLengkap === '-'
    );

    const isKetuaFilled = filledPimpinan.some(
      (r) => r.jabatan.toLowerCase().includes('ketua') && !r.jabatan.toLowerCase().includes('wakil')
    );
    const isSekretarisFilled = filledPimpinan.some(
      (r) => r.jabatan.toLowerCase().includes('sekretaris') && !r.jabatan.toLowerCase().includes('wakil')
    );
    const isBendaharaFilled = filledPimpinan.some(
      (r) => r.jabatan.toLowerCase().includes('bendahara') && !r.jabatan.toLowerCase().includes('wakil')
    );

    return {
      dpdName: selectedDpd,
      totalRequired,
      filledCount: filledPimpinan.length,
      vacantCount: vacantPimpinan.length,
      percentage: totalRequired > 0 ? Math.round((filledPimpinan.length / totalRequired) * 100) : 0,
      isComplete: vacantPimpinan.length === 0 && filledPimpinan.length > 0,
      ksbStatus: {
        ketua: isKetuaFilled,
        sekretaris: isSekretarisFilled,
        bendahara: isBendaharaFilled,
      },
      slots: pimpinanRows.map((r) => ({
        no: r.no,
        subOrg: r.subOrg,
        jabatan: r.jabatan,
        isFilled: !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-',
        member: {
          nik: r.nik,
          namaLengkap: r.namaLengkap,
          jabatan: r.jabatan,
          nomorEKTA: r.nomorEKTA,
          nomorHP: r.nomorHP,
          email: r.email,
        } as Member,
      })),
      filledSlots: filledPimpinan.map((r) => ({
        no: r.no,
        subOrg: r.subOrg,
        jabatan: r.jabatan,
        isFilled: true,
      })),
      vacantSlots: vacantPimpinan.map((r) => ({
        no: r.no,
        subOrg: r.subOrg,
        jabatan: r.jabatan,
        isFilled: false,
      })),
    };
  }, [level, gridRows, selectedDpd]);

  const cleanDpd = useMemo(
    () => (selectedDpd || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    [selectedDpd]
  );
  const cleanDpc = useMemo(
    () => (selectedDpc || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    [selectedDpc]
  );
  const cleanDprt = useMemo(
    () => (selectedDprt || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    [selectedDprt]
  );

  // Local storage key for custom deleted template slots per territory
  const territoryKey = useMemo(() => {
    return `nasdem_deleted_slots_${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;
  }, [level, cleanDpd, cleanDpc, cleanDprt]);

  // Local storage key for cached custom matrix rows (persists deletes, inserts, and cell edits across refresh)
  const matrixStorageKey = useMemo(() => {
    return `nasdem_custom_matrix_rows_${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;
  }, [level, cleanDpd, cleanDpc, cleanDprt]);

  // Load deleted slot keys for current territory
  const getStoredDeletedSlotKeys = (): Set<string> => {
    try {
      const saved = localStorage.getItem(territoryKey);
      if (saved) {
        return new Set<string>(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to read deleted slots from localStorage:', e);
    }
    return new Set<string>();
  };

  const saveDeletedSlotKeys = (keys: Set<string>) => {
    try {
      localStorage.setItem(territoryKey, JSON.stringify(Array.from(keys)));
    } catch (e) {
      console.warn('Failed to save deleted slots to localStorage:', e);
    }
  };

  const saveCustomMatrixRows = (rowsToSave: GridRowItem[]) => {
    try {
      localStorage.setItem(matrixStorageKey, JSON.stringify(rowsToSave));
    } catch (e) {
      console.warn('Failed to save custom matrix rows to localStorage:', e);
    }
  };

  // Helper to get unique slot key for template slots
  const getSlotKey = (subOrg: string, no: number, jabatan: string) => {
    return `${subOrg.trim().toLowerCase()}__${no}__${jabatan.trim().toLowerCase()}`;
  };

  // Build matrix whenever territory changes or members change
  const buildMatrixRows = (currentDeletedKeys?: Set<string>, forceReset: boolean = false) => {
    const deletedKeys = currentDeletedKeys || getStoredDeletedSlotKeys();

    // 1. Cek apakah ada susunan matriks tersimpan di localStorage untuk wilayah ini (agar hasil hapus/sisip tidak hilang saat refresh)
    if (!forceReset) {
      try {
        const savedJson = localStorage.getItem(matrixStorageKey);
        if (savedJson) {
          const cachedRows: GridRowItem[] = JSON.parse(savedJson);

          // Cache basi: seluruh baris kosong, padahal wilayah ini sudah punya pengurus riil (mis. baru diimpor)
          const cacheHasFilledRow =
            Array.isArray(cachedRows) &&
            cachedRows.some((r) => !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-');
          const liveTerritoryMembers = getExpandedStructuralMembers(members).filter((m) => {
            if (m.tingkatKepengurusan !== level) return false;
            if (level === 'DPW') return true;
            if (!isDpdMatch(m.dpd, selectedDpd)) return false;
            if (level === 'DPD') return true;
            if (!isDpcMatch(m.dpc, selectedDpc)) return false;
            if (level === 'DPC') return true;
            return isDprtMatch(m.dprt, selectedDprt);
          });
          const isStaleEmptyCache = !cacheHasFilledRow && liveTerritoryMembers.length > 0;
          if (isStaleEmptyCache) {
            localStorage.removeItem(matrixStorageKey);
          }

          if (!isStaleEmptyCache && Array.isArray(cachedRows) && cachedRows.length > 0) {
            // Sinkronkan data profil personil terbaru dari database
            const sourceMembers = getExpandedStructuralMembers(members);
            const memberMapByNik = new Map<string, Member>();
            sourceMembers.forEach((m) => {
              if (m.nik) memberMapByNik.set(m.nik, m);
            });

            const refreshedRows = cachedRows.map((r) => {
              if (r.nik && memberMapByNik.has(r.nik)) {
                const liveMember = memberMapByNik.get(r.nik)!;
                return {
                  ...r,
                  namaLengkap: liveMember.namaLengkap || r.namaLengkap,
                  nomorEKTA: liveMember.nomorEKTA || r.nomorEKTA,
                  email: liveMember.email || r.email,
                  nomorHP: liveMember.nomorHP || r.nomorHP,
                  sosmed: liveMember.sosmed || r.sosmed,
                  isExisting: true,
                };
              }
              return r;
            });

            const counters = new Map<string, number>();
            const normalized = refreshedRows.map((r) => {
              const currentCount = (counters.get(r.subOrg) || 0) + 1;
              counters.set(r.subOrg, currentCount);
              return { ...r, no: currentCount };
            });

            setGridRows(normalized);
            return;
          }
        }
      } catch (e) {
        console.warn('Gagal membaca cache matriks:', e);
      }
    }

    const template = getStructureTemplate(level);
    const sourceMembers = getExpandedStructuralMembers(members);

    // Filter existing members in this territory and level with robust hierarchical detection
    let matchedMembers: Member[] = [];
    if (level === 'DPW') {
      matchedMembers = sourceMembers.filter(
        (m) =>
          m.tingkatKepengurusan === 'DPW' ||
          m.dpd === 'Sulawesi Utara' ||
          m.dpd?.toLowerCase().includes('dpw') ||
          m.wilayahPenugasan === 'DPW' ||
          m.wilayahPenugasan?.includes('DPW') ||
          m.jabatan?.toLowerCase().includes('dpw') ||
          m.jabatan?.toLowerCase().includes('wilayah') ||
          (m.isPengurus && (!m.dpd || m.dpd === 'Sulawesi Utara'))
      );
    } else if (level === 'DPD') {
      matchedMembers = sourceMembers.filter((m) => {
        if (!isDpdMatch(m.dpd, selectedDpd)) return false;
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOtherLevel =
          m.tingkatKepengurusan !== 'DPC' &&
          m.tingkatKepengurusan !== 'DPRt' &&
          m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPD' ||
          jLower.includes('dpd') ||
          jLower.includes('daerah') ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          !m.dpc ||
          m.dpc === '-' ||
          (m.isPengurus && isNotOtherLevel) ||
          (m.jabatan &&
            m.jabatan !== 'Anggota Biasa' &&
            isNotOtherLevel &&
            !jLower.includes('dpc') &&
            !jLower.includes('ranting'))
        );
      });
    } else if (level === 'DPC') {
      matchedMembers = sourceMembers.filter((m) => {
        if (!isDpdMatch(m.dpd, selectedDpd) || !isDpcMatch(m.dpc, selectedDpc)) return false;
        if (
          m.tingkatKepengurusan === 'DPD' ||
          m.tingkatKepengurusan === 'DPW' ||
          m.tingkatKepengurusan === 'DPRt'
        ) {
          return false;
        }
        const jLower = (m.jabatan || '').toLowerCase();
        if (
          jLower.includes('dpd') ||
          jLower.includes('dpw') ||
          jLower.includes('daerah') ||
          jLower.includes('wilayah') ||
          jLower.includes('dprt') ||
          jLower.includes('ranting')
        ) {
          return false;
        }
        return (
          m.tingkatKepengurusan === 'DPC' ||
          jLower.includes('dpc') ||
          jLower.includes('cabang') ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD') ||
          (m.jabatan &&
            m.jabatan !== 'Anggota Biasa' &&
            m.dpc !== 'Umum (DPD)' &&
            m.dpc !== 'Wilayah DPD')
        );
      });
    } else if (level === 'DPRt') {
      matchedMembers = sourceMembers.filter((m) => {
        if (
          !isDpdMatch(m.dpd, selectedDpd) ||
          !isDpcMatch(m.dpc, selectedDpc) ||
          !isDprtMatch(m.dprt, selectedDprt)
        )
          return false;
        if (
          m.tingkatKepengurusan === 'DPD' ||
          m.tingkatKepengurusan === 'DPC' ||
          m.tingkatKepengurusan === 'DPW'
        ) {
          return false;
        }
        const jLower = (m.jabatan || '').toLowerCase();
        if (
          jLower.includes('dpd') ||
          jLower.includes('dpc') ||
          jLower.includes('dpw') ||
          jLower.includes('daerah') ||
          jLower.includes('cabang') ||
          jLower.includes('wilayah')
        ) {
          return false;
        }
        return (
          m.tingkatKepengurusan === 'DPRt' ||
          jLower.includes('dprt') ||
          jLower.includes('ranting') ||
          (m.isPengurus && m.dprt && m.dprt !== 'Pusat/Umum' && m.dprt !== '-') ||
          (m.jabatan &&
            m.jabatan !== 'Anggota Biasa' &&
            m.dprt &&
            m.dprt !== 'Pusat/Umum' &&
            m.dprt !== '-')
        );
      });
    }

    // Urutan hierarkis: Ketua selalu nomor 1, disusul urutan berkas Excel / hirarki resmi
    matchedMembers = sortMembersByHierarchy(matchedMembers);
    setRawTerritoryMembers(matchedMembers);

    // KHUSUS DPRt: DIRECT PASSTHROUGH (Salin langsung 1-to-1 seluruh pengurus riil ke matriks)
    // Setiap desa/kelurahan memiliki struktur unik & dinamis (bisa 7, 9, 11, atau 15 pengurus).
    // Pertahankan persis nama jabatan asli dan urutan dari berkas Excel/database tanpa memaksakan slot template!
    if (level === 'DPRt' && matchedMembers.length > 0) {
      const dprtSubOrgName = 'DEWAN PIMPINAN RANTING';
      const dprtRows: GridRowItem[] = [];
      matchedMembers.forEach((m, idx) => {
        dprtRows.push({
          id: m.nik || `dprt_${idx + 1}`,
          no: idx + 1,
          subOrg: dprtSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
      setGridRows(dprtRows);
      return;
    }

    const assignedMemberNiks = new Set<string>();

    // Saring template yang tidak dihapus secara eksplisit oleh pengguna
    const activeTemplate = template.filter((slot) => {
      const slotEmptyId = `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}`;
      const cleanSlotJob = cleanJobTitle(slot.jabatan);
      const cat = getSlotSubOrgCategory(slot);

      if (deletedKeys.has(slotEmptyId)) return false;
      if (deletedKeys.has(`job_${cat}_${cleanSlotJob}`)) return false;
      if (deletedKeys.has(`job_${cleanSlotJob}`)) return false;
      if (deletedKeys.has(`slot_${cat}_${slot.no}`)) return false;

      const key1 = getSlotKey(slot.subOrg, slot.no, slot.jabatan);
      const key2 = `${slot.subOrg.trim().toLowerCase()}__slot_${slot.no}`;
      const key3 = `${slot.subOrg.trim().toLowerCase()}__jabatan_${slot.jabatan.trim().toLowerCase()}`;
      return !deletedKeys.has(key1) && !deletedKeys.has(key2) && !deletedKeys.has(key3);
    });

    const pertimbanganMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN'
    );
    const pakarMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PAKAR'
    );
    const pimpinanMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PIMPINAN'
    );

    const pertimbanganTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN'
    );
    const pakarTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PAKAR'
    );
    const pimpinanTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PIMPINAN'
    );

    const pertimbanganSubOrgName =
      pertimbanganTemplateSlots[0]?.subOrg ||
      (level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN');

    const pakarSubOrgName =
      pakarTemplateSlots[0]?.subOrg ||
      (level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR');

    const pimpinanSubOrgName =
      pimpinanTemplateSlots[0]?.subOrg ||
      (level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : 'DEWAN PIMPINAN RANTING');

    const rows: GridRowItem[] = [];

    // 1. DEWAN PERTIMBANGAN
    if (pertimbanganTemplateSlots.length > 0) {
      const { slotAssignments, unassignedItems } = assignItemsToTemplateSlots(
        pertimbanganTemplateSlots,
        pertimbanganMembers,
        (m) => m.jabatan || '',
        (m) => m.urutan
      );

      pertimbanganTemplateSlots.forEach((slot) => {
        if (slotAssignments.has(slot.no)) {
          const { item: matched } = slotAssignments.get(slot.no)!;
          assignedMemberNiks.add(matched.nik);
          rows.push({
            id: matched.nik,
            no: slot.no,
            subOrg: pertimbanganSubOrgName,
            jabatan: matched.jabatan || slot.jabatan,
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            isExisting: true,
            originalNik: matched.nik,
          });
        } else {
          rows.push({
            id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}`,
            no: slot.no,
            subOrg: pertimbanganSubOrgName,
            jabatan: slot.jabatan,
            namaLengkap: '',
            nik: '',
            nomorEKTA: '',
            email: '',
            nomorHP: '',
            sosmed: '',
            isExisting: false,
          });
        }
      });

      let extraPertimbanganNo = pertimbanganTemplateSlots.length + 1;
      unassignedItems.forEach(({ item: m }) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: extraPertimbanganNo++,
          subOrg: pertimbanganSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pertimbanganMembers.length > 0) {
      const sortedPertimbangan = [...pertimbanganMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPertimbangan.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pertimbanganSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    }

    // 2. DEWAN PAKAR
    if (pakarTemplateSlots.length > 0) {
      const { slotAssignments, unassignedItems } = assignItemsToTemplateSlots(
        pakarTemplateSlots,
        pakarMembers,
        (m) => m.jabatan || '',
        (m) => m.urutan
      );

      pakarTemplateSlots.forEach((slot) => {
        if (slotAssignments.has(slot.no)) {
          const { item: matched } = slotAssignments.get(slot.no)!;
          assignedMemberNiks.add(matched.nik);
          rows.push({
            id: matched.nik,
            no: slot.no,
            subOrg: pakarSubOrgName,
            jabatan: matched.jabatan || slot.jabatan,
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            isExisting: true,
            originalNik: matched.nik,
          });
        } else {
          rows.push({
            id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}`,
            no: slot.no,
            subOrg: pakarSubOrgName,
            jabatan: slot.jabatan,
            namaLengkap: '',
            nik: '',
            nomorEKTA: '',
            email: '',
            nomorHP: '',
            sosmed: '',
            isExisting: false,
          });
        }
      });

      let extraPakarNo = pakarTemplateSlots.length + 1;
      unassignedItems.forEach(({ item: m }) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: extraPakarNo++,
          subOrg: pakarSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pakarMembers.length > 0) {
      const sortedPakar = [...pakarMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPakar.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pakarSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    }

    // 3. DEWAN PIMPINAN
    if (pimpinanTemplateSlots.length > 0) {
      // Gunakan algoritma 3-Pass Best-Match Assignment untuk pimpinan
      const { slotAssignments, unassignedItems } = assignItemsToTemplateSlots(
        pimpinanTemplateSlots,
        pimpinanMembers,
        (m) => m.jabatan || '',
        (m) => m.urutan
      );

      pimpinanTemplateSlots.forEach((slot) => {
        if (slotAssignments.has(slot.no)) {
          const { item: matched } = slotAssignments.get(slot.no)!;
          assignedMemberNiks.add(matched.nik);
          rows.push({
            id: matched.nik,
            no: slot.no,
            subOrg: pimpinanSubOrgName,
            jabatan: matched.jabatan || slot.jabatan, // Nama jabatan sesuai berkas SK Excel
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            isExisting: true,
            originalNik: matched.nik,
          });
        } else {
          rows.push({
            id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}`,
            no: slot.no,
            subOrg: pimpinanSubOrgName,
            jabatan: slot.jabatan,
            namaLengkap: '',
            nik: '',
            nomorEKTA: '',
            email: '',
            nomorHP: '',
            sosmed: '',
            isExisting: false,
          });
        }
      });

      let extraPimpinanNo = pimpinanTemplateSlots.length + 1;
      unassignedItems.forEach(({ item: m }) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: extraPimpinanNo++,
          subOrg: pimpinanSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pimpinanMembers.length > 0) {
      pimpinanMembers.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pimpinanSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    }

    // 4. ANGGOTA EKSTRA/TAMBAHAN (ANTI DATA-LOSS)
    matchedMembers.forEach((m) => {
      if (!assignedMemberNiks.has(m.nik)) {
        assignedMemberNiks.add(m.nik);
        const cat = getMemberSubOrgCategory(m);
        const targetSubOrg =
          cat === 'PERTIMBANGAN'
            ? pertimbanganSubOrgName
            : cat === 'PAKAR'
            ? pakarSubOrgName
            : pimpinanSubOrgName;

        rows.push({
          id: m.nik,
          no: rows.filter((r) => r.subOrg === targetSubOrg).length + 1,
          subOrg: targetSubOrg,
          jabatan: m.jabatan,
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      }
    });

    // Normalisasi nomor urut berurutan per sub-organisasi agar rapi tanpa jeda angka
    const subOrgCounters = new Map<string, number>();
    const normalizedRows = rows.map((r) => {
      const currentCount = (subOrgCounters.get(r.subOrg) || 0) + 1;
      subOrgCounters.set(r.subOrg, currentCount);
      return {
        ...r,
        no: currentCount,
      };
    });

    setGridRows(normalizedRows);
    saveCustomMatrixRows(normalizedRows);
  };

  useEffect(() => {
    buildMatrixRows();
    setIsEditMode(false);
    setSaveSuccessMsg(null);
    setDeletedMemberNiks([]);
  }, [level, selectedDpd, selectedDpc, selectedDprt, members]);

  const handleCellChange = (id: string, field: keyof GridRowItem, value: string) => {
    setGridRows((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, [field]: value } : row));
      saveCustomMatrixRows(updated);
      return updated;
    });
  };

  const handleAddNewRow = (targetSubOrg?: string) => {
    const defaultSubOrg =
      targetSubOrg ||
      (level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : 'DEWAN PIMPINAN RANTING');

    const newId = `new_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: GridRowItem = {
      id: newId,
      no: gridRows.filter((r) => r.subOrg === defaultSubOrg).length + 1,
      subOrg: defaultSubOrg,
      jabatan: defaultSubOrg.includes('PERTIMBANGAN')
        ? 'Anggota Dewan Pertimbangan'
        : defaultSubOrg.includes('PAKAR')
        ? 'Anggota Dewan Pakar'
        : level === 'DPRt'
        ? 'Pengurus Ranting'
        : 'Wakil Ketua Bidang ...',
      namaLengkap: '',
      nik: '',
      nomorEKTA: '',
      email: '',
      nomorHP: '',
      sosmed: '',
      isExisting: false,
    };
    setGridRows((prev) => {
      const updated = [...prev, newRow];
      const counters = new Map<string, number>();
      const normalized = updated.map((r) => {
        const currentCount = (counters.get(r.subOrg) || 0) + 1;
        counters.set(r.subOrg, currentCount);
        return { ...r, no: currentCount };
      });
      saveCustomMatrixRows(normalized);
      return normalized;
    });
    setIsEditMode(true);
  };

  const handleInsertRow = (targetId: string, position: 'above' | 'below' = 'below') => {
    const targetIndex = gridRows.findIndex((r) => r.id === targetId);
    if (targetIndex === -1) return;

    const targetRow = gridRows[targetIndex];
    const insertIndex = position === 'below' ? targetIndex + 1 : targetIndex;

    const newId = `custom_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    let defaultJabatan = 'Wakil Ketua Bidang ...';
    if (targetRow.subOrg.includes('PERTIMBANGAN')) {
      defaultJabatan = 'Anggota Dewan Pertimbangan';
    } else if (targetRow.subOrg.includes('PAKAR')) {
      defaultJabatan = 'Anggota Dewan Pakar';
    } else if (level === 'DPRt') {
      defaultJabatan = 'Pengurus Ranting';
    } else if (targetRow.jabatan.toLowerCase().includes('sekretaris')) {
      defaultJabatan = 'Wakil Sekretaris Bidang ...';
    } else if (targetRow.jabatan.toLowerCase().includes('bendahara')) {
      defaultJabatan = 'Wakil Bendahara ...';
    } else if (targetRow.jabatan.toLowerCase().includes('wakil ketua')) {
      defaultJabatan = 'Wakil Ketua Bidang ...';
    }

    const newRow: GridRowItem = {
      id: newId,
      no: targetRow.no + (position === 'below' ? 1 : 0),
      subOrg: targetRow.subOrg,
      jabatan: defaultJabatan,
      namaLengkap: '',
      nik: '',
      nomorEKTA: '',
      email: '',
      nomorHP: '',
      sosmed: '',
      isExisting: false,
    };

    setGridRows((prev) => {
      const updated = [...prev];
      updated.splice(insertIndex, 0, newRow);

      const counters = new Map<string, number>();
      const normalized = updated.map((r) => {
        const currentCount = (counters.get(r.subOrg) || 0) + 1;
        counters.set(r.subOrg, currentCount);
        return {
          ...r,
          no: currentCount,
        };
      });
      saveCustomMatrixRows(normalized);
      return normalized;
    });

    setIsEditMode(true);
  };

  const handleDeleteRow = (id: string) => {
    const targetRow = gridRows.find((r) => r.id === id);
    if (!targetRow) return;

    const cat =
      getMemberSubOrgCategory({ jabatan: targetRow.jabatan } as Member) ||
      (targetRow.subOrg.includes('PERTIMBANGAN')
        ? 'PERTIMBANGAN'
        : targetRow.subOrg.includes('PAKAR')
        ? 'PAKAR'
        : 'PIMPINAN');
    const cleanJob = cleanJobTitle(targetRow.jabatan);
    const deletedKeys = getStoredDeletedSlotKeys();

    deletedKeys.add(targetRow.id);
    deletedKeys.add(`empty_${targetRow.subOrg.replace(/[^a-z0-9]/gi, '_')}_${targetRow.no}`);
    deletedKeys.add(`job_${cat}_${cleanJob}`);
    deletedKeys.add(`job_${cleanJob}`);
    deletedKeys.add(`slot_${cat}_${targetRow.no}`);
    deletedKeys.add(getSlotKey(targetRow.subOrg, targetRow.no, targetRow.jabatan));
    deletedKeys.add(`${targetRow.subOrg.trim().toLowerCase()}__slot_${targetRow.no}`);
    deletedKeys.add(`${targetRow.subOrg.trim().toLowerCase()}__jabatan_${targetRow.jabatan.trim().toLowerCase()}`);
    saveDeletedSlotKeys(deletedKeys);

    if (targetRow.nik && !targetRow.id.startsWith('empty_') && !targetRow.id.startsWith('custom_row_')) {
      setDeletedMemberNiks((prev) => [...prev, targetRow.nik]);
    }

    setGridRows((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      const counters = new Map<string, number>();
      const normalized = remaining.map((r) => {
        const currentCount = (counters.get(r.subOrg) || 0) + 1;
        counters.set(r.subOrg, currentCount);
        return {
          ...r,
          no: currentCount,
        };
      });
      saveCustomMatrixRows(normalized);
      return normalized;
    });
  };

  const handleDeleteSelectedRows = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    const idSet = new Set(selectedIds);
    const niksToDelete: string[] = [];

    gridRows.forEach((r) => {
      if (idSet.has(r.id)) {
        const nikTarget = r.originalNik || (r.nik && !r.id.startsWith('empty_') ? r.nik : '');
        if (nikTarget) {
          niksToDelete.push(nikTarget);
        }
      }
    });

    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      const territoryLabel = level === 'DPW' ? 'DPW Sulawesi Utara' : `${level} ${selectedDpd}`;
      onDeleteMembersBatch(niksToDelete, territoryLabel);
    }

    setGridRows((prev) => {
      const updated = prev.map((row) => {
        if (!idSet.has(row.id)) return row;
        return {
          ...row,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          isExisting: false,
          originalNik: undefined,
        };
      });
      saveCustomMatrixRows(updated);
      return updated;
    });

    setSaveSuccessMsg(`Berhasil hard delete ${niksToDelete.length} data pengurus dari database!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleResetTemplate = () => {
    if (
      window.confirm(
        `Pulihkan seluruh susunan jabatan template standar untuk wilayah ${level} ${selectedDpd}?`
      )
    ) {
      try {
        localStorage.removeItem(territoryKey);
        localStorage.removeItem(matrixStorageKey);
      } catch (e) {
        console.warn(e);
      }
      buildMatrixRows(new Set<string>(), true);
      setSaveSuccessMsg('Template standar berhasil dipulihkan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleSaveToDatabase = () => {
    const territoryDpd = level === 'DPW' ? 'Sulawesi Utara' : selectedDpd;
    const territoryDpc =
      level === 'DPW'
        ? 'Wilayah DPW'
        : level === 'DPD'
        ? 'Umum (DPD)'
        : selectedDpc;
    const territoryDprt = level === 'DPRt' ? selectedDprt : 'Pusat/Umum';

    const updatedMembersList: Member[] = [];
    const occupiedNiks = new Set<string>(members.map((m) => m.nik));
    const niksToDelete: string[] = [];

    // 1. Anggota yang dikosongkan namanya di slot dialihkan jadi kader biasa
    gridRows.forEach((row) => {
      if (row.originalNik && !row.namaLengkap.trim()) {
        const prevMember = members.find((m) => m.nik === row.originalNik);
        if (prevMember) {
          updatedMembersList.push({
            ...prevMember,
            isPengurus: false,
            jabatan: 'Anggota / Kader',
            wilayahPenugasan: undefined,
            tingkatKepengurusan: undefined,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: session?.adminName || 'Admin Matriks Organisasi',
          });
        }
      }
    });

    // 2. Simpan setiap baris yang terisi nama
    gridRows.forEach((row, idx) => {
      const nama = row.namaLengkap.trim();
      if (!nama) return;

      const existingMember = members.find(
        (m) =>
          (row.originalNik && m.nik === row.originalNik) ||
          (row.nik && m.nik === row.nik.trim())
      );

      let nikClean = row.nik.replace(/[^0-9]/g, '').trim();
      if (!nikClean || nikClean.length < 10) {
        if (existingMember && existingMember.nik) {
          nikClean = existingMember.nik;
        } else {
          nikClean = generateUniqueTerritoryNik(territoryDpd, row.subOrg, idx + 1, occupiedNiks);
        }
      } else {
        occupiedNiks.add(nikClean);
      }

      if (row.originalNik && row.originalNik !== nikClean) {
        niksToDelete.push(row.originalNik);
      }

      const cleanT = (level || 'DPD').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const cleanD = (territoryDpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const cleanS = (row.subOrg || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const memberId =
        row.id && !row.id.startsWith('empty_')
          ? row.id
          : `${nikClean}_${cleanT}_${cleanD}_${cleanS}`;

      const updatedMember: Member = {
        ...(existingMember || {}),
        id: memberId,
        nik: nikClean,
        nomorEKTA: row.nomorEKTA.trim() || existingMember?.nomorEKTA || nikClean,
        namaLengkap: nama,
        email: row.email?.trim() || existingMember?.email || undefined,
        nomorHP: row.nomorHP.trim() || existingMember?.nomorHP || '-',
        sosmed: row.sosmed?.trim() || existingMember?.sosmed || undefined,
        dpd: territoryDpd,
        dpc: territoryDpc,
        dprt: territoryDprt,
        isPengurus: true,
        tingkatKepengurusan: level,
        wilayahPenugasan: row.subOrg,
        nomorSK:
          existingMember?.nomorSK ||
          `SK-${level}-${territoryDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
        jabatan: row.jabatan.trim() || 'Pengurus',
        status: existingMember?.status || 'Aktif',
        statusKtpVerified: existingMember ? existingMember.statusKtpVerified : true,
        tanggalBergabung:
          existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session?.adminName || 'Admin Matriks Organisasi',
      };

      updatedMembersList.push(updatedMember);
    });

    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      onDeleteMembersBatch(niksToDelete, `${level} ${territoryDpd}`);
    }

    onSaveMembersBatch(updatedMembersList);
    saveCustomMatrixRows(gridRows);
    setSaveSuccessMsg(
      `Berhasil menyimpan perubahan ${updatedMembersList.length} data pengurus ke database!`
    );
    setIsEditMode(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleExportTemplateExcel = () => {
    const territoryName =
      level === 'DPW'
        ? 'DPW_SULUT'
        : level === 'DPD'
        ? selectedDpd.replace(/\s+/g, '_')
        : level === 'DPC'
        ? `${selectedDpd}_${selectedDpc}`.replace(/\s+/g, '_')
        : `${selectedDpd}_${selectedDpc}_${selectedDprt}`.replace(/\s+/g, '_');

    const exportData = gridRows.map((r, i) => ({
      No: i + 1,
      'Sub Organisasi': r.subOrg,
      'Jabatan Pengurus': r.jabatan,
      'Nama Lengkap (Sesuai KTP)': r.namaLengkap,
      'No. NIK': r.nik,
      'E-KTA NasDem': r.nomorEKTA,
      Email: r.email,
      'No Telepon': r.nomorHP,
      'Sosial Media': r.sosmed,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Susunan Pengurus');
    XLSX.writeFile(wb, `SUSUNAN_PENGURUS_${level}_${territoryName}.xlsx`);
  };

  const totalRows = gridRows.length;
  const filledCount = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const emptyCount = totalRows - filledCount;
  const completionPercentage = totalRows > 0 ? Math.round((filledCount / totalRows) * 100) : 0;

  const displayRows = useMemo(() => {
    return gridRows.filter((r) => {
      const isFilled = r.namaLengkap.trim() !== '';
      if (statusFilter === 'filled' && !isFilled) return false;
      if (statusFilter === 'empty' && isFilled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.jabatan.toLowerCase().includes(q) ||
          r.namaLengkap.toLowerCase().includes(q) ||
          r.nik.toLowerCase().includes(q) ||
          r.nomorEKTA.toLowerCase().includes(q) ||
          r.subOrg.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [gridRows, statusFilter, searchQuery]);

  const getOfficialTitle = () => {
    if (level === 'DPW') {
      return {
        line1: 'SUSUNAN PENGURUS DPW PARTAI NASDEM',
        line2: 'PROVINSI SULAWESI UTARA',
      };
    }
    if (level === 'DPD') {
      return {
        line1: 'SUSUNAN PENGURUS DPD PARTAI NASDEM',
        line2: `${selectedDpd.toUpperCase()} PROVINSI SULAWESI UTARA`,
      };
    }
    if (level === 'DPC') {
      return {
        line1: 'SUSUNAN PENGURUS DPC PARTAI NASDEM',
        line2: `KECAMATAN ${selectedDpc.toUpperCase()} - ${selectedDpd.toUpperCase()}`,
      };
    }
    return {
      line1: 'SUSUNAN PENGURUS DPRt PARTAI NASDEM',
      line2: `DESA/KELURAHAN ${selectedDprt.toUpperCase()} - KEC. ${selectedDpc.toUpperCase()}`,
    };
  };

  return {
    isEditMode,
    setIsEditMode,
    saveSuccessMsg,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    gridRows,
    setGridRows,
    rawTerritoryMembers,
    showVacantModal,
    setShowVacantModal,
    dpdPimpinanCompliance,
    totalRows,
    filledCount,
    emptyCount,
    completionPercentage,
    displayRows,
    getOfficialTitle,
    buildMatrixRows,
    handleCellChange,
    handleAddNewRow,
    handleInsertRow,
    handleDeleteRow,
    handleDeleteSelectedRows,
    handleResetTemplate,
    handleSaveToDatabase,
    handleExportTemplateExcel,
  };
}
