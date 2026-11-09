import { Member } from '../../types';
import { GridRowItem } from '../../components/matrix';
import { getStructureTemplate } from '../../data/structureTemplates';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
  getExpandedStructuralMembers,
} from '../../utils/structureReadinessUtils';
import {
  getCouncilRank,
  sortMembersByHierarchy,
  assignItemsToTemplateSlots,
  isDefinitiveLeader,
  cleanPersonName,
} from '../../utils/jobMatchingUtils';
import { isGeneratedNik } from '../../utils/generatedIds';
import { getSlotKey, saveCustomMatrixRows } from './matrixStorage';

export interface BuildMatrixRowsParams {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  selectedDpd: string;
  selectedDpc: string;
  selectedDprt: string;
  matrixStorageKey: string;
  territoryKey: string;
  deletedKeys: Set<string>;
  deletedMemberNiks: string[];
  forceReset?: boolean;
}

export interface BuildMatrixRowsResult {
  gridRows: GridRowItem[];
  rawTerritoryMembers: Member[];
}

export function buildTerritorialMatrixGridRows({
  level,
  members,
  selectedDpd,
  selectedDpc,
  selectedDprt,
  matrixStorageKey,
  territoryKey,
  deletedKeys,
  deletedMemberNiks,
  forceReset = false,
}: BuildMatrixRowsParams): BuildMatrixRowsResult {
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
            if (nameClean && nameClean !== '-' && nameClean !== 'belum terisi') {
              if (seenNamesInCache.has(nameClean)) hasDuplicatePerson = true;
              seenNamesInCache.add(nameClean);
            }
            if (nikClean && !isGeneratedNik(nikClean)) {
              if (seenNiksInCache.has(nikClean)) hasDuplicatePerson = true;
              seenNiksInCache.add(nikClean);
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
              (r.nik && memberMapByNik.get(r.nik.trim())) ||
              (r.originalNik && memberMapByNik.get(r.originalNik.trim())) ||
              (r.id && memberMapById.get(r.id.trim())) ||
              (rNameNorm && memberMapByName.get(rNameNorm));

            if (liveMember) {
              return {
                ...r,
                id: liveMember.nik || r.id,
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

          saveCustomMatrixRows(matrixStorageKey, cleanOrderedRows);
          return { gridRows: cleanOrderedRows, rawTerritoryMembers: liveTerritoryMembers };
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

  // Filter anti-duplikasi kader pada sumber data territory
  const dedupedMatched: Member[] = [];
  const seenTerritoryNiks = new Set<string>();
  const seenTerritoryNames = new Set<string>();

  for (const m of matchedMembers) {
    const cleanNik = (m.nik || '').replace(/[^0-9]/g, '');
    const cleanName = (m.namaLengkap || '').toLowerCase().trim();
    const isRealNik = cleanNik && !isGeneratedNik(cleanNik);

    if (isRealNik && seenTerritoryNiks.has(cleanNik)) continue;
    if (cleanName && cleanName !== '-' && seenTerritoryNames.has(cleanName)) continue;

    if (isRealNik) seenTerritoryNiks.add(cleanNik);
    if (cleanName && cleanName !== '-') seenTerritoryNames.add(cleanName);
    dedupedMatched.push(m);
  }
  matchedMembers = dedupedMatched;
  const rawTerritoryMembers = matchedMembers;

  const assignedMemberNiks = new Set<string>();
  const assignedMemberNames = new Set<string>();

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
        assignedMemberNiks.add(matched.nik);
        if (matched.namaLengkap) assignedMemberNames.add(matched.namaLengkap.toLowerCase().trim());
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
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
        assignedMemberNiks.add(matched.nik);
        if (matched.namaLengkap) assignedMemberNames.add(matched.namaLengkap.toLowerCase().trim());
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
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
        fotoProfilUrl: m.fotoProfilUrl || '',
        isExisting: true,
        originalNik: m.nik,
      });
    });
  }

  // 3. DEWAN PIMPINAN
  if (pimpinanTemplateSlots.length > 0) {
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
        if (matched.namaLengkap) assignedMemberNames.add(matched.namaLengkap.toLowerCase().trim());
        rows.push({
          id: matched.nik,
          no: slot.no,
          subOrg: pimpinanSubOrgName,
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
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
        fotoProfilUrl: m.fotoProfilUrl || '',
        isExisting: true,
        originalNik: m.nik,
      });
    });
  } else if (pimpinanMembers.length > 0) {
    pimpinanMembers.forEach((m, idx) => {
      const cleanNik = (m.nik || '').trim();
      const cleanName = (m.namaLengkap || '').toLowerCase().trim();
      if ((cleanNik && assignedMemberNiks.has(cleanNik)) || (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName))) {
        return;
      }
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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
        fotoProfilUrl: m.fotoProfilUrl || '',
        isExisting: true,
        originalNik: m.nik,
      });
    });
  }

  // 4. ANGGOTA EKSTRA/TAMBAHAN (ANTI DATA-LOSS)
  matchedMembers.forEach((m) => {
    const cleanNik = (m.nik || '').trim();
    const cleanName = (m.namaLengkap || '').toLowerCase().trim();
    const alreadyAssigned =
      (cleanNik && assignedMemberNiks.has(cleanNik)) ||
      (cleanName && cleanName !== '-' && assignedMemberNames.has(cleanName));

    if (!alreadyAssigned) {
      if (cleanNik) assignedMemberNiks.add(cleanNik);
      if (cleanName) assignedMemberNames.add(cleanName);
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

  saveCustomMatrixRows(matrixStorageKey, normalizedRows);
  return { gridRows: normalizedRows, rawTerritoryMembers };
}

