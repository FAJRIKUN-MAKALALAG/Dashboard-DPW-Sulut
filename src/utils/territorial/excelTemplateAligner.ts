import { Member } from '../../types';
import { getStructureTemplate } from '../../data/structureTemplates';
import {
  isDpdMatch,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
} from '../structureReadinessUtils';
import {
  normalizeSubOrgName,
  assignItemsToTemplateSlots,
  isJobTitleMatch,
  cleanPersonName,
} from '../jobMatchingUtils';
import {
  makeGeneratedEkta,
  isGeneratedNik,
  isAcceptableImportNik,
} from '../generatedIds';
import {
  ParsedTerritoryRow,
  DpdImportComplianceInfo,
  ParseTerritoryExcelResult,
  AiTemplateCheckResult,
} from './excelTypes';
import { generateUniqueTerritoryNik } from './excelTemplateGenerators';
import { buildTerritorialPositionId, getTerritoryScopeKey } from './excelCellParsers';
import { findSameTerritorySlotMember, stripMemberPositions } from './excelSlotMatcher';

export function alignAndCheckWithTemplate(
  currentResult: ParseTerritoryExcelResult,
  currentMembers: Member[],
  adminName = 'Admin Teritorial'
): AiTemplateCheckResult {
  const ctx = currentResult.territoryContext;
  const territoryDpd = ctx.level === 'DPW' ? 'Sulawesi Utara' : ctx.dpd;
  const territoryDpc =
    ctx.level === 'DPW'
      ? 'Wilayah DPW'
      : ctx.level === 'DPD'
      ? 'Umum (DPD)'
      : ctx.dpc || 'Umum (DPD)';
  const territoryDprt = ctx.level === 'DPRt' ? ctx.dprt || 'Pusat' : 'Pusat/Umum';

  const allSlots = getStructureTemplate(ctx.level);
  const pertimbanganSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN');
  const pakarSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PAKAR');
  const pimpinanSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
  const expandedCurrentMembers = getExpandedStructuralMembers(currentMembers);

  const pertimbanganRows: ParsedTerritoryRow[] = [];
  const pakarRows: ParsedTerritoryRow[] = [];
  const pimpinanRows: ParsedTerritoryRow[] = [];

  for (const row of currentResult.rows) {
    if (!row.isFilled) continue;
    const cat = getMemberSubOrgCategory({
      jabatan: row.jabatanExcel,
      wilayahPenugasan: row.subOrg,
    } as Member);
    if (cat === 'PERTIMBANGAN') {
      pertimbanganRows.push(row);
    } else if (cat === 'PAKAR') {
      pakarRows.push(row);
    } else {
      pimpinanRows.push(row);
    }
  }

  const alignedPertimbanganRows: ParsedTerritoryRow[] = [];
  let vacantSlotsCount = 0;
  let filledStandardCount = 0;

  if (pertimbanganSlots.length > 0) {
    const { slotAssignments: pertimbanganAssignments, unassignedItems: unassignedPertimbangan } =
      assignItemsToTemplateSlots(
        pertimbanganSlots,
        pertimbanganRows,
        (r) => r.jabatanExcel || r.jabatanMatched || '',
        (r) => r.no
      );

    for (const slot of pertimbanganSlots) {
      if (pertimbanganAssignments.has(slot.no)) {
        const { item: r } = pertimbanganAssignments.get(slot.no)!;
        filledStandardCount++;
        alignedPertimbanganRows.push({
          ...r,
          no: slot.no,
          subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
          jabatanExcel: r.jabatanExcel || slot.jabatan,
          jabatanMatched: slot.jabatan,
          isMatched: true,
          aiNote: `✓ Sesuai Slot Dewan Pertimbangan #${slot.no} (${slot.jabatan})`,
        });
      } else {
        vacantSlotsCount++;
        alignedPertimbanganRows.push({
          no: slot.no,
          dpd: territoryDpd,
          subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
          jabatanExcel: slot.jabatan,
          jabatanMatched: slot.jabatan,
          isMatched: true,
          namaLengkap: '-',
          nik: '',
          nomorEKTA: '',
          jenisKelamin: '',
          nomorHP: '',
          email: '',
          alamat: '',
          status: 'Kosong / Lowong',
          isFilled: false,
          isVacantSlot: true,
          aiNote: `⚠️ Jabatan belum terisi di Excel (ditetapkan Kosong No. #${slot.no})`,
        });
      }
    }

    let extraPertimbanganCounter = pertimbanganSlots.length + 1;
    for (const { item: r } of unassignedPertimbangan) {
      alignedPertimbanganRows.push({
        ...r,
        no: extraPertimbanganCounter++,
        subOrg: normalizeSubOrgName(
          r.subOrg || pertimbanganSlots[0]?.subOrg || 'I. DEWAN PERTIMBANGAN',
          ctx.level
        ),
        isMatched: true,
        aiNote: `✓ Anggota Tambahan Dewan Pertimbangan #${extraPertimbanganCounter - 1}`,
      });
    }
  } else {
    let pertimbanganNo = 1;
    for (const r of pertimbanganRows) {
      const sub = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      alignedPertimbanganRows.push({
        ...r,
        no: pertimbanganNo++,
        subOrg: normalizeSubOrgName(sub, ctx.level),
        isMatched: true,
        aiNote: `✓ Dewan Pertimbangan Urutan #${pertimbanganNo - 1}`,
      });
    }
  }

  const alignedPakarRows: ParsedTerritoryRow[] = [];
  if (pakarSlots.length > 0) {
    const { slotAssignments: pakarAssignments, unassignedItems: unassignedPakar } =
      assignItemsToTemplateSlots(
        pakarSlots,
        pakarRows,
        (r) => r.jabatanExcel || r.jabatanMatched || '',
        (r) => r.no
      );

    for (const slot of pakarSlots) {
      if (pakarAssignments.has(slot.no)) {
        const { item: r } = pakarAssignments.get(slot.no)!;
        filledStandardCount++;
        alignedPakarRows.push({
          ...r,
          no: slot.no,
          subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
          jabatanExcel: r.jabatanExcel || slot.jabatan,
          jabatanMatched: slot.jabatan,
          isMatched: true,
          aiNote: `✓ Sesuai Slot Dewan Pakar #${slot.no} (${slot.jabatan})`,
        });
      } else {
        vacantSlotsCount++;
        alignedPakarRows.push({
          no: slot.no,
          dpd: territoryDpd,
          subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
          jabatanExcel: slot.jabatan,
          jabatanMatched: slot.jabatan,
          isMatched: true,
          namaLengkap: '-',
          nik: '',
          nomorEKTA: '',
          jenisKelamin: '',
          nomorHP: '',
          email: '',
          alamat: '',
          status: 'Kosong / Lowong',
          isFilled: false,
          isVacantSlot: true,
          aiNote: `⚠️ Jabatan belum terisi di Excel (ditetapkan Kosong No. #${slot.no})`,
        });
      }
    }

    let extraPakarCounter = pakarSlots.length + 1;
    for (const { item: r } of unassignedPakar) {
      alignedPakarRows.push({
        ...r,
        no: extraPakarCounter++,
        subOrg: normalizeSubOrgName(
          r.subOrg || pakarSlots[0]?.subOrg || 'II. DEWAN PAKAR',
          ctx.level
        ),
        isMatched: true,
        aiNote: `✓ Anggota Tambahan Dewan Pakar #${extraPakarCounter - 1}`,
      });
    }
  } else {
    let pakarNo = 1;
    for (const r of pakarRows) {
      const sub = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      alignedPakarRows.push({
        ...r,
        no: pakarNo++,
        subOrg: normalizeSubOrgName(sub, ctx.level),
        isMatched: true,
        aiNote: `✓ Dewan Pakar Urutan #${pakarNo - 1}`,
      });
    }
  }

  const alignedPimpinanRows: ParsedTerritoryRow[] = [];

  // Gunakan algoritma 3-Pass Best-Match Assignment untuk pimpinan
  const { slotAssignments, unassignedItems } = assignItemsToTemplateSlots(
    pimpinanSlots,
    pimpinanRows,
    (r) => r.jabatanExcel || r.jabatanMatched || '',
    (r) => r.no
  );

  for (const slot of pimpinanSlots) {
    if (slotAssignments.has(slot.no)) {
      const { item: r } = slotAssignments.get(slot.no)!;
      filledStandardCount++;
      const slotNote = `✓ Sesuai Slot Template #${slot.no} (${slot.jabatan})`;
      alignedPimpinanRows.push({
        ...r,
        no: slot.no,
        subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
        jabatanExcel: r.jabatanExcel || slot.jabatan,
        jabatanMatched: slot.jabatan,
        isMatched: true,
        aiNote: r.aiNote?.startsWith('⚠️') ? `${slotNote} · ${r.aiNote}` : slotNote,
      });
    } else {
      vacantSlotsCount++;
      alignedPimpinanRows.push({
        no: slot.no,
        dpd: territoryDpd,
        subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
        jabatanExcel: slot.jabatan,
        jabatanMatched: slot.jabatan,
        isMatched: true,
        namaLengkap: '-',
        nik: '',
        nomorEKTA: '',
        jenisKelamin: '',
        nomorHP: '',
        email: '',
        alamat: '',
        status: 'Kosong / Lowong',
        isFilled: false,
        isVacantSlot: true,
        aiNote: `⚠️ Jabatan belum terisi di Excel (ditetapkan Kosong No. #${slot.no})`,
      });
    }
  }

  let extraCounter = pimpinanSlots.length + 1;
  let extraRowsCount = unassignedItems.length;
  for (const { item: r } of unassignedItems) {
    alignedPimpinanRows.push({
      ...r,
      no: extraCounter++,
      subOrg: normalizeSubOrgName(
        r.subOrg || pimpinanSlots[0]?.subOrg || 'III. DEWAN PIMPINAN DAERAH',
        ctx.level
      ),
      isMatched: false,
      aiNote: `➕ Jabatan tambahan (di luar ${pimpinanSlots.length} struktur baku)`,
    });
  }

  const finalRows: ParsedTerritoryRow[] = [
    ...alignedPertimbanganRows,
    ...alignedPakarRows,
    ...alignedPimpinanRows,
  ];

  const allExistingNiksHelper = new Set<string>(currentMembers.map((m) => m.nik));
  const batchAssignedNiksHelper = new Set<string>();
  const batchNameToNikHelper = new Map<string, string>();
  const batchNikToNameHelper = new Map<string, string>();
  const newMembersToSave: Member[] = [];

  const isValidNikHelper = (nik?: string): boolean => isAcceptableImportNik(nik);

  for (const r of finalRows) {
    if (!r.isFilled || !r.namaLengkap || r.namaLengkap === '-' || r.isVacantSlot) {
      continue;
    }

    let nikVal = r.nik;
    const rowDpdTarget = r.dpd || territoryDpd;
    const normNama = cleanPersonName(r.namaLengkap).toLowerCase();
    const personScopeKey = `${rowDpdTarget.toLowerCase().trim()}|${normNama}`;

    const existingSlotMember = findSameTerritorySlotMember(
      expandedCurrentMembers,
      ctx.level,
      rowDpdTarget,
      territoryDpc,
      territoryDprt,
      r.subOrg,
      r.jabatanExcel,
      r.namaLengkap
    );

    const existingSamePersonInTerritory = normNama
      ? currentMembers.find(
          (m) =>
            cleanPersonName(m.namaLengkap).toLowerCase() === normNama &&
            isDpdMatch(m.dpd, rowDpdTarget)
        )
      : undefined;

    const isSamePersonNikReuse =
      isValidNikHelper(nikVal) &&
      batchAssignedNiksHelper.has(nikVal) &&
      normNama !== '' &&
      batchNikToNameHelper.get(nikVal) === normNama;

    const hasValidExcelNik =
      isValidNikHelper(nikVal) && (!batchAssignedNiksHelper.has(nikVal) || isSamePersonNikReuse);

    if (hasValidExcelNik) {
      batchAssignedNiksHelper.add(nikVal);
      allExistingNiksHelper.add(nikVal);
      if (normNama) {
        batchNameToNikHelper.set(personScopeKey, nikVal);
        batchNikToNameHelper.set(nikVal, normNama);
      }
    } else {
      if (normNama && batchNameToNikHelper.has(personScopeKey)) {
        nikVal = batchNameToNikHelper.get(personScopeKey)!;
      } else if (
        existingSlotMember &&
        isValidNikHelper(existingSlotMember.nik) &&
        !isGeneratedNik(existingSlotMember.nik) &&
        (!batchAssignedNiksHelper.has(existingSlotMember.nik) ||
          batchNikToNameHelper.get(existingSlotMember.nik) === normNama)
      ) {
        nikVal = existingSlotMember.nik;
        batchAssignedNiksHelper.add(nikVal);
      } else if (
        existingSamePersonInTerritory &&
        isValidNikHelper(existingSamePersonInTerritory.nik) &&
        (!batchAssignedNiksHelper.has(existingSamePersonInTerritory.nik) ||
          batchNikToNameHelper.get(existingSamePersonInTerritory.nik) === normNama)
      ) {
        nikVal = existingSamePersonInTerritory.nik;
        batchAssignedNiksHelper.add(nikVal);
      } else {
        nikVal = generateUniqueTerritoryNik(
          rowDpdTarget,
          r.subOrg,
          r.no,
          allExistingNiksHelper,
          getTerritoryScopeKey(ctx.level, rowDpdTarget, territoryDpc, territoryDprt)
        );
        batchAssignedNiksHelper.add(nikVal);
      }

      if (normNama && nikVal) {
        batchNameToNikHelper.set(personScopeKey, nikVal);
        batchNikToNameHelper.set(nikVal, normNama);
      }
    }

    r.nik = nikVal;
    const finalJabatan = r.jabatanExcel || r.jabatanMatched || 'Pengurus';

    const memberId = buildTerritorialPositionId(
      nikVal,
      ctx.level,
      territoryDpc,
      territoryDprt,
      r.subOrg,
      finalJabatan
    );

    const existingMember = currentMembers.find((m) => m.nik === nikVal);

    const memberObj: Member = {
      ...stripMemberPositions(existingMember),
      id: memberId,
      nik: nikVal,
      nomorEKTA: r.nomorEKTA || existingMember?.nomorEKTA || makeGeneratedEkta(nikVal),
      namaLengkap: r.namaLengkap,
      email: r.email || existingMember?.email || undefined,
      nomorHP: r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : existingMember?.nomorHP || '-',
      alamatLengkap: r.alamat || existingMember?.alamatLengkap || undefined,
      jenisKelamin:
        r.jenisKelamin?.toUpperCase().startsWith('L') ||
        r.jenisKelamin?.toLowerCase().includes('laki')
          ? 'Laki-laki'
          : r.jenisKelamin?.toUpperCase().startsWith('P') ||
            r.jenisKelamin?.toLowerCase().includes('perem')
          ? 'Perempuan'
          : existingMember?.jenisKelamin || undefined,
      dpd: territoryDpd,
      dpc: territoryDpc,
      dprt: territoryDprt,
      isPengurus: true,
      tingkatKepengurusan: ctx.level,
      wilayahPenugasan: r.subOrg,
      urutan: r.no,
      nomorSK:
        existingSlotMember?.nomorSK ||
        (ctx.level === 'DPRt'
          ? `SK-DPRT-${(territoryDprt || 'DESA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`
          : `SK-${ctx.level}-${territoryDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`),
      jabatan: r.jabatanExcel || r.jabatanMatched || 'Pengurus',
      status: 'Aktif',
      statusKtpVerified: true,
      tanggalBergabung:
        existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: `${adminName} (AI Check & Clear Format Template)`,
    };

    newMembersToSave.push(memberObj);
  }

  const filledCount = newMembersToSave.length;
  const matchedPositions = finalRows.filter((r) => r.isMatched).length;

  let dpdPimpinanCompliance: DpdImportComplianceInfo | undefined = undefined;
  if (ctx.level === 'DPD') {
    const filledSlots: Array<{ no: number; jabatan: string; namaLengkap: string }> = [];
    const vacantSlots: Array<{ no: number; jabatan: string; subOrg: string }> = [];

    for (const slot of pimpinanSlots) {
      const row = alignedPimpinanRows.find(
        (r) =>
          (isJobTitleMatch(r.jabatanMatched || r.jabatanExcel, slot.jabatan) || r.no === slot.no) &&
          r.isFilled &&
          !r.isVacantSlot
      );
      if (row) {
        filledSlots.push({
          no: slot.no,
          jabatan: slot.jabatan,
          namaLengkap: row.namaLengkap,
        });
      } else {
        vacantSlots.push({
          no: slot.no,
          jabatan: slot.jabatan,
          subOrg: slot.subOrg,
        });
      }
    }

    dpdPimpinanCompliance = {
      totalRequired: pimpinanSlots.length || 36,
      filledCount: filledSlots.length,
      vacantCount: vacantSlots.length,
      isComplete: filledSlots.length >= (pimpinanSlots.length || 36),
      vacantSlots,
      filledSlots,
    };
  }

  return {
    success: true,
    rows: finalRows,
    membersToSave: newMembersToSave,
    stats: {
      totalRows: finalRows.length,
      filledRows: filledCount,
      vacantSlotsCount,
      standardSlotsTarget: pimpinanSlots.length,
      extraRowsCount,
      pertimbanganCount: alignedPertimbanganRows.length,
      pakarCount: alignedPakarRows.length,
      pimpinanCount: alignedPimpinanRows.length,
      matchedCount: matchedPositions,
    },
    message: `Format berhasil diperiksa & dirapikan: ${filledStandardCount}/${pimpinanSlots.length} jabatan baku terisi, ${vacantSlotsCount} slot kosong ditetapkan, ${extraRowsCount} jabatan tambahan dirapikan.`,
    dpdPimpinanCompliance,
  };
}

