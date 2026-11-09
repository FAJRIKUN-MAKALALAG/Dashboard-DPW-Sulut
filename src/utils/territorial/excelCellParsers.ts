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

export function buildTerritorialPositionId(
  nik: string,
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  dpc: string,
  dprt: string,
  subOrg: string
): string {
  const cleanT = (level || 'DPD').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanD = (dpc || 'UMUM').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanR =
    level === 'DPRt' ? `_${(dprt || 'DESA').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}` : '';
  const cleanS = (subOrg || 'PIMPINAN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return `${nik}_${cleanT}_${cleanD}${cleanR}_${cleanS}`;
}

export function getTerritoryScopeKey(
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  dpd: string,
  dpc: string,
  dprt: string
): string | undefined {
  if (level === 'DPRt') return `${dpd}|${dpc}|${dprt}`;
  if (level === 'DPC') return `${dpd}|${dpc}`;
  return undefined;
}

