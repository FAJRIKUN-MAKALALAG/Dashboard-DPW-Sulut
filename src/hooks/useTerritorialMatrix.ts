import { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { useDebounce } from './useDebounce';
import { useDialog } from '../components/ui/AppDialogProvider';
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
  isDefinitiveLeader,
  cleanPersonName,
} from '../utils/jobMatchingUtils';
import { generateUniqueTerritoryNik } from '../utils/territorialExcelTemplateUtils';
import { isAcceptableImportNik, isGeneratedNik } from '../utils/generatedIds';
import { GridRowItem } from '../components/matrix';
import * as XLSX from 'xlsx';

interface UseTerritorialMatrixProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  selectedDpd: string;
  selectedDpc: string;
  selectedDprt: string;
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[], obsoleteNiks?: string[]) => void;
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
  const { showConfirm } = useDialog();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
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
          fotoProfilUrl: r.fotoProfilUrl,
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
    const versionPrefix = level === 'DPRt' ? 'v2_' : '';
    return `nasdem_deleted_slots_${versionPrefix}${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;
  }, [level, cleanDpd, cleanDpc, cleanDprt]);

  // Local storage key for cached custom matrix rows (persists deletes, inserts, and cell edits across refresh)
  const matrixStorageKey = useMemo(() => {
    const versionPrefix = level === 'DPRt' ? 'v2_' : '';
    return `nasdem_custom_matrix_rows_${versionPrefix}${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;
  }, [level, cleanDpd, cleanDpc, cleanDprt]);

  // Load deleted slot keys for current territory
  const getStoredDeletedSlotKeys = (): Set<string> => {
    try {
      const saved = localStorage.getItem(territoryKey);
      if (saved) {
        const rawArray = JSON.parse(saved);
        if (Array.isArray(rawArray)) {
          // Buang key peninggalan bug lama yang terlalu agresif (job_*, slot_*)
          const cleanArray = rawArray.filter(
            (k: string) => !k.startsWith('job_') && !k.startsWith('slot_')
          );
          return new Set<string>(cleanArray);
        }
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

          const liveTerritoryMembers = getExpandedStructuralMembers(members).filter((m) => {
            if (m.tingkatKepengurusan !== level) return false;
            if (level === 'DPW') return true;
            if (!isDpdMatch(m.dpd, selectedDpd)) return false;
            if (level === 'DPD') return true;
            if (!isDpcMatch(m.dpc, selectedDpc)) return false;
            if (level === 'DPC') return true;
            return isDprtMatch(m.dprt, selectedDprt);
          });

          // Deteksi integritas cache matriks lokal:
          // 1. Cek apakah ada Ketua definitif yang tergeser dari posisi nomor 1
          // 2. Cek apakah ada anggota/nama/NIK yang terduplikasi di dalam cache
          // 3. Cek apakah baris formasi pimpinan terpotong cacat akibat bug sebelumnya
          const pimpinanInCache = Array.isArray(cachedRows)
            ? cachedRows.filter((r) => {
                const s = (r.subOrg || '').toLowerCase();
                return (
                  s.includes('pimpinan') ||
                  s.includes('daerah') ||
                  s.includes('cabang') ||
                  s.includes('ranting') ||
                  s.includes('wilayah')
                );
              })
            : [];
          const expectedMinPimpinan =
            level === 'DPW' ? 36 : level === 'DPD' ? 36 : level === 'DPC' ? 17 : 11;

          let hasMisplacedLeader = false;
          let hasDuplicatePerson = false;
          const seenNamesInCache = new Set<string>();
          const seenNiksInCache = new Set<string>();

          const subOrgMapForCheck = new Map<string, GridRowItem[]>();
          (Array.isArray(cachedRows) ? cachedRows : []).forEach((r) => {
            const s = r.subOrg || '';
            if (!subOrgMapForCheck.has(s)) subOrgMapForCheck.set(s, []);
            subOrgMapForCheck.get(s)!.push(r);
          });

          for (const [, sRows] of subOrgMapForCheck.entries()) {
            const leaderIdx = sRows.findIndex((r) => isDefinitiveLeader(r.jabatan));
            if (leaderIdx > 0) {
              // Jika ada Ketua tapi tidak di urutan pertama seksi ini, cache cacat
              hasMisplacedLeader = true;
            }
            for (const r of sRows) {
              const nameClean = (r.namaLengkap || '').toLowerCase().trim();
              const nikClean = (r.nik || '').replace(/[^0-9]/g, '');
              const jabClean = (r.jabatan || '').toLowerCase().trim();
              const personPositionKey = `${nikClean || nameClean}|${jabClean}`;
              if (nameClean && nameClean !== '-' && nameClean !== 'belum terisi') {
                if (seenNamesInCache.has(personPositionKey)) hasDuplicatePerson = true;
                seenNamesInCache.add(personPositionKey);
              }
              if (nikClean && !isGeneratedNik(nikClean)) {
                if (seenNiksInCache.has(personPositionKey)) hasDuplicatePerson = true;
                seenNiksInCache.add(personPositionKey);
              }
            }
          }

          const isDeformedCache =
            Array.isArray(cachedRows) &&
            cachedRows.length > 0 &&
            ((liveTerritoryMembers.length >= 20 && pimpinanInCache.length < expectedMinPimpinan) ||
              hasMisplacedLeader ||
              hasDuplicatePerson);

          // Cache basi jika:
          // 1) seluruh baris di cache kosong padahal wilayah ini punya pengurus riil, ATAU
          // 2) cache rusak/cacat (misal formasi pimpinan terpotong atau ketua tergeser/duplikat), ATAU
          // 3) ada pengurus baru di database/impor yang NIK-nya belum tercatat dan bukan sengaja dihapus
          const cacheHasFilledRow =
            Array.isArray(cachedRows) &&
            cachedRows.some((r) => !!r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== '-');
          const cachedNiks = new Set(
            (Array.isArray(cachedRows) ? cachedRows : [])
              .map((r) => (r.nik || '').trim())
              .filter(Boolean)
          );
          const cachedOriginalNiks = new Set(
            (Array.isArray(cachedRows) ? cachedRows : [])
              .map((r) => (r.originalNik || '').trim())
              .filter(Boolean)
          );
          const hasUnmappedLiveMember = liveTerritoryMembers.some(
            (m) =>
              m.nik &&
              !cachedNiks.has(m.nik.trim()) &&
              !cachedOriginalNiks.has(m.nik.trim()) &&
              !deletedKeys.has(m.nik.trim()) &&
              !deletedMemberNiks.includes(m.nik.trim())
          );
          const isStaleCache =
            (!cacheHasFilledRow && liveTerritoryMembers.length > 0) ||
            hasUnmappedLiveMember ||
            isDeformedCache;

          if (isStaleCache) {
            localStorage.removeItem(matrixStorageKey);
            localStorage.removeItem(territoryKey);
          }

          if (!isStaleCache && Array.isArray(cachedRows) && cachedRows.length > 0) {
            // Sinkronkan data profil personil terbaru dari database secara cerdas (via NIK, ID, maupun Nama)
            const sourceMembers = getExpandedStructuralMembers(members);
            const memberMapByNik = new Map<string, Member>();
            const memberMapById = new Map<string, Member>();
            const memberMapByName = new Map<string, Member>();

            sourceMembers.forEach((m) => {
              if (m.nik) memberMapByNik.set(m.nik.trim(), m);
              if (m.id) memberMapById.set(m.id.trim(), m);
              if (m.namaLengkap) {
                const norm = cleanPersonName(m.namaLengkap).toLowerCase();
                if (norm) memberMapByName.set(norm, m);
              }
            });

            const refreshedRows = cachedRows.map((r) => {
              const rNameNorm = r.namaLengkap ? cleanPersonName(r.namaLengkap).toLowerCase() : '';
              const liveMember =
                (r.id && memberMapById.get(r.id.trim())) ||
                sourceMembers.find(
                  (m) =>
                    ((r.nik && m.nik === r.nik.trim()) ||
                      (r.originalNik && m.nik === r.originalNik.trim()) ||
                      (rNameNorm && cleanPersonName(m.namaLengkap).toLowerCase() === rNameNorm)) &&
                    isJobTitleMatch(m.jabatan, r.jabatan, r.subOrg)
                ) ||
                (r.nik && memberMapByNik.get(r.nik.trim())) ||
                (r.originalNik && memberMapByNik.get(r.originalNik.trim())) ||
                (rNameNorm && memberMapByName.get(rNameNorm));

              if (liveMember) {
                return {
                  ...r,
                  id: r.id && !r.id.startsWith('empty_') ? r.id : (liveMember.id || liveMember.nik),
                  nik: liveMember.nik || r.nik,
                  originalNik: liveMember.nik || r.originalNik || r.nik,
                  namaLengkap: liveMember.namaLengkap || r.namaLengkap,
                  nomorEKTA: liveMember.nomorEKTA || r.nomorEKTA,
                  email: liveMember.email || r.email,
                  nomorHP: liveMember.nomorHP || r.nomorHP,
                  sosmed: liveMember.sosmed || r.sosmed,
                  fotoProfilUrl: liveMember.fotoProfilUrl || r.fotoProfilUrl,
                  isExisting: true,
                };
              }
              return r;
            });

            // Urutkan per sub-organisasi: Ketua selalu nomor 1, disusul nomor urut formasi
            const subOrgMap = new Map<string, GridRowItem[]>();
            refreshedRows.forEach((r) => {
              const currentSubOrg = r.subOrg || '';
              if (!subOrgMap.has(currentSubOrg)) subOrgMap.set(currentSubOrg, []);
              subOrgMap.get(currentSubOrg)!.push(r);
            });

            const cleanOrderedRows: GridRowItem[] = [];
            for (const [, sRows] of subOrgMap.entries()) {
              const leaders = sRows.filter((r) => isDefinitiveLeader(r.jabatan));
              const others = sRows.filter((r) => !isDefinitiveLeader(r.jabatan));
              others.sort((a, b) => a.no - b.no);

              const sorted = [...leaders, ...others];
              sorted.forEach((r, idx) => {
                cleanOrderedRows.push({ ...r, no: idx + 1 });
              });
            }

            setGridRows(cleanOrderedRows);
            saveCustomMatrixRows(cleanOrderedRows);
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

    // Filter anti-duplikasi kader pada sumber data territory (hanya buang duplikat jika orang yang sama memegang jabatan yang sama di badan/wilayah yang sama)
    const dedupedMatched: Member[] = [];
    const seenTerritoryPositions = new Set<string>();

    for (const m of matchedMembers) {
      const cleanNik = (m.nik || '').replace(/[^0-9]/g, '');
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      const cleanJab = (m.jabatan || '').toLowerCase().trim();
      const cleanSub = (m.wilayahPenugasan || '').toLowerCase().trim();
      const identity = cleanNik && !isGeneratedNik(cleanNik) ? cleanNik : cleanName;

      const posKey = `${m.id || identity}|${cleanSub}|${cleanJab}`;
      if (identity && seenTerritoryPositions.has(posKey)) continue;

      if (identity) seenTerritoryPositions.add(posKey);
      dedupedMatched.push(m);
    }
    matchedMembers = dedupedMatched;
    setRawTerritoryMembers(matchedMembers);

    const assignedPositions = new Set<Member>();
    const assignedPositionKeys = new Set<string>();

    const getPosKey = (m: Member, slotNo?: number): string =>
      m.id ||
      `${(m.nik || m.namaLengkap || '').trim()}|${(m.wilayahPenugasan || '').toLowerCase().trim()}|${(m.jabatan || '').toLowerCase().trim()}|${m.urutan ?? slotNo ?? ''}`;

    const isAssigned = (m: Member): boolean =>
      assignedPositions.has(m) || assignedPositionKeys.has(getPosKey(m));

    const markAssigned = (m: Member, slotNo?: number) => {
      assignedPositions.add(m);
      assignedPositionKeys.add(getPosKey(m, slotNo));
    };

    // Saring template yang tidak dihapus secara eksplisit oleh pengguna
    const activeTemplate = template.filter((slot) => {
      const slotEmptyId = `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}`;
      const key1 = getSlotKey(slot.subOrg, slot.no, slot.jabatan);
      const key2 = `${slot.subOrg.trim().toLowerCase()}__slot_${slot.no}`;
      const key3 = `${slot.subOrg.trim().toLowerCase()}__jabatan_${slot.jabatan.trim().toLowerCase()}`;
      return !deletedKeys.has(slotEmptyId) && !deletedKeys.has(key1) && !deletedKeys.has(key2) && !deletedKeys.has(key3);
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
          markAssigned(matched, slot.no);
          const rowId =
            matched.id && !matched.id.startsWith('empty_') && matched.id !== matched.nik
              ? matched.id
              : `${matched.nik}_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${(matched.jabatan || slot.jabatan).replace(/[^a-z0-9]/gi, '_')}`;
          rows.push({
            id: rowId,
            no: slot.no,
            subOrg: pertimbanganSubOrgName,
            jabatan: matched.jabatan || slot.jabatan,
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            fotoProfilUrl: matched.fotoProfilUrl || '',
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
        if (isAssigned(m)) return;
        markAssigned(m, extraPertimbanganNo);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pertimbanganSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${extraPertimbanganNo}_${(m.jabatan || 'Anggota').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: extraPertimbanganNo++,
          subOrg: pertimbanganSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pertimbanganMembers.length > 0) {
      const sortedPertimbangan = [...pertimbanganMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPertimbangan.forEach((m, idx) => {
        if (isAssigned(m)) return;
        markAssigned(m, idx + 1);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pertimbanganSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${idx + 1}_${(m.jabatan || 'Anggota').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: idx + 1,
          subOrg: pertimbanganSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
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
          markAssigned(matched, slot.no);
          const rowId =
            matched.id && !matched.id.startsWith('empty_') && matched.id !== matched.nik
              ? matched.id
              : `${matched.nik}_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${(matched.jabatan || slot.jabatan).replace(/[^a-z0-9]/gi, '_')}`;
          rows.push({
            id: rowId,
            no: slot.no,
            subOrg: pakarSubOrgName,
            jabatan: matched.jabatan || slot.jabatan,
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            fotoProfilUrl: matched.fotoProfilUrl || '',
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
        if (isAssigned(m)) return;
        markAssigned(m, extraPakarNo);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pakarSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${extraPakarNo}_${(m.jabatan || 'Anggota').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: extraPakarNo++,
          subOrg: pakarSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pakarMembers.length > 0) {
      const sortedPakar = [...pakarMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPakar.forEach((m, idx) => {
        if (isAssigned(m)) return;
        markAssigned(m, idx + 1);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pakarSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${idx + 1}_${(m.jabatan || 'Anggota').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: idx + 1,
          subOrg: pakarSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
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
          markAssigned(matched, slot.no);
          const rowId =
            matched.id && !matched.id.startsWith('empty_') && matched.id !== matched.nik
              ? matched.id
              : `${matched.nik}_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${(matched.jabatan || slot.jabatan).replace(/[^a-z0-9]/gi, '_')}`;
          rows.push({
            id: rowId,
            no: slot.no,
            subOrg: pimpinanSubOrgName,
            jabatan: matched.jabatan || slot.jabatan, // Nama jabatan sesuai berkas SK Excel
            namaLengkap: matched.namaLengkap,
            nik: matched.nik,
            nomorEKTA: matched.nomorEKTA || '',
            email: matched.email || '',
            nomorHP: matched.nomorHP || '',
            sosmed: matched.sosmed || '',
            fotoProfilUrl: matched.fotoProfilUrl || '',
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
        if (isAssigned(m)) return;
        markAssigned(m, extraPimpinanNo);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pimpinanSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${extraPimpinanNo}_${(m.jabatan || 'Pengurus').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: extraPimpinanNo++,
          subOrg: pimpinanSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pimpinanMembers.length > 0) {
      pimpinanMembers.forEach((m, idx) => {
        if (isAssigned(m)) return;
        markAssigned(m, idx + 1);
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${pimpinanSubOrgName.replace(/[^a-z0-9]/gi, '_')}_${idx + 1}_${(m.jabatan || 'Pengurus').replace(/[^a-z0-9]/gi, '_')}`;
        rows.push({
          id: rowId,
          no: idx + 1,
          subOrg: pimpinanSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    }

    // 4. ANGGOTA EKSTRA/TAMBAHAN (ANTI DATA-LOSS)
    matchedMembers.forEach((m) => {
      if (!isAssigned(m)) {
        markAssigned(m);
        const cat = getMemberSubOrgCategory(m);
        const targetSubOrg =
          cat === 'PERTIMBANGAN'
            ? pertimbanganSubOrgName
            : cat === 'PAKAR'
            ? pakarSubOrgName
            : pimpinanSubOrgName;
        const rowNo = rows.filter((r) => r.subOrg === targetSubOrg).length + 1;
        const rowId =
          m.id && !m.id.startsWith('empty_') && m.id !== m.nik
            ? m.id
            : `${m.nik}_${targetSubOrg.replace(/[^a-z0-9]/gi, '_')}_${rowNo}_${(m.jabatan || 'Pengurus').replace(/[^a-z0-9]/gi, '_')}`;

        rows.push({
          id: rowId,
          no: rowNo,
          subOrg: targetSubOrg,
          jabatan: m.jabatan,
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          fotoProfilUrl: m.fotoProfilUrl || '',
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
      let lastIdxOfSubOrg = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].subOrg === defaultSubOrg) {
          lastIdxOfSubOrg = i;
          break;
        }
      }
      const updated = [...prev];
      if (lastIdxOfSubOrg !== -1) {
        updated.splice(lastIdxOfSubOrg + 1, 0, newRow);
      } else {
        updated.push(newRow);
      }

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
    let insertIndex = position === 'below' ? targetIndex + 1 : targetIndex;

    // JANGAN PERNAH menyisipkan baris di atas Ketua definitif (#1)
    if (position === 'above' && isDefinitiveLeader(targetRow.jabatan)) {
      insertIndex = targetIndex + 1;
    }

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

    const isCustomRow = targetRow.id.startsWith('custom_row_') || targetRow.id.startsWith('new_row_');
    const isFilled = Boolean(targetRow.namaLengkap && targetRow.namaLengkap.trim() !== '' && targetRow.namaLengkap !== '-');

    // 1. Jika baris ini adalah jabatan baku template yang terisi nama anggota
    // -> Hapus keanggotaan dari matriks (kosongkan data kader di slot ini sehingga menjadi 'Lowong / Belum Terisi')
    // Jangan hapus baris jabatan dari AD/ART! Nomor urut dan jabatan resmi tetap utuh tanpa mengacak susunan.
    if (!isCustomRow && isFilled) {
      const hasOtherPositionInGrid = gridRows.some(
        (other) =>
          other.id !== targetRow.id &&
          (other.nik === targetRow.nik || other.originalNik === targetRow.nik) &&
          other.namaLengkap.trim() !== ''
      );
      if (!hasOtherPositionInGrid && targetRow.nik && !targetRow.id.startsWith('empty_')) {
        setDeletedMemberNiks((prev) => [...prev, targetRow.nik]);
      }

      setGridRows((prev) => {
        const updated = prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              namaLengkap: '',
              nik: '',
              nomorEKTA: '',
              email: '',
              nomorHP: '',
              sosmed: '',
              fotoProfilUrl: '',
              isExisting: false,
              originalNik: r.originalNik || r.nik || undefined,
            };
          }
          return r;
        });
        saveCustomMatrixRows(updated);
        return updated;
      });
      setIsEditMode(true);
      return;
    }

    // 2. Jika baris ini adalah baris kustom (hasil tambah/sisip) ATAU slot kosong yang ingin dihilangkan
    const hasOtherPosition = gridRows.some(
      (other) =>
        other.id !== targetRow.id &&
        (other.nik === targetRow.nik || other.originalNik === targetRow.nik) &&
        other.namaLengkap.trim() !== ''
    );
    if (!hasOtherPosition && targetRow.nik && !targetRow.id.startsWith('empty_')) {
      setDeletedMemberNiks((prev) => [...prev, targetRow.nik]);
    }

    const deletedKeys = getStoredDeletedSlotKeys();
    deletedKeys.add(targetRow.id);
    deletedKeys.add(getSlotKey(targetRow.subOrg, targetRow.no, targetRow.jabatan));
    saveDeletedSlotKeys(deletedKeys);

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
    setIsEditMode(true);
  };

  const handleDeleteSelectedRows = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    const idSet = new Set(selectedIds);
    const niksToDelete: string[] = [];

    gridRows.forEach((r) => {
      if (idSet.has(r.id)) {
        const nikTarget = r.originalNik || (r.nik && !r.id.startsWith('empty_') ? r.nik : '');
        if (nikTarget) {
          const hasRemainingPosition = gridRows.some(
            (other) =>
              !idSet.has(other.id) &&
              (other.nik === nikTarget || other.originalNik === nikTarget) &&
              other.namaLengkap.trim() !== ''
          );
          if (!hasRemainingPosition) {
            niksToDelete.push(nikTarget);
          }
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

  const handleResetTemplate = async () => {
    const territoryLabel =
      level === 'DPW'
        ? 'DPW Provinsi Sulawesi Utara'
        : level === 'DPD'
        ? `DPD ${selectedDpd}`
        : level === 'DPC'
        ? `DPC Kec. ${selectedDpc} · ${selectedDpd}`
        : `DPRt ${selectedDprt} · Kec. ${selectedDpc}`;

    const confirmed = await showConfirm({
      variant: 'warning',
      title: 'Pulihkan Template Standar',
      message:
        'Pulihkan seluruh susunan baris jabatan matriks pada wilayah ini kembali ke template standar resmi?',
      detail: territoryLabel,
      confirmText: 'Pulihkan Template',
      cancelText: 'Batal',
    });

    if (confirmed) {
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

    // 1. Anggota yang dikosongkan namanya di slot dialihkan jadi kader biasa (hanya jika tidak memegang jabatan lain di matriks ini)
    gridRows.forEach((row) => {
      if (row.originalNik && !row.namaLengkap.trim()) {
        const hasOtherPositionInGrid = gridRows.some(
          (other) =>
            other.id !== row.id &&
            (other.nik === row.originalNik || other.originalNik === row.originalNik) &&
            other.namaLengkap.trim() !== ''
        );
        if (hasOtherPositionInGrid) {
          return;
        }
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
    const updatedGridRows: GridRowItem[] = [];

    gridRows.forEach((row, idx) => {
      const nama = row.namaLengkap.trim();
      if (!nama) {
        updatedGridRows.push(row);
        return;
      }

      const existingMember = members.find(
        (m) =>
          (row.originalNik && m.nik === row.originalNik) ||
          (row.nik && m.nik === row.nik.trim())
      );

      let nikClean = row.nik.replace(/[^0-9]/g, '').trim();
      const scopeKey =
        level === 'DPRt'
          ? `${territoryDpd}|${territoryDpc}|${territoryDprt}`
          : level === 'DPC'
          ? `${territoryDpd}|${territoryDpc}`
          : undefined;
      if (!isAcceptableImportNik(nikClean)) {
        if (existingMember && isAcceptableImportNik(existingMember.nik)) {
          nikClean = existingMember.nik;
        } else {
          nikClean = generateUniqueTerritoryNik(
            territoryDpd,
            row.subOrg,
            idx + 1,
            occupiedNiks,
            scopeKey
          );
        }
      } else {
        occupiedNiks.add(nikClean);
      }

      if (row.originalNik && row.originalNik !== nikClean) {
        niksToDelete.push(row.originalNik);
      }

      const cleanT = (level || 'DPD').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const cleanD = (territoryDpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const cleanR =
        level === 'DPRt'
          ? `_${(territoryDprt || 'DESA').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
          : '';
      const cleanS = (row.subOrg || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const cleanJ = (row.jabatan || 'PENGURUS').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const memberId =
        row.id && !row.id.startsWith('empty_') && row.id !== nikClean
          ? row.id
          : `${nikClean}_${cleanT}_${cleanD}${cleanR}_${cleanS}_${cleanJ}`;

      const { positions: _staleExistingPositions, ...existingMemberRest } = (existingMember ||
        {}) as Member;

      const finalEkta = row.nomorEKTA.trim() || existingMember?.nomorEKTA || nikClean;

      const updatedMember: Member = {
        ...existingMemberRest,
        id: memberId,
        nik: nikClean,
        nomorEKTA: finalEkta,
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

      updatedGridRows.push({
        ...row,
        id: memberId,
        nik: nikClean,
        originalNik: nikClean,
        nomorEKTA: finalEkta,
        isExisting: true,
      });
    });

    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      onDeleteMembersBatch(niksToDelete, `${level} ${territoryDpd}`);
    }

    onSaveMembersBatch(updatedMembersList, niksToDelete);
    setGridRows(updatedGridRows);
    saveCustomMatrixRows(updatedGridRows);
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

      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
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
  }, [gridRows, statusFilter, debouncedSearchQuery]);

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
