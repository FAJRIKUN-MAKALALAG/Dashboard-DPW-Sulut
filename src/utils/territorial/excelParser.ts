import XLSX from 'xlsx-js-style';
import { Member } from '../../types';
import { getStructureTemplate } from '../../data/structureTemplates';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
} from '../structureReadinessUtils';
import {
  isJobTitleMatch,
  normalizeSubOrgName,
  isDefinitiveLeader,
  assignItemsToTemplateSlots,
  calculateJobMatchScore,
} from '../jobMatchingUtils';
import { makeGeneratedEkta, isGeneratedNik } from '../generatedIds';

/**
 * Parsing aman untuk nilai sel ID/NIK/e-KTA Excel.
 * Menangani angka ilmiah (contoh: 7,10502E+14 atau 2,03548E+14) dengan pemisah koma/titik.
 */
export function parseCleanIdString(cell: any): string {
  if (cell === undefined || cell === null) return '';
  if (typeof cell === 'number') {
    return Math.round(cell).toLocaleString('fullwide', { useGrouping: false });
  }
  const str = String(cell).trim();
  if (/[eE][+-]?\d+/.test(str)) {
    const normalizedStr = str.replace(',', '.');
    const num = Number(normalizedStr);
    if (!isNaN(num) && isFinite(num)) {
      return Math.round(num).toLocaleString('fullwide', { useGrouping: false });
    }
  }
  return str.replace(/[^0-9]/g, '');
}
import {
  TerritoryContext,
  ParsedTerritoryRow,
  DpdImportComplianceInfo,
  ParseTerritoryExcelResult,
  AiTemplateCheckResult,
} from './excelTypes';
import { generateUniqueTerritoryNik } from './excelTemplateGenerators';

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

  const isValidNik = (nik?: string): boolean => {
    if (!nik) return false;
    const clean = String(nik).replace(/[^0-9]/g, '');
    if (clean.length !== 16) return false;
    if (/^0{6,}/.test(clean)) return false;
    return true;
  };

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
          firstCell.includes('formulir') ||
          firstCell.includes('panduan') ||
          firstCell.includes('petunjuk') ||
          firstCell.includes('wilayah:') ||
          firstCell.includes('partai') ||
          firstCell.includes('dewan pimpinan')
        ) {
          continue;
        }

        const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
        const hasJabatan = rowLower.some(
          (c) =>
            c.length < 50 &&
            (c.includes('jabatan') ||
              c.includes('posisi') ||
              c.includes('tugas') ||
              c.includes('struktur') ||
              c.includes('peran'))
        );
        const hasNama = rowLower.some(
          (c) =>
            c.length < 50 &&
            !c.includes('jabatan') &&
            !c.includes('posisi') &&
            (c.includes('nama') ||
              c.includes('kader') ||
              c.includes('person') ||
              c.includes('lengkap'))
        );
        const hasNik = rowLower.some((c) => {
          const clean = c.replace(/[^a-z0-9]/g, '');
          return !c.includes('nama') && (clean.includes('nik') || c.includes('ktp'));
        });
        if ((hasJabatan && hasNama) || (hasNama && hasNik) || (hasJabatan && hasNik)) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      for (let i = 0; i < Math.min(6, rawData.length); i++) {
        const row = rawData[i] || [];
        const c0 = String(row[0] || '').toLowerCase().trim();
        const c1 = String(row[1] || '').toLowerCase().trim();
        const c2 = String(row[2] || '').toLowerCase().trim();
        const isPos = (s: string) =>
          s.includes('ketua') ||
          s.includes('sekretaris') ||
          s.includes('bendahara') ||
          s.includes('anggota') ||
          s.includes('wakil');
        if (isPos(c0) || isPos(c1) || isPos(c2)) {
          headerRowIdx = i - 1;
          if (isPos(c0)) {
            colJabatan = 0;
            colNama = 1;
          } else if (isPos(c1)) {
            colJabatan = 1;
            colNama = 2;
          } else {
            colSubOrg = 1;
            colJabatan = 2;
            colNama = 3;
          }
          break;
        }
      }
    }

    if (headerRowIdx === -1 && rawData.length > 0) {
      headerRowIdx = 0;
    }

    if (headerRowIdx !== -1 && (colJabatan === -1 || colNama === -1)) {
      const headers = (rawData[headerRowIdx] || []).map((h) =>
        String(h || '').toLowerCase().trim()
      );

      colNo = headers.findIndex((h) => {
        const clean = h.replace(/[^a-z0-9]/g, '');
        return clean === 'no' || clean === 'nomor' || h === '#';
      });
      colDpd = headers.findIndex(
        (h) =>
          (h === 'dpd' ||
            h.includes('kabupaten') ||
            h.includes('kota') ||
            h.includes('nama dpd')) &&
          !h.includes('sub') &&
          !h.includes('organisasi')
      );
      colSubOrg = headers.findIndex(
        (h) =>
          (h.includes('sub organisasi') ||
            h.includes('sub_organisasi') ||
            h.includes('sub') ||
            h.includes('organisasi') ||
            h.includes('dewan') ||
            h.includes('divisi') ||
            h.includes('bidang')) &&
          !h.includes('jabatan') &&
          !h.includes('nama')
      );
      colJabatan = headers.findIndex(
        (h) =>
          (h.includes('jabatan') ||
            h.includes('posisi') ||
            h.includes('tugas') ||
            h.includes('struktur') ||
            h.includes('peran')) &&
          !h.includes('sub')
      );
      colNama = headers.findIndex(
        (h) =>
          (h.includes('nama') ||
            h.includes('kader') ||
            h.includes('person') ||
            h.includes('lengkap')) &&
          !h.includes('jabatan') &&
          !h.includes('posisi') &&
          !h.replace(/[^a-z0-9]/g, '').includes('nik')
      );
      colNik = headers.findIndex((h) => {
        if (h.includes('nama') || h.includes('name')) return false;
        const clean = h.replace(/[^a-z0-9]/g, '');
        return clean.includes('nik') || h.includes('ktp');
      });
      colEkta = headers.findIndex((h) => {
        if (h.includes('kontak') || h.includes('nama') || h.includes('nik')) return false;
        const clean = h.replace(/[^a-z0-9]/g, '');
        return clean.includes('kta') || clean.includes('ekta');
      });
      colGender = headers.findIndex(
        (h) => h.includes('kelamin') || h.includes('gender') || h === 'jk' || h === 'sex'
      );
      colHp = headers.findIndex(
        (h) =>
          h.includes('hp') ||
          h.includes('wa') ||
          h.includes('telepon') ||
          h.includes('whatsapp') ||
          h.includes('kontak') ||
          h.includes('telp')
      );
      colEmail = headers.findIndex(
        (h) => h.includes('email') || h.includes('surel') || h.includes('mail')
      );
      colAlamat = headers.findIndex((h) => h.includes('alamat') || h.includes('domisili'));

      if (colJabatan === -1) colJabatan = colSubOrg !== -1 ? 2 : 1;
      if (colNama === -1) colNama = colJabatan === 1 ? 2 : 3;
    }

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

      if (isFilled) {
        filledCount++;

        const existingSlotMember = currentMembers.find(
          (m) =>
            isDpdMatch(m.dpd, rowDpd) &&
            (rowLevel !== 'DPC' || isDpcMatch(m.dpc, rowDpc)) &&
            (m.wilayahPenugasan || '').trim().toLowerCase() === finalSubOrg.trim().toLowerCase() &&
            isJobTitleMatch(m.jabatan, jabatanVal)
        );

        const hasValidExcelNik = isValidNik(nikVal) && !batchAssignedNiks.has(nikVal);

        if (hasValidExcelNik) {
          batchAssignedNiks.add(nikVal);
          allExistingNiks.add(nikVal);
        } else {
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
              allExistingNiks
            );
            batchAssignedNiks.add(nikVal);
          }
        }

        const cleanT = (rowLevel || 'DPD').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const cleanD = (rowDpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const cleanS = (finalSubOrg || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const memberId = `${nikVal}_${cleanT}_${cleanD}_${cleanS}`;

        const existingMember =
          existingSlotMember ||
          currentMembers.find(
            (m) => m.id === memberId || (m.nik === nikVal && m.tingkatKepengurusan === rowLevel)
          );

        const memberObj: Member = {
          ...(existingMember || {}),
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
              : existingMember?.jenisKelamin || 'Laki-laki',
          dpd: rowDpd,
          dpc: rowDpc,
          dprt: rowDprt,
          isPengurus: true,
          tingkatKepengurusan: rowLevel,
          wilayahPenugasan: finalSubOrg,
          urutan: rowLevel === 'DPRt' ? noVal : nextUrutan(rowDpd, finalSubOrg),
          nomorSK:
            existingMember?.nomorSK ||
            `SK-${rowLevel}-${rowDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
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

  // KHUSUS DPRt: DIRECT PASSTHROUGH (Salin langsung 1-to-1 data riil dari berkas Excel)
  if (ctx.level === 'DPRt') {
    const alignedRows: ParsedTerritoryRow[] = [];
    const membersToSave: Member[] = [];
    const allExistingNiks = new Set<string>(currentMembers.map((m) => m.nik));

    // Urutkan pengurus DPRt: Ketua definitif nomor 1, selanjutnya nomor urut sesuai berkas
    const sortedDprtRows = [...currentResult.rows].sort((a, b) => {
      const isLeaderA = isDefinitiveLeader(a.jabatanExcel);
      const isLeaderB = isDefinitiveLeader(b.jabatanExcel);
      if (isLeaderA && !isLeaderB) return -1;
      if (!isLeaderA && isLeaderB) return 1;
      return (a.no || 0) - (b.no || 0);
    });

    sortedDprtRows.forEach((r, idx) => {
      const rowNo = idx + 1;
      const finalSubOrg = 'DEWAN PIMPINAN RANTING';
      let nik = r.nik;
      if (!nik || nik.length < 10) {
        nik = generateUniqueTerritoryNik(territoryDpd, finalSubOrg, rowNo, allExistingNiks);
      }
      allExistingNiks.add(nik);

      alignedRows.push({
        ...r,
        no: rowNo,
        subOrg: finalSubOrg,
        jabatanExcel: r.jabatanExcel || 'Pengurus',
        jabatanMatched: r.jabatanExcel || 'Pengurus',
        isMatched: true,
        aiNote: isDefinitiveLeader(r.jabatanExcel)
          ? `⭐ Ketua DPRt (Definitif #1)`
          : `✓ Jabatan DPRt #${rowNo} (${r.jabatanExcel})`,
      });

      if (r.isFilled) {
        const cleanT = 'DPRT';
        const cleanD = (territoryDpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const cleanS = 'DEWAN_PIMPINAN_RANTING';
        const memberId = `${nik}_${cleanT}_${cleanD}_${cleanS}`;

        const existingMember = currentMembers.find(
          (m) => m.id === memberId || (m.nik === nik && m.tingkatKepengurusan === 'DPRt')
        );

        membersToSave.push({
          ...(existingMember || {}),
          id: memberId,
          nik,
          nomorEKTA: r.nomorEKTA || existingMember?.nomorEKTA || makeGeneratedEkta(nik),
          namaLengkap: r.namaLengkap,
          email: r.email || existingMember?.email || undefined,
          nomorHP: r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : existingMember?.nomorHP || '-',
          alamatLengkap: r.alamat || existingMember?.alamatLengkap || undefined,
          jenisKelamin:
            r.jenisKelamin?.toUpperCase().startsWith('P') ||
            r.jenisKelamin?.toLowerCase().includes('perem')
              ? 'Perempuan'
              : 'Laki-laki',
          dpd: territoryDpd,
          dpc: territoryDpc,
          dprt: territoryDprt,
          isPengurus: true,
          tingkatKepengurusan: 'DPRt',
          wilayahPenugasan: finalSubOrg,
          urutan: rowNo,
          nomorSK:
            existingMember?.nomorSK ||
            `SK-DPRT-${(territoryDprt || 'DESA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
          jabatan: r.jabatanExcel || 'Pengurus',
          status: 'Aktif',
          statusKtpVerified: true,
          tanggalBergabung:
            existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
          terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
          diubahOleh: `${adminName} (Direct Passthrough DPRt)`,
        });
      }
    });

    return {
      success: true,
      rows: alignedRows,
      membersToSave,
      stats: {
        totalRows: alignedRows.length,
        filledRows: alignedRows.filter((r) => r.isFilled).length,
        vacantSlotsCount: 0,
        standardSlotsTarget: alignedRows.length,
        extraRowsCount: 0,
        pertimbanganCount: 0,
        pakarCount: 0,
        pimpinanCount: alignedRows.length,
        matchedCount: alignedRows.length,
      },
      message: `Pemeriksaan selesai. Ditemukan ${alignedRows.length} susunan pengurus DPRt.`,
    };
  }

  const pertimbanganRows: ParsedTerritoryRow[] = [];
  const pakarRows: ParsedTerritoryRow[] = [];
  const pimpinanRows: ParsedTerritoryRow[] = [];

  for (const row of currentResult.rows) {
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
      alignedPimpinanRows.push({
        ...r,
        no: slot.no,
        subOrg: normalizeSubOrgName(slot.subOrg, ctx.level),
        jabatanExcel: r.jabatanExcel || slot.jabatan,
        jabatanMatched: slot.jabatan,
        isMatched: true,
        aiNote: `✓ Sesuai Slot Template #${slot.no} (${slot.jabatan})`,
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
  const newMembersToSave: Member[] = [];

  const isValidNikHelper = (nik?: string): boolean => {
    if (!nik) return false;
    const clean = String(nik).replace(/[^0-9]/g, '');
    if (clean.length !== 16) return false;
    if (/^0{6,}/.test(clean)) return false;
    return true;
  };

  for (const r of finalRows) {
    if (!r.isFilled || !r.namaLengkap || r.namaLengkap === '-' || r.isVacantSlot) {
      continue;
    }

    let nikVal = r.nik;
    const existingSlotMember = currentMembers.find(
      (m) =>
        isDpdMatch(m.dpd, r.dpd || territoryDpd) &&
        (ctx.level !== 'DPC' || isDpcMatch(m.dpc, territoryDpc)) &&
        (m.wilayahPenugasan || '').trim().toLowerCase() === r.subOrg.trim().toLowerCase() &&
        isJobTitleMatch(m.jabatan, r.jabatanExcel)
    );

    const hasValidExcelNik = isValidNikHelper(nikVal) && !batchAssignedNiksHelper.has(nikVal);

    if (hasValidExcelNik) {
      batchAssignedNiksHelper.add(nikVal);
      allExistingNiksHelper.add(nikVal);
    } else {
      if (
        existingSlotMember &&
        isValidNikHelper(existingSlotMember.nik) &&
        !isGeneratedNik(existingSlotMember.nik) &&
        !batchAssignedNiksHelper.has(existingSlotMember.nik)
      ) {
        nikVal = existingSlotMember.nik;
        batchAssignedNiksHelper.add(nikVal);
      } else {
        nikVal = generateUniqueTerritoryNik(
          r.dpd || territoryDpd,
          r.subOrg,
          r.no,
          allExistingNiksHelper
        );
        batchAssignedNiksHelper.add(nikVal);
      }
    }

    const cleanT = (ctx.level || 'DPD').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanD = (territoryDpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanS = (r.subOrg || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const memberId = `${nikVal}_${cleanT}_${cleanD}_${cleanS}`;

    const existingMember =
      existingSlotMember ||
      currentMembers.find(
        (m) => m.id === memberId || (m.nik === nikVal && m.tingkatKepengurusan === ctx.level)
      );

    const memberObj: Member = {
      ...(existingMember || {}),
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
          : existingMember?.jenisKelamin || 'Laki-laki',
      dpd: territoryDpd,
      dpc: territoryDpc,
      dprt: territoryDprt,
      isPengurus: true,
      tingkatKepengurusan: ctx.level,
      wilayahPenugasan: r.subOrg,
      urutan: r.no,
      nomorSK:
        existingMember?.nomorSK ||
        `SK-${ctx.level}-${territoryDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
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
