import { Member } from '../../../types';
import { SULUT_REGIONS } from '../../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getMemberSubOrgCategory,
} from '../../../utils/structureReadinessUtils';
import { getCouncilRank, getPimpinanRank } from '../../../utils/jobMatchingUtils';
import { getStructureTemplate } from '../../../data/structureTemplates';
import { GridRowItem } from '../../matrix';

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

export function getDefaultCity(activeLevel: string, activeDpd: string): string {
  if (activeLevel === 'DPW' || activeDpd === 'ALL') return 'Manado';
  const normDpd = (activeDpd || '').toUpperCase().trim();
  if (normDpd.includes('MINAHASA SELATAN')) return 'Amurang';
  if (normDpd.includes('MINAHASA UTARA')) return 'Airmadidi';
  if (normDpd.includes('MINAHASA TENGGARA')) return 'Ratahan';
  if (
    normDpd.includes('MINAHASA') &&
    !normDpd.includes('SELATAN') &&
    !normDpd.includes('UTARA') &&
    !normDpd.includes('TENGGARA')
  )
    return 'Tondano';
  if (normDpd.includes('BOLAANG MONGONDOW SELATAN')) return 'Molibagu';
  if (normDpd.includes('BOLAANG MONGONDOW TIMUR')) return 'Tutuyan';
  if (normDpd.includes('BOLAANG MONGONDOW UTARA')) return 'Boroko';
  if (normDpd.includes('BOLAANG MONGONDOW')) return 'Lolak';
  if (normDpd.includes('KOTAMOBAGU')) return 'Kotamobagu';
  if (normDpd.includes('BITUNG')) return 'Bitung';
  if (normDpd.includes('TOMOHON')) return 'Tomohon';
  if (normDpd.includes('SANGIHE')) return 'Tahuna';
  if (normDpd.includes('TALAUD')) return 'Melonguane';
  if (normDpd.includes('SIAU') || normDpd.includes('SITARO')) return 'Ondong';
  if (normDpd.includes('MANADO')) return 'Manado';
  return activeDpd.replace(/KABUPATEN|KOTA|KEPULAUAN/gi, '').trim() || 'Sulawesi Utara';
}

export function getDefaultSkNumber(
  activeLevel: string,
  activeDpd: string,
  activeDpc: string,
  activeDprt: string
): string {
  const year = new Date().getFullYear();
  if (activeLevel === 'DPW') return `SK-001/DPW-NASDEM/SULUT/${year}`;
  if (activeLevel === 'DPD') {
    const code = (activeDpd === 'ALL' ? 'SULUT' : activeDpd)
      .replace(/KABUPATEN|KOTA|KEPULAUAN|\s+/gi, '')
      .toUpperCase();
    return `SK-DPD-${code}/${year}`;
  }
  if (activeLevel === 'DPC') {
    const code = (activeDpc === 'ALL' ? 'ALL' : activeDpc).replace(/\s+/g, '').toUpperCase();
    return `SK-DPC-${code}/${year}`;
  }
  const code = (activeDprt === 'ALL' ? 'ALL' : activeDprt).replace(/\s+/g, '').toUpperCase();
  return `SK-DPRT-${code}/${year}`;
}

export function getTerritoryTitle(
  activeLevel: string,
  activeDpd: string,
  activeDpc: string,
  activeDprt: string
): string {
  if (activeLevel === 'DPW') return 'PROVINSI SULAWESI UTARA';
  if (activeLevel === 'DPD') {
    return activeDpd === 'ALL'
      ? 'SELURUH KABUPATEN / KOTA SE-SULAWESI UTARA'
      : `${activeDpd.toUpperCase()}`;
  }
  if (activeLevel === 'DPC') {
    return `${activeDpc === 'ALL' ? 'SELURUH KECAMATAN' : `KECAMATAN ${activeDpc.toUpperCase()}`} — ${
      activeDpd === 'ALL' ? 'SULAWESI UTARA' : activeDpd.toUpperCase()
    }`;
  }
  return `${
    activeDprt === 'ALL'
      ? 'SELURUH DESA / KELURAHAN'
      : `DESA/KELURAHAN ${activeDprt.toUpperCase()}`
  } — ${activeDpc === 'ALL' ? '' : `KEC. ${activeDpc.toUpperCase()} `}(${
    activeDpd === 'ALL' ? 'SULAWESI UTARA' : activeDpd.toUpperCase()
  })`;
}

export function getLevelText(activeLevel: string): string {
  if (activeLevel === 'DPW') return 'DEWAN PIMPINAN WILAYAH (DPW)';
  if (activeLevel === 'DPD') return 'DEWAN PIMPINAN DAERAH (DPD)';
  if (activeLevel === 'DPC') return 'DEWAN PIMPINAN CABANG (DPC)';
  return 'DEWAN PIMPINAN RANTING (DPRt)';
}

export function detectSignatories(rows: GridRowItem[]): {
  detectedKetua: { nama: string; kta: string };
  detectedSekretaris: { nama: string; kta: string };
} {
  const rowKetua = rows.find((r) => {
    const j = (r.jabatan || '').trim().toLowerCase();
    const sub = (r.subOrg || '').toLowerCase();
    const isKetuaJabatan =
      j === 'ketua' ||
      j.startsWith('ketua dpw') ||
      j.startsWith('ketua dpd') ||
      j.startsWith('ketua dpc') ||
      j.startsWith('ketua dprt');
    const isBukanWakil = !j.includes('wakil') && !j.includes('bidang') && !j.includes('biro');
    return (
      isKetuaJabatan &&
      isBukanWakil &&
      !sub.includes('pakar') &&
      !sub.includes('pertimbangan') &&
      r.namaLengkap.trim() !== ''
    );
  });

  const rowSekretaris = rows.find((r) => {
    const j = (r.jabatan || '').trim().toLowerCase();
    const sub = (r.subOrg || '').toLowerCase();
    const isSekretarisJabatan =
      j === 'sekretaris' ||
      j === 'sekertaris' ||
      j.startsWith('sekretaris dpw') ||
      j.startsWith('sekretaris dpd') ||
      j.startsWith('sekretaris dpc') ||
      j.startsWith('sekretaris dprt');
    const isBukanWakil = !j.includes('wakil');
    return (
      isSekretarisJabatan &&
      isBukanWakil &&
      !sub.includes('pakar') &&
      !sub.includes('pertimbangan') &&
      r.namaLengkap.trim() !== ''
    );
  });

  const ketuaKtaStr = rowKetua && rowKetua.namaLengkap.trim()
    ? isRealEkta(rowKetua.nomorEKTA)
      ? `No. e-KTA: ${rowKetua.nomorEKTA}`
      : isRealNik(rowKetua.nik)
      ? `NIK: ${rowKetua.nik}`
      : ''
    : '';

  const sekretarisKtaStr = rowSekretaris && rowSekretaris.namaLengkap.trim()
    ? isRealEkta(rowSekretaris.nomorEKTA)
      ? `No. e-KTA: ${rowSekretaris.nomorEKTA}`
      : isRealNik(rowSekretaris.nik)
      ? `NIK: ${rowSekretaris.nik}`
      : ''
    : '';

  return {
    detectedKetua: {
      nama: rowKetua ? rowKetua.namaLengkap.trim() : '',
      kta: ketuaKtaStr,
    },
    detectedSekretaris: {
      nama: rowSekretaris ? rowSekretaris.namaLengkap.trim() : '',
      kta: sekretarisKtaStr,
    },
  };
}

export function buildFallbackTerritorialRows(
  activeLevel: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  activeDpd: string,
  activeDpc: string,
  activeDprt: string,
  expandedMembers: Member[]
): GridRowItem[] {
  const tplSlots = getStructureTemplate(activeLevel);
  const filtered = expandedMembers
    .filter((m) => {
      if (activeLevel === 'DPW') {
        return m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara';
      }
      if (activeLevel === 'DPD') {
        return (
          m.tingkatKepengurusan === 'DPD' &&
          (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd))
        );
      }
      if (activeLevel === 'DPC') {
        return (
          m.tingkatKepengurusan === 'DPC' &&
          (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
          (activeDpc === 'ALL' || isDpcMatch(m.dpc, activeDpc))
        );
      }
      if (activeLevel === 'DPRt') {
        return (
          m.tingkatKepengurusan === 'DPRt' &&
          (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
          (activeDpc === 'ALL' || isDpcMatch(m.dpc, activeDpc)) &&
          (activeDprt === 'ALL' || isDprtMatch(m.dprt, activeDprt))
        );
      }
      return false;
    })
    .sort((a, b) => {
      const dpdComp = (a.dpd || '').localeCompare(b.dpd || '');
      if (dpdComp !== 0 && activeLevel !== 'DPW') return dpdComp;
      if (activeLevel === 'DPC' || activeLevel === 'DPRt') {
        const dpcComp = (a.dpc || '').localeCompare(b.dpc || '');
        if (dpcComp !== 0) return dpcComp;
      }
      if (activeLevel === 'DPRt') {
        const dprtComp = (a.dprt || '').localeCompare(b.dprt || '');
        if (dprtComp !== 0) return dprtComp;
      }
      const catOrder: Record<string, number> = { PERTIMBANGAN: 1, PAKAR: 2, PIMPINAN: 3 };
      const catA = catOrder[getMemberSubOrgCategory(a)] || 3;
      const catB = catOrder[getMemberSubOrgCategory(b)] || 3;
      if (catA !== catB) return catA - catB;

      if (catA === 1 || catA === 2) {
        return getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan);
      }
      return getPimpinanRank(a.jabatan, tplSlots) - getPimpinanRank(b.jabatan, tplSlots);
    });

  return filtered.map((m, i) => {
    const subCat = getMemberSubOrgCategory(m);
    let groupLabel = '';
    if (activeLevel === 'DPW') {
      groupLabel =
        subCat === 'PERTIMBANGAN'
          ? 'DEWAN PERTIMBANGAN WILAYAH'
          : subCat === 'PAKAR'
          ? 'DEWAN PAKAR WILAYAH'
          : 'DEWAN PIMPINAN WILAYAH';
    } else if (activeLevel === 'DPD') {
      const subName =
        subCat === 'PERTIMBANGAN'
          ? 'DEWAN PERTIMBANGAN DAERAH'
          : subCat === 'PAKAR'
          ? 'DEWAN PAKAR DAERAH'
          : 'DEWAN PIMPINAN DAERAH';
      groupLabel =
        activeDpd === 'ALL' ? `DPD ${(m.dpd || '').toUpperCase()} — ${subName}` : subName;
    } else if (activeLevel === 'DPC') {
      groupLabel =
        activeDpc === 'ALL'
          ? `DPC KECAMATAN ${(m.dpc || '-').toUpperCase()} (${m.dpd || '-'})`
          : subCat === 'PERTIMBANGAN'
          ? 'DEWAN PERTIMBANGAN CABANG'
          : subCat === 'PAKAR'
          ? 'DEWAN PAKAR CABANG'
          : 'DEWAN PIMPINAN CABANG';
    } else {
      groupLabel =
        activeDprt === 'ALL'
          ? `DPRt DESA/KEL. ${(m.dprt || '-').toUpperCase()} — KEC. ${(m.dpc || '-').toUpperCase()}`
          : 'DEWAN PIMPINAN RANTING';
    }

    return {
      id: m.id || `${m.nik}-${i}`,
      no: i + 1,
      subOrg: groupLabel,
      jabatan: m.jabatan || 'Pengurus',
      namaLengkap: m.namaLengkap || '',
      nik: m.nik || '',
      nomorEKTA: m.nomorEKTA || '',
      nomorHP: m.nomorHP || '',
      email: m.email || '',
      sosmed: m.sosmed || '',
      isExisting: true,
      fotoProfilUrl: m.fotoProfilUrl,
    };
  });
}

