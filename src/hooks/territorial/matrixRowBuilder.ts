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
} from '../../utils/jobMatchingUtils';
import { isGeneratedNik } from '../../utils/generatedIds';

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
  deletedKeys,
  deletedMemberNiks,
  forceReset = false,
}: BuildMatrixRowsParams): BuildMatrixRowsResult {
  const template = getStructureTemplate(level);
  const deletedSet = new Set(deletedMemberNiks);
  const sourceMembers = getExpandedStructuralMembers(members).filter(
    (m) => !deletedSet.has(m.nik) && !(m.id && deletedSet.has(m.id))
  );

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

  // Filter anti-duplikasi: HANYA saring bila orang yang SAMA PERSIS menempati sub-organisasi dan jabatan yang SAMA PERSIS.
  // Rangkap jabatan (beda dewan atau beda jabatan di dewan yang sama) tetap dipertahankan 100%.
  const dedupedMatched: Member[] = [];
  const seenTerritorySlotPersonKeys = new Set<string>();

  for (const m of matchedMembers) {
    const cleanNik = (m.nik || '').replace(/[^0-9]/g, '');
    const cleanName = (m.namaLengkap || '').toLowerCase().trim();
    const isRealNik = cleanNik && !isGeneratedNik(cleanNik);
    const personKey = isRealNik ? cleanNik : cleanName;
    const subCat = getMemberSubOrgCategory(m);
    const cleanJab = (m.jabatan || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (personKey && personKey !== '-') {
      const slotPersonKey = `${personKey}|${subCat}|${cleanJab}`;
      if (seenTerritorySlotPersonKeys.has(slotPersonKey)) continue;
      seenTerritorySlotPersonKeys.add(slotPersonKey);
    }
    dedupedMatched.push(m);
  }
  matchedMembers = dedupedMatched;
  const rawTerritoryMembers = matchedMembers;

  const getPositionEntityKey = (m: Member): string => {
    const cleanNik = (m.nik || '').trim();
    const cleanName = (m.namaLengkap || '').toLowerCase().trim();
    const subCat = getMemberSubOrgCategory(m);
    const cleanJab = (m.jabatan || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanNik || cleanName}|${subCat}|${cleanJab}|${m.id || ''}`;
  };

  const buildRowUniqueId = (m: Member, subOrg: string, jabatan: string, no: number): string => {
    if (m.id && m.id !== m.nik && !m.id.startsWith('empty_')) {
      return m.id;
    }
    const cleanS = (subOrg || 'SUB').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanJ = (jabatan || 'POS').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `${m.nik}_${cleanS}_${cleanJ}_${no}`;
  };

  const assignedPositionKeys = new Set<string>();

  // Saring kursi baku template jika pernah dihapus secara eksplisit di database/matriks (kecuali saat Pulihkan Template)
  const occurrenceCounters = new Map<string, number>();
  const activeTemplate = forceReset
    ? template
    : template.filter((slot) => {
        const baseKey = `${slot.subOrg}_${slot.jabatan}`;
        const occ = (occurrenceCounters.get(baseKey) || 0) + 1;
        occurrenceCounters.set(baseKey, occ);
        if (deletedKeys.has(`${baseKey}#${occ}`)) return false;
        if (deletedKeys.has(baseKey)) return false;
        return true;
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
        assignedPositionKeys.add(getPositionEntityKey(matched));
        rows.push({
          id: buildRowUniqueId(matched, pertimbanganSubOrgName, slot.jabatan, slot.no),
          no: slot.no,
          subOrg: pertimbanganSubOrgName,
          jabatan: slot.jabatan,
          templateJabatan: slot.jabatan,
          isBaku: true,
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
          templateJabatan: slot.jabatan,
          isBaku: true,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = extraPertimbanganNo++;
      const finalJab = m.jabatan || 'Anggota';
      rows.push({
        id: buildRowUniqueId(m, pertimbanganSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pertimbanganSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = idx + 1;
      const finalJab = m.jabatan || 'Anggota';
      rows.push({
        id: buildRowUniqueId(m, pertimbanganSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pertimbanganSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
        assignedPositionKeys.add(getPositionEntityKey(matched));
        rows.push({
          id: buildRowUniqueId(matched, pakarSubOrgName, slot.jabatan, slot.no),
          no: slot.no,
          subOrg: pakarSubOrgName,
          jabatan: slot.jabatan,
          templateJabatan: slot.jabatan,
          isBaku: true,
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
          templateJabatan: slot.jabatan,
          isBaku: true,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = extraPakarNo++;
      const finalJab = m.jabatan || 'Anggota';
      rows.push({
        id: buildRowUniqueId(m, pakarSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pakarSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = idx + 1;
      const finalJab = m.jabatan || 'Anggota';
      rows.push({
        id: buildRowUniqueId(m, pakarSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pakarSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
        assignedPositionKeys.add(getPositionEntityKey(matched));
        rows.push({
          id: buildRowUniqueId(matched, pimpinanSubOrgName, slot.jabatan, slot.no),
          no: slot.no,
          subOrg: pimpinanSubOrgName,
          jabatan: slot.jabatan,
          templateJabatan: slot.jabatan,
          isBaku: true,
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
          templateJabatan: slot.jabatan,
          isBaku: true,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = extraPimpinanNo++;
      const finalJab = m.jabatan || 'Pengurus';
      rows.push({
        id: buildRowUniqueId(m, pimpinanSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pimpinanSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
      const posKey = getPositionEntityKey(m);
      if (assignedPositionKeys.has(posKey)) return;
      assignedPositionKeys.add(posKey);
      const rowNo = idx + 1;
      const finalJab = m.jabatan || 'Pengurus';
      rows.push({
        id: buildRowUniqueId(m, pimpinanSubOrgName, finalJab, rowNo),
        no: rowNo,
        subOrg: pimpinanSubOrgName,
        jabatan: finalJab,
        isBaku: false,
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
    const posKey = getPositionEntityKey(m);
    if (!assignedPositionKeys.has(posKey)) {
      assignedPositionKeys.add(posKey);
      const cat = getMemberSubOrgCategory(m);
      const targetSubOrg =
        cat === 'PERTIMBANGAN'
          ? pertimbanganSubOrgName
          : cat === 'PAKAR'
          ? pakarSubOrgName
          : pimpinanSubOrgName;

      const rowNo = rows.filter((r) => r.subOrg === targetSubOrg).length + 1;
      const finalJab = m.jabatan || 'Pengurus';
      rows.push({
        id: buildRowUniqueId(m, targetSubOrg, finalJab, rowNo),
        no: rowNo,
        subOrg: targetSubOrg,
        jabatan: finalJab,
        isBaku: false,
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

  return { gridRows: normalizedRows, rawTerritoryMembers };
}

