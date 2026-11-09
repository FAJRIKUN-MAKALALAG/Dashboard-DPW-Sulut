import XLSX from 'xlsx-js-style';
import { Member } from '../../types';
import { getStructureTemplate } from '../../data/structureTemplates';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  getExpandedStructuralMembers,
  getSlotSubOrgCategory,
} from '../structureReadinessUtils';
import {
  normalizeSubOrgName,
  isJobTitleMatch,
  calculateJobMatchScore,
} from '../jobMatchingUtils';
import {
  makeGeneratedEkta,
  isGeneratedNik,
  isAcceptableImportNik,
} from '../generatedIds';
import {
  TerritoryContext,
  ParsedTerritoryRow,
  DpdImportComplianceInfo,
  ParseTerritoryExcelResult,
} from './excelTypes';
import { generateUniqueTerritoryNik } from './excelTemplateGenerators';
import {
  parseCleanIdString,
  buildTerritorialPositionId,
  getTerritoryScopeKey,
} from './excelCellParsers';
import { findSameTerritorySlotMember, stripMemberPositions } from './excelSlotMatcher';
import { alignAndCheckWithTemplate } from './excelTemplateAligner';

export async function parseTerritorialExcelFile(
  file: File,
  ctx: TerritoryContext,
  currentMembers: Member[],
  adminName = 'Admin Teritorial'
): Promise<ParseTerritoryExcelResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja.');
  }

  const slots = getStructureTemplate(ctx.level);
  const parsedRows: ParsedTerritoryRow[] = [];
  const membersToSave: Member[] = [];
  const expandedCurrentMembers = getExpandedStructuralMembers(currentMembers);
  const allExistingNiks = new Set<string>(currentMembers.map((m) => m.nik));
  const batchAssignedNiks = new Set<string>();

  const territoryDpd = ctx.level === 'DPW' ? 'Sulawesi Utara' : ctx.dpd;
  const territoryDpc =
    ctx.level === 'DPW'
      ? 'Wilayah DPW'
      : ctx.level === 'DPD'
      ? 'Umum (DPD)'
      : ctx.dpc || 'Umum (DPD)';
  const territoryDprt = ctx.level === 'DPRt' ? ctx.dprt || 'Pusat' : 'Pusat/Umum';

  const isValidNik = (nik?: string): boolean => isAcceptableImportNik(nik);

  let filledCount = 0;
  let matchedPositions = 0;
  let customPositions = 0;

  const urutanCounter = new Map<string, number>();
  const nextUrutan = (dpd: string, subOrg: string): number => {
    const key = `${dpd}|${subOrg}`.toLowerCase();
    const next = (urutanCounter.get(key) || 0) + 1;
    urutanCounter.set(key, next);
    return next;
  };

  for (const sheetName of wb.SheetNames) {
    const sheetLower = sheetName.toLowerCase().trim();
    if (
      sheetLower.includes('panduan') ||
      sheetLower.includes('info') ||
      sheetLower.includes('petunjuk')
    ) {
      continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rawData || rawData.length === 0) continue;

    let defaultSubOrg = '';
    if (sheetLower.includes('pertimbangan')) {
      defaultSubOrg =
        ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
    } else if (sheetLower.includes('pakar')) {
      defaultSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
    }

    let headerRowIdx = -1;
    let colNo = -1;
    let colDpd = -1;
    let colSubOrg = -1;
    let colJabatan = -1;
    let colNama = -1;
    let colNik = -1;
    let colEkta = -1;
    let colGender = -1;
    let colHp = -1;
    let colEmail = -1;
    let colAlamat = -1;

    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i] || [];
      const validCells = row.filter((c) => String(c || '').trim() !== '');
      if (validCells.length >= 2) {
        const firstCell = String(row[0] || '').toLowerCase().trim();
        if (
          firstCell.includes('provinsi') ||
          firstCell.includes('kabupaten') ||
          firstCell.includes('susunan pengurus') ||
          firstCell.includes('partai nasdem') ||
          firstCell.includes('template')
        ) {
          continue;
        }

        const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
        const hasJabatanHeader = rowLower.some(
          (c) => c.includes('jabatan') || c.includes('posisi') || c.includes('struktur')
        );
        const hasNamaHeader = rowLower.some(
          (c) => c.includes('nama') || c.includes('personil') || c.includes('kader')
        );
        const hasNikHeader = rowLower.some(
          (c) => c.includes('nik') || c.includes('ktp') || c.includes('identitas')
        );

        if ((hasJabatanHeader && hasNamaHeader) || (hasNamaHeader && hasNikHeader)) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      for (let i = 0; i < Math.min(15, rawData.length); i++) {
        const row = rawData[i] || [];
        const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
        if (
          rowLower.some((c) => c.includes('nama')) &&
          rowLower.some((c) => c.includes('jabatan') || c.includes('posisi'))
        ) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      for (let i = 0; i < Math.min(15, rawData.length); i++) {
        const row = rawData[i] || [];
        const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
        if (
          rowLower.some((c) => c === 'no' || c === 'no.') &&
          rowLower.some((c) => c.includes('nama') || c.includes('jabatan'))
        ) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) continue;

    const headers = (rawData[headerRowIdx] || []).map((h) =>
      String(h || '')
        .toLowerCase()
        .trim()
    );

    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (!h) continue;

      if (h === 'no' || h === 'no.' || h.startsWith('nomor urut') || h === 'num') {
        if (colNo === -1) colNo = c;
      } else if (
        h.includes('kabupaten') ||
        h.includes('kota') ||
        h.includes('dpd') ||
        h.includes('daerah')
      ) {
        if (colDpd === -1) colDpd = c;
      } else if (
        h.includes('tingkat') ||
        h.includes('badan') ||
        h.includes('sub org') ||
        h.includes('bagian') ||
        h.includes('seksi')
      ) {
        if (colSubOrg === -1) colSubOrg = c;
      } else if (h.includes('jabatan') || h.includes('posisi') || h.includes('kedudukan')) {
        if (colJabatan === -1) colJabatan = c;
      } else if (
        h.includes('nama') &&
        !h.includes('ibu') &&
        !h.includes('ayah') &&
        !h.includes('jabatan')
      ) {
        if (colNama === -1) colNama = c;
      } else if (h.includes('nik') || h.includes('ktp') || h.includes('no. identitas')) {
        if (colNik === -1) colNik = c;
      } else if (h.includes('kta') || h.includes('e-kta') || h.includes('anggota')) {
        if (colEkta === -1) colEkta = c;
      } else if (
        h.includes('gender') ||
        h.includes('kelamin') ||
        h.includes('jk') ||
        h.includes('sex')
      ) {
        if (colGender === -1) colGender = c;
      } else if (
        h.includes('telp') ||
        h.includes('hp') ||
        h.includes('telepon') ||
        h.includes('handphone') ||
        h.includes('wa')
      ) {
        if (colHp === -1) colHp = c;
      } else if (h.includes('email') || h.includes('surel') || h.includes('e-mail')) {
        if (colEmail === -1) colEmail = c;
      } else if (
        h.includes('alamat') ||
        h.includes('domisili') ||
        h.includes('tinggal') ||
        h.includes('desa') ||
        h.includes('kelurahan')
      ) {
        if (colAlamat === -1) colAlamat = c;
      }
    }

    if (colNama === -1 && colJabatan === -1) continue;

    let activeSectionSubOrg =
      defaultSubOrg ||
      (ctx.level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : ctx.level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : ctx.level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : 'DEWAN PIMPINAN RANTING');

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const allRowCells = row.map((c) => String(c || '').toLowerCase().trim());
      const rowCombined = allRowCells.join(' ');
      const rawNama = colNama !== -1 ? String(row[colNama] || '').trim() : '';

      if (!rawNama) {
        if (rowCombined.includes('pertimbangan') || rowCombined.includes('wankar')) {
          activeSectionSubOrg =
            ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
          continue;
        } else if (rowCombined.includes('pakar') || rowCombined.includes('wangan')) {
          activeSectionSubOrg =
            ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
          continue;
        } else if (
          rowCombined.includes('pimpinan') ||
          rowCombined.includes('dewan pimpinan daerah') ||
          rowCombined.includes('pengurus harian') ||
          rowCombined.includes('pengurus dpd')
        ) {
          activeSectionSubOrg =
            ctx.level === 'DPW'
              ? 'DEWAN PIMPINAN WILAYAH'
              : ctx.level === 'DPD'
              ? 'III. DEWAN PIMPINAN DAERAH'
              : 'III. DEWAN PIMPINAN CABANG';
          continue;
        } else if (
          rowCombined.includes('panduan') ||
          rowCombined.includes('petunjuk') ||
          rowCombined.includes('catatan') ||
          rowCombined.includes('legend')
        ) {
          continue;
        }
      }

      const noVal =
        colNo !== -1 ? Number(row[colNo]) || parsedRows.length + 1 : parsedRows.length + 1;
      let subOrgVal = colSubOrg !== -1 ? String(row[colSubOrg] || '').trim() : '';
      const jabatanVal = colJabatan !== -1 ? String(row[colJabatan] || '').trim() : '';
      const namaVal = rawNama;
      const isFilled =
        !!namaVal &&
        namaVal.trim() !== '' &&
        namaVal.trim() !== '-' &&
        namaVal.trim() !== '—' &&
        !namaVal.toLowerCase().includes('lowong') &&
        !namaVal.toLowerCase().includes('kosong');
      let nikVal = colNik !== -1 ? parseCleanIdString(row[colNik]) : '';
      const ektaVal = colEkta !== -1 ? parseCleanIdString(row[colEkta]) : '';
      const genderVal = colGender !== -1 ? String(row[colGender] || '').trim() : '';
      const hpVal = colHp !== -1 ? String(row[colHp] || '').trim() : '';
      const emailVal = colEmail !== -1 ? String(row[colEmail] || '').trim() : '';
      const alamatVal = colAlamat !== -1 ? String(row[colAlamat] || '').trim() : '';

      let rowDpd = territoryDpd;
      let rowLevel = ctx.level;
      let rowDpc = territoryDpc;
      let rowDprt = territoryDprt;

      if (ctx.level === 'DPD' && colDpd !== -1) {
        const rawRowDpd = String(row[colDpd] || '').trim();
        if (rawRowDpd) {
          const foundReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawRowDpd));
          if (foundReg) {
            rowDpd = foundReg.name;
          }
        }
      }

      if (!jabatanVal && !namaVal) continue;

      let finalSubOrg = '';
      const rawSubLower = (subOrgVal || '').toLowerCase();
      const jabLower = (jabatanVal || '').toLowerCase();

      if (rawSubLower.includes('pertimbangan') || rawSubLower.includes('wankar')) {
        finalSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
        activeSectionSubOrg = finalSubOrg;
      } else if (rawSubLower.includes('pakar') || rawSubLower.includes('wangan')) {
        finalSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
        activeSectionSubOrg = finalSubOrg;
      } else if (
        rawSubLower.includes('pimpinan') ||
        rawSubLower.includes('dpd') ||
        rawSubLower.includes('wilayah') ||
        rawSubLower.includes('cabang')
      ) {
        finalSubOrg =
          ctx.level === 'DPW'
            ? 'DEWAN PIMPINAN WILAYAH'
            : ctx.level === 'DPD'
            ? 'III. DEWAN PIMPINAN DAERAH'
            : 'III. DEWAN PIMPINAN CABANG';
        activeSectionSubOrg = finalSubOrg;
      } else if (jabLower.includes('pertimbangan') || jabLower.includes('wankar')) {
        finalSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      } else if (jabLower.includes('pakar') || jabLower.includes('wangan')) {
        finalSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      } else if (
        jabLower.includes('bidang') ||
        jabLower.includes('bid') ||
        jabLower.includes('wakil sekretaris') ||
        jabLower.includes('wasek') ||
        jabLower.includes('wakil bendahara') ||
        jabLower.includes('wabendum') ||
        jabLower.includes('wabend')
      ) {
        finalSubOrg =
          ctx.level === 'DPW'
            ? 'DEWAN PIMPINAN WILAYAH'
            : ctx.level === 'DPD'
            ? 'III. DEWAN PIMPINAN DAERAH'
            : 'III. DEWAN PIMPINAN CABANG';
        activeSectionSubOrg = finalSubOrg;
      } else {
        finalSubOrg = activeSectionSubOrg;
      }

      finalSubOrg = normalizeSubOrgName(finalSubOrg, rowLevel);

      let matchedSlot = undefined as any;
      let bestSlotScore = 0;
      for (const s of slots) {
        const isSameSub = normalizeSubOrgName(s.subOrg, rowLevel) === finalSubOrg;
        let score = calculateJobMatchScore(jabatanVal, s.jabatan, s.subOrg);
        if (isSameSub && score > 0) score += 5;
        if (score > bestSlotScore) {
          bestSlotScore = score;
          matchedSlot = s;
        }
      }

      if (!finalSubOrg && matchedSlot && matchedSlot.subOrg) {
        finalSubOrg = normalizeSubOrgName(matchedSlot.subOrg, rowLevel);
      }

      // Pertahankan nama jabatan asli dari berkas Excel tanpa menimpanya secara kaku
      const standardizedJabatan = jabatanVal || matchedSlot?.jabatan || 'Pengurus';

      const isMatched = rowLevel === 'DPRt' ? true : !!matchedSlot;
      if (isMatched) {
        matchedPositions++;
      } else if (jabatanVal) {
        customPositions++;
      }

      const rawExcelNik = nikVal;
      let nikWarningNote: string | undefined = undefined;

      if (isFilled) {
        filledCount++;

        const existingSlotMember = findSameTerritorySlotMember(
          expandedCurrentMembers,
          rowLevel,
          rowDpd,
          rowDpc,
          rowDprt,
          finalSubOrg,
          jabatanVal,
          namaVal
        );

        const hasValidExcelNik = isValidNik(nikVal) && !batchAssignedNiks.has(nikVal);

        if (hasValidExcelNik) {
          batchAssignedNiks.add(nikVal);
          allExistingNiks.add(nikVal);
          if (nikVal.length !== 16) {
            nikWarningNote = `⚠️ NIK ${nikVal.length} digit tetap disimpan (disarankan lengkapi jadi 16 digit KTP)`;
          }
        } else {
          if (rawExcelNik && !isValidNik(rawExcelNik)) {
            nikWarningNote = `⚠️ NIK Excel (${rawExcelNik.length} digit) terlalu pendek — memakai ID sementara`;
          }
          if (
            existingSlotMember &&
            isValidNik(existingSlotMember.nik) &&
            !isGeneratedNik(existingSlotMember.nik) &&
            !batchAssignedNiks.has(existingSlotMember.nik)
          ) {
            nikVal = existingSlotMember.nik;
            batchAssignedNiks.add(nikVal);
          } else {
            nikVal = generateUniqueTerritoryNik(
              rowDpd,
              finalSubOrg,
              parsedRows.length + 1,
              allExistingNiks,
              getTerritoryScopeKey(rowLevel, rowDpd, rowDpc, rowDprt)
            );
            batchAssignedNiks.add(nikVal);
          }
        }

        const memberId = buildTerritorialPositionId(
          nikVal,
          rowLevel,
          rowDpc,
          rowDprt,
          finalSubOrg
        );

        const existingMember = currentMembers.find((m) => m.nik === nikVal);

        const memberObj: Member = {
          ...stripMemberPositions(existingMember),
          id: memberId,
          nik: nikVal,
          nomorEKTA: ektaVal || existingMember?.nomorEKTA || makeGeneratedEkta(nikVal),
          namaLengkap: namaVal,
          email: emailVal || existingMember?.email || undefined,
          nomorHP: hpVal && hpVal !== '-' ? hpVal : existingMember?.nomorHP || '-',
          alamatLengkap: alamatVal || existingMember?.alamatLengkap || undefined,
          jenisKelamin:
            genderVal.toUpperCase().startsWith('L') || genderVal.toLowerCase().includes('laki')
              ? 'Laki-laki'
              : genderVal.toUpperCase().startsWith('P') || genderVal.toLowerCase().includes('perem')
              ? 'Perempuan'
              : existingMember?.jenisKelamin || undefined,
          dpd: rowDpd,
          dpc: rowDpc,
          dprt: rowDprt,
          isPengurus: true,
          tingkatKepengurusan: rowLevel,
          wilayahPenugasan: finalSubOrg,
          urutan: rowLevel === 'DPRt' ? noVal : nextUrutan(rowDpd, finalSubOrg),
          nomorSK:
            existingSlotMember?.nomorSK ||
            (rowLevel === 'DPRt'
              ? `SK-DPRT-${(rowDprt || 'DESA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`
              : `SK-${rowLevel}-${rowDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`),
          jabatan: standardizedJabatan,
          status: 'Aktif',
          statusKtpVerified: true,
          tanggalBergabung:
            existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
          terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
          diubahOleh: `${adminName} (Import Excel Teritorial)`,
        };

        membersToSave.push(memberObj);
      }

      parsedRows.push({
        no: noVal,
        dpd: rowDpd,
        subOrg: finalSubOrg,
        jabatanExcel: standardizedJabatan,
        jabatanMatched: matchedSlot?.jabatan,
        isMatched,
        namaLengkap: namaVal,
        nik: nikVal,
        nomorEKTA: ektaVal,
        jenisKelamin: genderVal,
        nomorHP: hpVal,
        email: emailVal,
        alamat: alamatVal,
        status: isFilled ? 'Lengkap' : 'Lowong',
        isFilled,
        isVacantSlot: false,
        aiNote: nikWarningNote,
      });
    }
  }

  let dpdPimpinanCompliance: DpdImportComplianceInfo | undefined = undefined;
  const pimpinanSlots = slots.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
  if (ctx.level === 'DPD') {
    const filledSlots: Array<{ no: number; jabatan: string; namaLengkap: string }> = [];
    const vacantSlots: Array<{ no: number; jabatan: string; subOrg: string }> = [];

    for (const slot of pimpinanSlots) {
      const row = parsedRows.find(
        (r) =>
          r.isFilled &&
          (isJobTitleMatch(r.jabatanMatched || r.jabatanExcel, slot.jabatan) || r.no === slot.no)
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

  const rawResult: ParseTerritoryExcelResult = {
    territoryContext: ctx,
    rows: parsedRows,
    membersToSave,
    stats: {
      totalRows: parsedRows.length,
      filledRows: filledCount,
      emptyRows: parsedRows.length - filledCount,
      matchedPositions,
      customPositions,
    },
    filename: file.name,
    dpdPimpinanCompliance,
  };

  // Otomatis selaraskan dengan susunan template baku sejak awal file diunggah
  const alignedCheck = alignAndCheckWithTemplate(rawResult, currentMembers, adminName);
  return {
    territoryContext: ctx,
    rows: alignedCheck.rows,
    membersToSave: alignedCheck.membersToSave,
    stats: {
      totalRows: alignedCheck.stats.totalRows,
      filledRows: alignedCheck.stats.filledRows,
      emptyRows: alignedCheck.stats.vacantSlotsCount,
      matchedPositions: alignedCheck.stats.matchedCount,
      customPositions: alignedCheck.stats.extraRowsCount,
    },
    filename: file.name,
    dpdPimpinanCompliance: alignedCheck.dpdPimpinanCompliance,
  };
}

