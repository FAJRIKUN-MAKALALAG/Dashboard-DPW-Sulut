import { Member } from '../../types';
import { getMemberSubOrgCategory } from '../../utils/structureReadinessUtils';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';
import { ExportScopeMode } from './executiveReportTypes';

export const isRealNik = (nik?: string): boolean => {
  if (!nik) return false;
  const clean = nik.trim();
  if (!clean || clean === '-') return false;
  if (/^7100\d{12}$/.test(clean)) return false;
  return true;
};

export const isRealEkta = (ekta?: string): boolean => {
  if (!ekta) return false;
  const clean = ekta.trim();
  if (!clean || clean === '-') return false;
  if (/^ND-(GEN|IMP|NEW|DPC|DPRT|DPW|DPD)/i.test(clean)) return false;
  return true;
};

export function getComputedDocTitle(
  docCustomTitle: string,
  exportScope: ExportScopeMode,
  filterDpd: string,
  filterDpc: string,
  filterDprt: string
): string {
  if (docCustomTitle.trim()) return docCustomTitle.trim();

  if (exportScope === 'STATISTICS') {
    return 'LAPORAN REKAPITULASI DATA KADER & KEPENGURUSAN 15 DPD';
  }
  if (exportScope === 'DPW') {
    return 'SUSUNAN PENGURUS DEWAN PIMPINAN WILAYAH (DPW) PARTAI NASDEM';
  }
  if (exportScope === 'DPD') {
    return `SUSUNAN PENGURUS DEWAN PIMPINAN DAERAH (DPD) ${
      filterDpd === 'ALL' ? 'SE-SULAWESI UTARA' : filterDpd.toUpperCase()
    }`;
  }
  if (exportScope === 'DPC') {
    return `SUSUNAN PENGURUS DEWAN PIMPINAN CABANG (DPC) ${
      filterDpc !== 'ALL'
        ? `KECAMATAN ${filterDpc.toUpperCase()}`
        : filterDpd !== 'ALL'
        ? filterDpd.toUpperCase()
        : 'SE-SULAWESI UTARA'
    }`;
  }
  if (exportScope === 'DPRt') {
    return `SUSUNAN PENGURUS DEWAN PIMPINAN RANTING (DPRt) ${
      filterDprt !== 'ALL'
        ? `DESA/KEL. ${filterDprt.toUpperCase()}`
        : filterDpc !== 'ALL'
        ? `KECAMATAN ${filterDpc.toUpperCase()}`
        : filterDpd !== 'ALL'
        ? filterDpd.toUpperCase()
        : 'SE-SULAWESI UTARA'
    }`;
  }
  return `BUKU INDUK DATABASE ANGGOTA & KADER PARTAI NASDEM ${
    filterDpd === 'ALL' ? 'PROVINSI SULAWESI UTARA' : filterDpd.toUpperCase()
  }`;
}

export function getComputedDocSubtitle(
  exportScope: ExportScopeMode,
  filterDpd: string,
  filterDpc: string,
  filterDprt: string,
  printedNominativeCount: number
): string {
  if (exportScope === 'STATISTICS') {
    return 'Provinsi Sulawesi Utara • Data Keterisian Struktur & Keaktifan Kader';
  }
  if (exportScope === 'DPW') {
    return `Provinsi Sulawesi Utara • Total Tercetak: ${printedNominativeCount} Pengurus`;
  }
  return `Wilayah: ${filterDpd === 'ALL' ? 'Seluruh Sulawesi Utara (15 DPD)' : filterDpd}${
    filterDpc !== 'ALL' ? ` • Kec. ${filterDpc}` : ''
  }${filterDprt !== 'ALL' ? ` • Desa/Kel. ${filterDprt}` : ''} • Total Tercetak: ${printedNominativeCount} Orang`;
}

export function detectSignatoriesForExecutiveReport(
  exportScope: ExportScopeMode,
  filterDpd: string,
  filterDpc: string,
  filterDprt: string,
  expandedMembers: Member[]
): {
  city: string;
  leftTitle: string;
  rightTitle: string;
  ketua: Member | undefined;
  sekretaris: Member | undefined;
} {
  let defaultCity = 'Manado';
  let defaultLeft = 'SEKRETARIS DPW PARTAI NASDEM SULUT';
  let defaultRight = 'KETUA DPW PARTAI NASDEM SULUT';
  let targetLevel = 'DPW';

  if (exportScope === 'DPD' || exportScope === 'ALL_KADER') {
    if (filterDpd !== 'ALL') {
      const norm = filterDpd.toUpperCase();
      if (norm.includes('MINAHASA SELATAN')) defaultCity = 'Amurang';
      else if (norm.includes('MINAHASA UTARA')) defaultCity = 'Airmadidi';
      else if (norm.includes('MINAHASA TENGGARA')) defaultCity = 'Ratahan';
      else if (norm.includes('MINAHASA')) defaultCity = 'Tondano';
      else if (norm.includes('BOLAANG MONGONDOW UTARA')) defaultCity = 'Boroko';
      else if (norm.includes('BOLAANG MONGONDOW TIMUR')) defaultCity = 'Tutuyan';
      else if (norm.includes('BOLAANG MONGONDOW SELATAN')) defaultCity = 'Molibagu';
      else if (norm.includes('BOLAANG MONGONDOW')) defaultCity = 'Lolak';
      else if (norm.includes('KOTAMOBAGU')) defaultCity = 'Kotamobagu';
      else if (norm.includes('BITUNG')) defaultCity = 'Bitung';
      else if (norm.includes('TOMOHON')) defaultCity = 'Tomohon';
      else if (norm.includes('SANGIHE')) defaultCity = 'Tahuna';
      else if (norm.includes('TALAUD')) defaultCity = 'Melonguane';
      else if (norm.includes('SIAU') || norm.includes('SITARO')) defaultCity = 'Ondong';
      else defaultCity = 'Manado';

      defaultLeft = `SEKRETARIS DPD ${filterDpd.toUpperCase()}`;
      defaultRight = `KETUA DPD ${filterDpd.toUpperCase()}`;
      targetLevel = 'DPD';
    }
  } else if (exportScope === 'DPC') {
    defaultLeft = `SEKRETARIS DPC ${
      filterDpc !== 'ALL' ? `KEC. ${filterDpc.toUpperCase()}` : 'KECAMATAN'
    }`;
    defaultRight = `KETUA DPC ${
      filterDpc !== 'ALL' ? `KEC. ${filterDpc.toUpperCase()}` : 'KECAMATAN'
    }`;
    targetLevel = 'DPC';
  } else if (exportScope === 'DPRt') {
    defaultLeft = `SEKRETARIS DPRt ${
      filterDprt !== 'ALL' ? `DESA/KEL. ${filterDprt.toUpperCase()}` : 'RANTING'
    }`;
    defaultRight = `KETUA DPRt ${
      filterDprt !== 'ALL' ? `DESA/KEL. ${filterDprt.toUpperCase()}` : 'RANTING'
    }`;
    targetLevel = 'DPRt';
  }

  const candidates = expandedMembers.filter((m) => {
    if (m.status !== 'Aktif') return false;
    if (targetLevel === 'DPW') {
      return m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara';
    }
    if (targetLevel === 'DPD') {
      return (
        m.tingkatKepengurusan === 'DPD' && (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd))
      );
    }
    if (targetLevel === 'DPC') {
      return (
        m.tingkatKepengurusan === 'DPC' &&
        (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd)) &&
        (filterDpc === 'ALL' || isDpcMatch(m.dpc, filterDpc))
      );
    }
    if (targetLevel === 'DPRt') {
      return (
        m.tingkatKepengurusan === 'DPRt' &&
        (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd)) &&
        (filterDpc === 'ALL' || isDpcMatch(m.dpc, filterDpc)) &&
        (filterDprt === 'ALL' || isDprtMatch(m.dprt, filterDprt))
      );
    }
    return false;
  });

  const foundKetua = candidates.find((m) => {
    const j = (m.jabatan || '').toUpperCase().trim();
    const subCat = getMemberSubOrgCategory(m);
    return (
      subCat === 'PIMPINAN' &&
      (j === 'KETUA' ||
        j === 'KETUA DPW' ||
        j === 'KETUA DPD' ||
        j === 'KETUA DPC' ||
        j === 'KETUA DPRT' ||
        (j.startsWith('KETUA') && !j.includes('WAKIL') && !j.includes('BIDANG') && !j.includes('BIRO')))
    );
  });

  const foundSekretaris = candidates.find((m) => {
    const j = (m.jabatan || '').toUpperCase().trim();
    const subCat = getMemberSubOrgCategory(m);
    return (
      subCat === 'PIMPINAN' &&
      (j === 'SEKRETARIS' ||
        j === 'SEKERTARIS' ||
        j === 'SEKRETARIS DPW' ||
        j === 'SEKRETARIS DPD' ||
        j === 'SEKRETARIS DPC' ||
        j === 'SEKRETARIS DPRT' ||
        ((j.startsWith('SEKRETARIS') || j.startsWith('SEKERTARIS')) && !j.includes('WAKIL')))
    );
  });

  return {
    city: defaultCity,
    leftTitle: defaultLeft,
    rightTitle: defaultRight,
    ketua: foundKetua,
    sekretaris: foundSekretaris,
  };
}

