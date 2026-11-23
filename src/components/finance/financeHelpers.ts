const MONTHS_ID = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatRupiah(amount?: number | null): string {
  const val = Number(amount || 0);
  const abs = Math.abs(val);
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return val < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatMonthLabel(ym?: string | null): string {
  if (!ym) return '-';
  const parts = String(ym).split('-');
  if (parts.length !== 2) return ym;
  const m = Number(parts[1]);
  if (!m || m < 1 || m > 12) return ym;
  return `${MONTHS_ID[m]} ${parts[0]}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateMonthOptions(startYm = '2026-01', extraForwardMonths = 3): Array<{ ym: string; label: string }> {
  const [sy, sm] = startYm.split('-').map(Number);
  const now = new Date();
  let endY = Math.max(now.getFullYear(), 2026);
  let endM = now.getMonth() + 1 + extraForwardMonths;
  while (endM > 12) {
    endM -= 12;
    endY += 1;
  }

  const out: Array<{ ym: string; label: string }> = [];
  let y = sy;
  let m = sm;
  while (y < endY || (y === endY && m <= endM)) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    out.push({ ym, label: formatMonthLabel(ym) });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function getAvailableFinanceYears(startYear = 2026): string[] {
  const maxYear = Math.max(2026, new Date().getFullYear());
  const years: string[] = [];
  for (let y = maxYear; y >= startYear; y -= 1) {
    years.push(String(y));
  }
  return years;
}

export function getMonthOptionsForYear(year: string): Array<{ ym: string; label: string }> {
  if (!year || year === 'ALL') {
    return generateMonthOptions('2026-01', 1).reverse();
  }
  const yNum = Number(year);
  if (!Number.isFinite(yNum) || yNum < 2026) {
    return generateMonthOptions('2026-01', 1).reverse();
  }
  const out: Array<{ ym: string; label: string }> = [];
  for (let m = 1; m <= 12; m += 1) {
    const ym = `${year}-${String(m).padStart(2, '0')}`;
    out.push({ ym, label: formatMonthLabel(ym) });
  }
  return out;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.onerror = () => resolve(String(reader.result || ''));
      img.src = String(reader.result || '');
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar bukti.'));
    reader.readAsDataURL(file);
  });
}

export const FINANCE_CATEGORIES = [
  'Gaji Staf & Satpam',
  'Listrik, Wifi & Utilitas',
  'Transport & Perjalanan',
  'Konsumsi & Perlengkapan Kantor',
  'Perawatan & Aset Kantor',
  'Operasional Kantor',
  'Biaya Admin & Pajak Bank',
  'Bunga Bank',
  'Pemasukan Lain-Lain',
  'Penyesuaian & Kewajiban Lain',
];

export type PaymentSplitMode = 'BOTH' | 'DPW_ONLY' | 'DPP_ONLY' | 'CUSTOM';

export const PAYMENT_MODE_OPTIONS: Array<{ id: PaymentSplitMode; label: string }> = [
  { id: 'BOTH', label: 'Gabungan DPW + DPP' },
  { id: 'DPW_ONLY', label: 'Porsi DPW Saja' },
  { id: 'DPP_ONLY', label: 'Porsi DPP Saja' },
  { id: 'CUSTOM', label: 'Nominal Custom' },
];

export function computeManualSplitPreview(
  tariffDpw: number,
  tariffDpp: number,
  monthCount: number,
  mode: PaymentSplitMode,
  customDpw: string,
  customDpp: string
): { dpw: number; dpp: number; total: number } {
  const n = Math.max(monthCount, 1);
  if (mode === 'CUSTOM') {
    const dpw = Math.max(0, Number(customDpw || 0));
    const dpp = Math.max(0, Number(customDpp || 0));
    return { dpw, dpp, total: dpw + dpp };
  }
  const dpw = mode === 'DPP_ONLY' ? 0 : tariffDpw * n;
  const dpp = mode === 'DPW_ONLY' ? 0 : tariffDpp * n;
  return { dpw, dpp, total: dpw + dpp };
}
