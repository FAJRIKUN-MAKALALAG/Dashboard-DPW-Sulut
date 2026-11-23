import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  LayoutGrid,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  Settings2,
  TableProperties,
  Wallet,
} from 'lucide-react';
import { FinanceService } from '../../services';
import { UserSession } from '../../types';
import { exportFinanceMonthlyReportExcel } from '../../utils/financeExportUtils';
import { FinanceCashbookTab } from './FinanceCashbookTab';
import { FinanceDppRemittanceTab } from './FinanceDppRemittanceTab';
import { FinanceExpensesTab } from './FinanceExpensesTab';
import { FinanceLegislatorsModal } from './FinanceLegislatorsModal';
import { FinanceMatrixTab } from './FinanceMatrixTab';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { formatMonthLabel } from './financeHelpers';
import { useFinanceDashboard } from './hooks/useFinanceDashboard';
import { PeriodKpiSummary } from './shared/PeriodKpiSummary';
import { YearFilterBar } from './shared/YearFilterBar';

interface FinancePageProps {
  session?: UserSession;
  showToast: (msg: string) => void;
}

type FinanceSubTab = 'matrix' | 'expenses' | 'remittance' | 'cashbook' | 'overview';

export const FinancePage: React.FC<FinancePageProps> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>('matrix');
  const [isMasterOpen, setIsMasterOpen] = useState(false);

  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
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
  } = useFinanceDashboard(showToast);

  const handleQuickExportMonthly = async () => {
    try {
      const yearParam = selectedYear !== 'ALL' ? selectedYear : undefined;
      const [bankRes, pettyRes] = await Promise.all([
        FinanceService.listTransactions({
          account: 'BANK_DPW',
          year: yearParam,
          sort: 'asc',
          limit: 1200,
        }),
        FinanceService.listTransactions({
          account: 'PETTY_CASH',
          year: yearParam,
          sort: 'asc',
          limit: 1200,
        }),
      ]);
      const exportLabel = selectedYear === 'ALL' ? 'Semua_Periode' : `Tahun_${selectedYear}`;
      exportFinanceMonthlyReportExcel(
        summary,
        [...bankRes.items, ...pettyRes.items],
        exportLabel,
        { bank: bankRes.openingBalance, petty: pettyRes.openingBalance }
      );
      showToast(`Laporan Excel 3-Sheet (${exportLabel.replace(/_/g, ' ')}) berhasil diunduh`);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal mengekspor laporan Excel'}`);
    }
  };

  const handleInspectMonth = (
    ym: string,
    targetTab: 'matrix' | 'expenses' | 'cashbook' = 'matrix'
  ) => {
    setFocusedMonth(ym);
    setActiveSubTab(targetTab);
  };

  const navTabs: Array<{
    id: FinanceSubTab;
    step: string;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'matrix',
      step: '1',
      label: 'Iuran DPW & DPP',
      hint: 'Matriks Tahunan & Rincian Bulan',
      icon: TableProperties,
    },
    {
      id: 'expenses',
      step: '2',
      label: 'Pengeluaran DPW',
      hint: 'Input Biaya & Riwayat DPW',
      icon: Receipt,
    },
    {
      id: 'remittance',
      step: '3',
      label: `Pengiriman ke DPP${summary && summary.balances.pendingDppCount > 0 ? ` (${summary.balances.pendingDppCount})` : ''}`,
      hint: 'Antrean Titipan & Batch',
      icon: Send,
    },
    {
      id: 'cashbook',
      step: '4',
      label: 'Buku Kas (Excel)',
      hint: 'Saldo Bank, Pemasukan & Ops',
      icon: BookOpen,
    },
    {
      id: 'overview',
      step: '5',
      label: 'Ringkasan & Rekonsiliasi',
      hint: 'Rekap Bulan, Tahun & Daerah',
      icon: LayoutGrid,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#002B49] via-[#1A3282] to-[#0F2460] text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              Bendahara &amp; Keuangan DPW
            </span>
            <span className="text-xs text-blue-200 font-mono">
              52 Fraksi Dewan · Buku {selectedYear === 'ALL' ? '2026–Berjalan' : `Tahun ${selectedYear}`}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-300" />
            <span>Pembukuan Iuran Fraksi, Setoran DPP &amp; Kas DPW Sulut</span>
          </h2>
          <p className="text-xs text-blue-100/85 max-w-2xl">
            Pilih Buku Tahun Pembukuan di bawah untuk melihat keseluruhan pencatatan setahun penuh, lalu klik bulan mana saja untuk cek rinciannya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMasterOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Settings2 className="w-4 h-4 text-amber-300" />
            <span>Master Fraksi, Tarif &amp; Autodebet</span>
          </button>

          <button
            type="button"
            onClick={handleQuickExportMonthly}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel ({selectedYear === 'ALL' ? 'Semua' : selectedYear})</span>
          </button>

          <button
            type="button"
            onClick={refreshAll}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 cursor-pointer"
            title="Muat Ulang Data Keuangan"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Top Bar Pemilih Buku Tahun Pembukuan */}
      <YearFilterBar
        label="Buku Tahun Pembukuan:"
        selectedYear={selectedYear}
        availableYears={availableYears}
        onChangeYear={handleChangeYear}
        subtitle={
          summary
            ? `Cakupan aktif: ${formatMonthLabel(summary.debtPeriod.from)} – ${formatMonthLabel(summary.debtPeriod.to)} · Terapkan ke semua tab`
            : undefined
        }
      />

      {/* 4 KPI Cards Total Setahun + Pembagian Per Bulan */}
      {summary && (
        <PeriodKpiSummary
          summary={summary}
          selectedYear={selectedYear}
          focusedMonth={focusedMonth}
          onSelectMonth={setFocusedMonth}
          onOpenExpenses={(ym) => {
            if (ym !== undefined) setFocusedMonth(ym);
            setActiveSubTab('expenses');
          }}
        />
      )}

      {/* Sub-Navigation 5 Tab Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className={`px-3.5 py-2.5 rounded-xl text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#1A3282] text-white shadow-sm'
                  : 'bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-white/15 text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-[#1A3282] dark:text-blue-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold block truncate">
                  {t.step}. {t.label}
                </span>
                <span
                  className={`text-[10.5px] block truncate ${
                    isActive ? 'text-blue-100/85' : 'text-slate-400'
                  }`}
                >
                  {t.hint}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {isLoading && !summary ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Memuat modul Keuangan DPW Sulut...</span>
        </div>
      ) : summary ? (
        <>
          {activeSubTab === 'matrix' && (
            <FinanceMatrixTab
              summary={summary}
              legislators={legislators}
              daerahList={daerahList}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              focusedMonth={focusedMonth}
              setFocusedMonth={setFocusedMonth}
              refreshKey={refreshKey}
              onRefreshAll={refreshAll}
              showToast={showToast}
            />
          )}
          {activeSubTab === 'expenses' && (
            <FinanceExpensesTab
              summary={summary}
              selectedYear={selectedYear}
              focusedMonth={focusedMonth}
              setFocusedMonth={setFocusedMonth}
              refreshKey={refreshKey}
              onRefreshAll={refreshAll}
              showToast={showToast}
            />
          )}
          {activeSubTab === 'cashbook' && (
            <FinanceCashbookTab
              summary={summary}
              selectedYear={selectedYear}
              focusedMonth={focusedMonth}
              setFocusedMonth={setFocusedMonth}
              refreshKey={refreshKey}
              onRefreshAll={refreshAll}
              showToast={showToast}
            />
          )}
          {activeSubTab === 'remittance' && (
            <FinanceDppRemittanceTab
              selectedYear={selectedYear}
              focusedMonth={focusedMonth}
              setFocusedMonth={setFocusedMonth}
              refreshKey={refreshKey}
              onRefreshSummary={refreshAll}
              showToast={showToast}
            />
          )}
          {activeSubTab === 'overview' && (
            <FinanceOverviewTab
              summary={summary}
              selectedYear={selectedYear}
              onChangeYear={handleChangeYear}
              onInspectMonth={handleInspectMonth}
              onGoToPayments={() => setActiveSubTab('matrix')}
              onGoToRemittance={() => setActiveSubTab('remittance')}
            />
          )}
        </>
      ) : null}

      {/* Master Legislators, Autodebet History & Tariff Rules Modal */}
      <FinanceLegislatorsModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        legislators={legislators}
        daerahList={daerahList}
        onRefresh={refreshAll}
        showToast={showToast}
      />
    </div>
  );
};
