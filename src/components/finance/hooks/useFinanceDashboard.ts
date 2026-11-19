import { useCallback, useEffect, useMemo, useState } from 'react';
import { FinanceService } from '../../../services';
import { FinanceLegislator, FinanceSummary } from '../../../types/finance';
import { getAvailableFinanceYears, getCurrentYearMonth } from '../financeHelpers';

export function useFinanceDashboard(showToast: (msg: string) => void) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    String(Math.max(2026, new Date().getFullYear()))
  );
  // '' = tampilkan keseluruhan tahun terpilih; YYYY-MM = drill-down ke 1 bulan di dalam tahun tsb
  const [focusedMonth, setFocusedMonth] = useState<string>('');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [legislators, setLegislators] = useState<FinanceLegislator[]>([]);
  const [daerahList, setDaerahList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, legRes] = await Promise.all([
        FinanceService.getSummary(selectedMonth, selectedYear),
        FinanceService.listLegislators({ month: selectedMonth }),
      ]);
      setSummary(sumRes);
      setLegislators(legRes.items);
      setDaerahList(legRes.daerahList);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memuat data keuangan DPW'}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, showToast]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const refreshAll = useCallback(async () => {
    await loadFinanceData();
    setRefreshKey((k) => k + 1);
  }, [loadFinanceData]);

  const handleChangeYear = useCallback(
    (newYear: string) => {
      setSelectedYear(newYear);
      // Setiap ganti tahun, langsung reset ke tampilan keseluruhan tahun tersebut
      setFocusedMonth('');

      if (newYear === '2024') {
        setSelectedMonth((prev) => (prev.startsWith('2024-') ? prev : '2024-12'));
      } else if (newYear === '2025') {
        setSelectedMonth((prev) => (prev.startsWith('2025-') ? prev : '2025-12'));
      } else if (newYear === 'ALL') {
        setSelectedMonth(getCurrentYearMonth());
      } else if (/^20\d{2}$/.test(newYear)) {
        const curYm = getCurrentYearMonth();
        setSelectedMonth((prev) =>
          prev.startsWith(`${newYear}-`)
            ? prev
            : curYm.startsWith(`${newYear}-`)
            ? curYm
            : `${newYear}-12`
        );
      }
    },
    []
  );

  const availableYears = useMemo(
    () =>
      summary?.availableYears && summary.availableYears.length > 0
        ? summary.availableYears
        : getAvailableFinanceYears(),
    [summary?.availableYears]
  );

  return {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear: handleChangeYear,
    handleChangeYear,
    focusedMonth,
    setFocusedMonth,
    availableYears,
    summary,
    legislators,
    daerahList,
    isLoading,
    refreshKey,
    refreshAll,
  };
}
