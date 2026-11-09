import { Member } from '../../types';
import { GridRowItem } from '../../components/matrix';

export function calculateDpdPimpinanCompliance(
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  selectedDpd: string,
  gridRows: GridRowItem[]
) {
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
}

