import * as XLSX from 'xlsx';
import { Member, UserSession } from '../../types';
import { GridRowItem } from '../../components/matrix';
import { isAcceptableImportNik } from '../../utils/generatedIds';
import { generateUniqueTerritoryNik } from '../../utils/territorialExcelTemplateUtils';
import { cleanPersonName } from '../../utils/jobMatchingUtils';
import { isDpdMatch } from '../../utils/structureReadinessUtils';

export interface PrepareSaveParams {
  gridRows: GridRowItem[];
  members: Member[];
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  selectedDpd: string;
  selectedDpc: string;
  selectedDprt: string;
  session?: UserSession;
}

export interface PrepareSaveResult {
  updatedMembersList: Member[];
  updatedGridRows: GridRowItem[];
  niksToDelete: string[];
}

export function prepareDatabaseSavePayload({
  gridRows,
  members,
  level,
  selectedDpd,
  selectedDpc,
  selectedDprt,
  session,
}: PrepareSaveParams): PrepareSaveResult {
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

  // 1. Anggota yang dikosongkan namanya di slot (dan tidak lagi memegang slot lain di matriks ini) dialihkan jadi kader biasa
  gridRows.forEach((row, idx) => {
    if (row.originalNik && !row.namaLengkap.trim()) {
      const stillHasOtherSlot = gridRows.some(
        (other, oIdx) =>
          oIdx !== idx &&
          other.originalNik === row.originalNik &&
          other.namaLengkap.trim() !== ''
      );
      if (stillHasOtherSlot) return;

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
  const batchNameToNik = new Map<string, string>();

  // Pre-populate batchNameToNik dari baris yang sudah punya NIK valid
  gridRows.forEach((row) => {
    const nama = cleanPersonName(row.namaLengkap).toLowerCase();
    const nikClean = (row.nik || row.originalNik || '').replace(/[^0-9]/g, '').trim();
    if (nama && isAcceptableImportNik(nikClean)) {
      batchNameToNik.set(nama, nikClean);
    }
  });

  gridRows.forEach((row, idx) => {
    const nama = row.namaLengkap.trim();
    if (!nama) {
      updatedGridRows.push(row);
      return;
    }

    const normNama = cleanPersonName(nama).toLowerCase();
    const existingMember = members.find(
      (m) =>
        (row.originalNik && m.nik === row.originalNik) ||
        (row.nik && m.nik === row.nik.trim()) ||
        (normNama &&
          cleanPersonName(m.namaLengkap).toLowerCase() === normNama &&
          isDpdMatch(m.dpd, territoryDpd))
    );

    let nikClean = row.nik.replace(/[^0-9]/g, '').trim();
    const scopeKey =
      level === 'DPRt'
        ? `${territoryDpd}|${territoryDpc}|${territoryDprt}`
        : level === 'DPC'
        ? `${territoryDpd}|${territoryDpc}`
        : undefined;
    if (!isAcceptableImportNik(nikClean)) {
      if (normNama && batchNameToNik.has(normNama)) {
        nikClean = batchNameToNik.get(normNama)!;
      } else if (existingMember && isAcceptableImportNik(existingMember.nik)) {
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

    if (normNama && nikClean) {
      batchNameToNik.set(normNama, nikClean);
    }

    if (
      row.originalNik &&
      row.originalNik !== nikClean &&
      !gridRows.some((other, oIdx) => oIdx !== idx && other.originalNik === row.originalNik && other.namaLengkap.trim())
    ) {
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
    const memberId = `${nikClean}_${cleanT}_${cleanD}${cleanR}_${cleanS}_${cleanJ}`;

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
      urutan: row.no,
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

  return { updatedMembersList, updatedGridRows, niksToDelete };
}

export function exportMatrixToExcel(
  gridRows: GridRowItem[],
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  selectedDpd: string,
  selectedDpc: string,
  selectedDprt: string
): void {
  const territoryName =
    level === 'DPW'
      ? 'SULUT'
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
}

export function getTerritoryOfficialTitle(
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  selectedDpd: string,
  selectedDpc: string,
  selectedDprt: string
): { line1: string; line2: string } {
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
}

