import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { FinanceMatrixLegislatorRow } from '../../../types/finance';
import { exportReconciliationStatusExcel } from '../../../utils/financeExportUtils';
import { formatMonthLabel, formatRupiah } from '../financeHelpers';

export interface ReconciliationUnpaidMonth {
  ym: string;
  label: string;
  target: number;
  paid: number;
  shortfall: number;
  isPartial: boolean;
}

export interface ReconciliationPaidMonth {
  ym: string;
  label: string;
  paid: number;
  method: 'AUTODEBET' | 'MANUAL' | null;
}

export interface ReconciliationMemberItem {
  legislator: FinanceMatrixLegislatorRow;
  displayBilled: number;
  displayPaid: number;
  displayManual: number;
  displayAuto: number;
  displayDebt: number;
  displayDelta: number;
  unpaidMonths: ReconciliationUnpaidMonth[];
  paidMonths: ReconciliationPaidMonth[];
}

interface ReconciliationStatusModalProps {
  isOpen: boolean;
  initialTab: 'ALL' | 'DEBT' | 'PAID';
  kind: 'DPW' | 'DPP';
  scopeLabel: string;
  items: ReconciliationMemberItem[];
  onClose: () => void;
  onSelectCell: (legislator: FinanceMatrixLegislatorRow, periodMonth: string) => void;
}

type SortKey = 'debt_desc' | 'unpaid_count_desc' | 'region' | 'name_asc';

function getMethodBadgeInfo(leg: FinanceMatrixLegislatorRow): {
  label: string;
  short: string;
  className: string;
} {
  if (leg.isAutodebetActive) {
    return {
      label: `Autodebet sejak ${formatMonthLabel(leg.autodebetStartMonth)}`,
      short: 'Autodebet',
      className: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300',
    };
  }
  if (leg.autodebetEndMonth) {
    return {
      label: `Eks-AD (${formatMonthLabel(leg.autodebetStartMonth)}–${formatMonthLabel(leg.autodebetEndMonth)})`,
      short: 'Eks-AD (Manual)',
      className: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300',
    };
  }
  return {
    label: 'Setoran Manual',
    short: 'Manual',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  };
}

export const ReconciliationStatusModal: React.FC<ReconciliationStatusModalProps> = ({
  isOpen,
  initialTab,
  kind,
  scopeLabel,
  items,
  onClose,
  onSelectCell,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DEBT' | 'PAID'>(initialTab);
  const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'PROVINSI' | 'KAB_KOTA'>('ALL');
  const [daerahFilter, setDaerahFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('debt_desc');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const daerahOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.legislator.daerah);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const tabStats = useMemo(() => {
    let debtCount = 0;
    let paidCount = 0;
    let totalDebt = 0;
    let totalPaidLunas = 0;
    for (const it of items) {
      if (it.displayDebt > 0) {
        debtCount += 1;
        totalDebt += it.displayDebt;
      } else {
        paidCount += 1;
        totalPaidLunas += it.displayPaid;
      }
    }
    return { debtCount, paidCount, totalDebt, totalPaidLunas };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((it) => {
      if (activeTab === 'DEBT' && it.displayDebt <= 0) return false;
      if (activeTab === 'PAID' && it.displayDebt > 0) return false;
      if (tingkatFilter !== 'ALL' && it.legislator.tingkat !== tingkatFilter) return false;
      if (daerahFilter !== 'ALL' && it.legislator.daerah !== daerahFilter) return false;
      if (
        q &&
        !it.legislator.namaLengkap.toLowerCase().includes(q) &&
        !it.legislator.daerah.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'debt_desc') {
        if (b.displayDebt !== a.displayDebt) return b.displayDebt - a.displayDebt;
        if (b.unpaidMonths.length !== a.unpaidMonths.length) {
          return b.unpaidMonths.length - a.unpaidMonths.length;
        }
        return a.legislator.namaLengkap.localeCompare(b.legislator.namaLengkap);
      }
      if (sortBy === 'unpaid_count_desc') {
        if (b.unpaidMonths.length !== a.unpaidMonths.length) {
          return b.unpaidMonths.length - a.unpaidMonths.length;
        }
        return b.displayDebt - a.displayDebt;
      }
      if (sortBy === 'region') {
        if (a.legislator.tingkat !== b.legislator.tingkat) {
          return a.legislator.tingkat === 'PROVINSI' ? -1 : 1;
        }
        const dCmp = a.legislator.daerah.localeCompare(b.legislator.daerah);
        if (dCmp !== 0) return dCmp;
        return b.displayDebt - a.displayDebt;
      }
      return a.legislator.namaLengkap.localeCompare(b.legislator.namaLengkap);
    });

    return list;
  }, [items, activeTab, tingkatFilter, daerahFilter, searchQuery, sortBy]);

  const filteredTotals = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let debt = 0;
    let unpaidMonthTotal = 0;
    let debtMembers = 0;
    let paidMembers = 0;

    for (const it of filteredItems) {
      billed += it.displayBilled;
      paid += it.displayPaid;
      debt += it.displayDebt;
      unpaidMonthTotal += it.unpaidMonths.length;
      if (it.displayDebt > 0) debtMembers += 1;
      else paidMembers += 1;
    }

    return { billed, paid, debt, unpaidMonthTotal, debtMembers, paidMembers };
  }, [filteredItems]);

  if (!isOpen) return null;

  const handleExport = () => {
    const exportRows = filteredItems.map((it) => {
      const mInfo = getMethodBadgeInfo(it.legislator);
      const overpaid = Math.max(0, -it.displayDelta);
      const statusLabel =
        it.displayDebt > 0 ? 'MENUNGGAK' : overpaid > 0 ? 'LEBIH BAYAR' : 'LUNAS';
      return {
        namaLengkap: it.legislator.namaLengkap,
        tingkat: it.legislator.tingkat,
        daerah: it.legislator.daerah,
        statusLabel,
        methodLabel: mInfo.short,
        totalBilled: it.displayBilled,
        totalPaid: it.displayPaid,
        debt: it.displayDebt,
        overpaid,
        unpaidMonthCount: it.unpaidMonths.length,
        unpaidMonthsText: it.unpaidMonths
          .map((u) =>
            u.isPartial ? `${u.label} (Kurang ${formatRupiah(u.shortfall)})` : `${u.label} (${formatRupiah(u.shortfall)})`
          )
          .join('; '),
        paidMonthCount: it.paidMonths.length,
        paidMonthsText: it.paidMonths.map((p) => p.label).join(', '),
      };
    });
    exportReconciliationStatusExcel(kind, scopeLabel, exportRows);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#002B49] via-[#1A3282] to-[#0F2460] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Rekonsiliasi Rinci Anggota · Iuran {kind} ({scopeLabel})</span>
            </span>
            <h3 className="text-base sm:text-lg font-extrabold mt-0.5">
              Daftar Anggota Menunggak &amp; Lunas ({items.length} Anggota)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
              title="Tutup rincian"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Status Tabs + Filters */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('DEBT')}
              className={`px-3.5 py-2 rounded-xl font-bold border flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'DEBT'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                Menunggak ({tabStats.debtCount} Org · {formatRupiah(tabStats.totalDebt)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PAID')}
              className={`px-3.5 py-2 rounded-xl font-bold border flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'PAID'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Lunas ({tabStats.paidCount} Org · {formatRupiah(tabStats.totalPaidLunas)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-xl font-bold border flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-[#1A3282] text-white border-[#1A3282] shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua ({items.length} Org)</span>
            </button>
          </div>

          {/* Toolbar Filter & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tingkatFilter}
              onChange={(e) => setTingkatFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold outline-none"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="PROVINSI">DPRD Provinsi</option>
              <option value="KAB_KOTA">DPRD Kab/Kota</option>
            </select>

            <select
              value={daerahFilter}
              onChange={(e) => setDaerahFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold outline-none"
            >
              <option value="ALL">Semua Daerah ({daerahOptions.length})</option>
              {daerahOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold outline-none"
            >
              <option value="debt_desc">Urut: Tunggakan Terbesar</option>
              <option value="unpaid_count_desc">Urut: Bulan Tunggakan Terbanyak</option>
              <option value="region">Urut: Per Daerah</option>
              <option value="name_asc">Urut: Nama A–Z</option>
            </select>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama anggota atau daerah..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
              />
            </div>
          </div>

          {/* 4 Mini Summary Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Ditampilkan</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {filteredItems.length} Org ({filteredTotals.debtMembers} Tunggak · {filteredTotals.paidMembers} Lunas)
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Total Tagihan ({scopeLabel})</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatRupiah(filteredTotals.billed)}
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Total Sudah Disetor</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                {formatRupiah(filteredTotals.paid)}
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
              <span className="text-rose-700 dark:text-rose-300 block">Total Tunggakan</span>
              <strong className="font-mono text-rose-700 dark:text-rose-300">
                {formatRupiah(filteredTotals.debt)} ({filteredTotals.unpaidMonthTotal} bln)
              </strong>
            </div>
          </div>
        </div>

        {/* Scrollable Member List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Tidak ada anggota yang sesuai dengan filter ini.
            </div>
          ) : (
            filteredItems.map((it, idx) => {
              const { legislator: leg } = it;
              const isDebt = it.displayDebt > 0;
              const overpaid = Math.max(0, -it.displayDelta);
              const methodInfo = getMethodBadgeInfo(leg);

              return (
                <div
                  key={leg.id}
                  className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 border-l-4 ${
                    isDebt ? 'border-l-rose-500' : 'border-l-emerald-500'
                  }`}
                >
                  {/* Row Top: Identitas & Nominal Ringkas */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10.5px] text-slate-400">#{idx + 1}</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {leg.namaLengkap}
                        </span>
                        {isDebt ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold">
                            MENUNGGAK · {it.unpaidMonths.length} Bulan
                          </span>
                        ) : overpaid > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                            LUNAS · Lebih Bayar +{formatRupiah(overpaid)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                            LUNAS PENUH
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {leg.daerah}
                        </span>
                        <span>·</span>
                        <span>{leg.tingkat === 'PROVINSI' ? 'DPRD Provinsi' : 'DPRD Kab/Kota'}</span>
                        <span>·</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${methodInfo.className}`}>
                          {leg.isAutodebetActive && <Zap className="w-2.5 h-2.5" />}
                          {methodInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 space-y-0.5">
                      {isDebt ? (
                        <>
                          <span className="text-[10.5px] text-rose-600 dark:text-rose-400 font-bold uppercase block">
                            Total Tunggakan
                          </span>
                          <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 block">
                            {formatRupiah(it.displayDebt)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            Disetor {formatRupiah(it.displayPaid)} / Tagihan {formatRupiah(it.displayBilled)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">
                            Total Setoran ({it.paidMonths.length} Bln)
                          </span>
                          <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300 block">
                            {formatRupiah(it.displayPaid)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            Tunggakan: <strong className="text-emerald-600">Rp 0</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bulan-Bulan Menunggak (Interaktif klik untuk melunasi) */}
                  {it.unpaidMonths.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-1.5">
                      <span className="text-[10.5px] font-bold text-rose-800 dark:text-rose-300 block">
                        Rincian Bulan Menunggak ({it.unpaidMonths.length} bulan · klik bulan untuk catat setoran):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {it.unpaidMonths.map((u) => (
                          <button
                            key={u.ym}
                            type="button"
                            onClick={() => onSelectCell(leg, u.ym)}
                            title={`Klik untuk melunasi ${leg.namaLengkap} bulan ${u.label}`}
                            className={`px-2 py-1 rounded-lg border text-[10.5px] font-mono font-semibold cursor-pointer transition-colors ${
                              u.isPartial
                                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-white hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {u.label}: {u.isPartial ? `Kurang ${formatRupiah(u.shortfall)}` : formatRupiah(u.shortfall)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bulan-Bulan Lunas */}
                  {it.paidMonths.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10.5px] font-semibold text-slate-500 block">
                        Bulan Sudah Lunas ({it.paidMonths.length} bulan · klik untuk lihat bukti/rincian):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {it.paidMonths.map((pm) => (
                          <button
                            key={pm.ym}
                            type="button"
                            onClick={() => onSelectCell(leg, pm.ym)}
                            title={`Lihat setoran ${leg.namaLengkap} bulan ${pm.label}`}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                              pm.method === 'AUTODEBET'
                                ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            ✓ {pm.label} ({formatRupiah(pm.paid)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Footer Totals */}
        <div className="px-5 py-3 bg-[#0F2460] text-white text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="font-bold">
            Total Daftar Tampil: {filteredItems.length} Anggota ({filteredTotals.debtMembers} Menunggak · {filteredTotals.paidMembers} Lunas)
          </span>
          <div className="flex flex-wrap items-center gap-4 font-mono font-extrabold">
            <span>Tagihan: {formatRupiah(filteredTotals.billed)}</span>
            <span className="text-emerald-300">Disetor: {formatRupiah(filteredTotals.paid)}</span>
            <span className="text-rose-300">Tunggakan: {formatRupiah(filteredTotals.debt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
