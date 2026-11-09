import React from 'react';
import { Search } from 'lucide-react';
import { ExportScopeMode } from './executiveReportTypes';

interface ExecutiveReportFilterBarProps {
  exportScope: ExportScopeMode;
  useCustomSelectionOnly: boolean;
  filterDpd: string;
  setFilterDpd: (dpd: string) => void;
  setFilterDpc: (dpc: string) => void;
  setFilterDprt: (dprt: string) => void;
  dpdOptionsWithCount: { name: string; count: number }[];
  filterDpc: string;
  dpcOptionsWithCount: { name: string; count: number }[];
  filterDprt: string;
  dprtOptionsWithCount: { name: string; count: number }[];
  filterSubCouncil: 'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR';
  setFilterSubCouncil: (sub: 'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  groupByTerritory: boolean;
  setGroupByTerritory: (val: boolean) => void;
  pageBreakPerGroup: boolean;
  setPageBreakPerGroup: (val: boolean) => void;
  hasMultipleSections: boolean;
}

export const ExecutiveReportFilterBar: React.FC<ExecutiveReportFilterBarProps> = ({
  exportScope,
  useCustomSelectionOnly,
  filterDpd,
  setFilterDpd,
  setFilterDpc,
  setFilterDprt,
  dpdOptionsWithCount,
  filterDpc,
  dpcOptionsWithCount,
  filterDprt,
  dprtOptionsWithCount,
  filterSubCouncil,
  setFilterSubCouncil,
  searchQuery,
  setSearchQuery,
  groupByTerritory,
  setGroupByTerritory,
  pageBreakPerGroup,
  setPageBreakPerGroup,
  hasMultipleSections,
}) => {
  if (exportScope === 'STATISTICS' || useCustomSelectionOnly) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end text-xs">
      {/* Wilayah DPD Selector (Shown for DPD, DPC, DPRt, ALL_KADER) */}
      {exportScope === 'DPW' ? (
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Wilayah Tingkat Provinsi
          </label>
          <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800">
            DPW Provinsi Sulawesi Utara
          </div>
        </div>
      ) : (
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Pilih Wilayah DPD (Kab/Kota)
          </label>
          <select
            value={filterDpd}
            onChange={(e) => {
              setFilterDpd(e.target.value);
              setFilterDpc('ALL');
              setFilterDprt('ALL');
            }}
            className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">Semua 15 Kabupaten/Kota (Per Wilayah)</option>
            {dpdOptionsWithCount.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} ({r.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wilayah DPC Selector (Shown for DPC, DPRt, ALL_KADER) */}
      {(exportScope === 'DPC' || exportScope === 'DPRt' || exportScope === 'ALL_KADER') && (
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Pilih Wilayah DPC (Kecamatan)
          </label>
          <select
            value={filterDpc}
            onChange={(e) => {
              setFilterDpc(e.target.value);
              setFilterDprt('ALL');
            }}
            className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">
              Semua Kecamatan ({dpcOptionsWithCount.length} DPC)
            </option>
            {dpcOptionsWithCount.map((dpcItem) => (
              <option key={dpcItem.name} value={dpcItem.name}>
                Kec. {dpcItem.name} ({dpcItem.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wilayah DPRt Selector (Shown for DPRt, ALL_KADER) */}
      {(exportScope === 'DPRt' || exportScope === 'ALL_KADER') && (
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Pilih Wilayah DPRt (Desa/Kel)
          </label>
          <select
            value={filterDprt}
            onChange={(e) => setFilterDprt(e.target.value)}
            className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">
              Semua Desa/Kel ({dprtOptionsWithCount.length})
            </option>
            {dprtOptionsWithCount.map((dprtItem) => (
              <option key={dprtItem.name} value={dprtItem.name}>
                {dprtItem.name} ({dprtItem.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-Council Filter (Shown for DPW, DPD, DPC) */}
      {(exportScope === 'DPW' || exportScope === 'DPD' || exportScope === 'DPC') && (
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Bagian Dewan
          </label>
          <select
            value={filterSubCouncil}
            onChange={(e) => setFilterSubCouncil(e.target.value as any)}
            className="w-full bg-white text-slate-900 text-xs rounded-lg px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">Semua Dewan</option>
            <option value="PIMPINAN">Pengurus Inti ({exportScope})</option>
            <option value="PERTIMBANGAN">Dewan Pertimbangan</option>
            <option value="PAKAR">Dewan Pakar</option>
          </select>
        </div>
      )}

      {/* Search Input */}
      <div className="lg:col-span-2">
        <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
          Cari Nama / Jabatan
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama..."
            className="w-full bg-white text-slate-900 text-xs rounded-lg pl-8 pr-2 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
          />
        </div>
      </div>

      {/* Grouping & Page Break Options */}
      <div className="lg:col-span-2 flex flex-col gap-1 justify-center pb-0.5">
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={groupByTerritory}
            onChange={(e) => setGroupByTerritory(e.target.checked)}
            className="rounded border-slate-300 accent-slate-900"
          />
          <span>Kelompokkan per Wilayah</span>
        </label>
        {groupByTerritory && hasMultipleSections && (
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={pageBreakPerGroup}
              onChange={(e) => setPageBreakPerGroup(e.target.checked)}
              className="rounded border-slate-300 accent-slate-900"
            />
            <span>Pisah Halaman per Wilayah</span>
          </label>
        )}
      </div>
    </div>
  );
};

