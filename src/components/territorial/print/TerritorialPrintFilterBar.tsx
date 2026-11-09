import React from 'react';

interface TerritorialPrintFilterBarProps {
  activeLevel: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  activeDpd: string;
  setActiveDpd: (dpd: string) => void;
  activeDpc: string;
  setActiveDpc: (dpc: string) => void;
  activeDprt: string;
  setActiveDprt: (dprt: string) => void;
  setSelectedSubOrg: (subOrg: string) => void;
  dpdOptionsWithCount: { name: string; count: number }[];
  dpcOptionsWithCount: { name: string; count: number }[];
  dprtOptionsWithCount: { name: string; count: number }[];
  pageBreakPerGroup: boolean;
  setPageBreakPerGroup: (val: boolean) => void;
  hasMultipleGroups: boolean;
}

export const TerritorialPrintFilterBar: React.FC<TerritorialPrintFilterBarProps> = ({
  activeLevel,
  activeDpd,
  setActiveDpd,
  activeDpc,
  setActiveDpc,
  activeDprt,
  setActiveDprt,
  setSelectedSubOrg,
  dpdOptionsWithCount,
  dpcOptionsWithCount,
  dprtOptionsWithCount,
  pageBreakPerGroup,
  setPageBreakPerGroup,
  hasMultipleGroups,
}) => {
  if (activeLevel === 'DPW') return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end text-xs">
      <div>
        <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
          Pilih Wilayah DPD (Kab/Kota)
        </label>
        <select
          value={activeDpd}
          onChange={(e) => {
            setActiveDpd(e.target.value);
            setActiveDpc('ALL');
            setActiveDprt('ALL');
            setSelectedSubOrg('ALL');
          }}
          className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
        >
          <option value="ALL">Semua 15 DPD (Cetak Per Wilayah)</option>
          {dpdOptionsWithCount.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name} ({r.count})
            </option>
          ))}
        </select>
      </div>

      {(activeLevel === 'DPC' || activeLevel === 'DPRt') && (
        <div>
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Pilih Wilayah DPC (Kecamatan)
          </label>
          <select
            value={activeDpc}
            onChange={(e) => {
              setActiveDpc(e.target.value);
              setActiveDprt('ALL');
              setSelectedSubOrg('ALL');
            }}
            className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
          >
            <option value="ALL">
              Semua Kecamatan ({dpcOptionsWithCount.length} DPC)
            </option>
            {dpcOptionsWithCount.map((d) => (
              <option key={d.name} value={d.name}>
                Kec. {d.name} ({d.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {activeLevel === 'DPRt' && (
        <div>
          <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
            Pilih Wilayah DPRt (Desa/Kel)
          </label>
          <select
            value={activeDprt}
            onChange={(e) => {
              setActiveDprt(e.target.value);
              setSelectedSubOrg('ALL');
            }}
            className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
          >
            <option value="ALL">
              Semua Desa/Kelurahan ({dprtOptionsWithCount.length} DPRt)
            </option>
            {dprtOptionsWithCount.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.count})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pb-1">
        {hasMultipleGroups && (
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
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

