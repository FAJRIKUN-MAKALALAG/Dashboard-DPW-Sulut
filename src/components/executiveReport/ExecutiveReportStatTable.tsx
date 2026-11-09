import React from 'react';
import { DpdStatRow } from '../../utils/excelUtils';
import { SULUT_REGIONS } from '../../data/sulutRegions';

interface ExecutiveReportStatTableProps {
  dpdStats: DpdStatRow[];
  selectedStatDpds: Set<string>;
  setSelectedStatDpds: React.Dispatch<React.SetStateAction<Set<string>>>;
  printedDpdStats: DpdStatRow[];
  grandTotal: {
    totalAll: number;
    aktifAll: number;
    meninggalAll: number;
    pindahPartaiAll: number;
    pindahDomisiliAll: number;
    dpcAll: number;
    nonAktifAll: number;
    avgPersen: number;
  };
}

export const ExecutiveReportStatTable: React.FC<ExecutiveReportStatTableProps> = ({
  dpdStats,
  selectedStatDpds,
  setSelectedStatDpds,
  printedDpdStats,
  grandTotal,
}) => {
  return (
    <div className="mb-6">
      <div className="no-print flex items-center justify-between mb-2 text-xs text-slate-500">
        <span>
          Centang baris DPD yang ingin disertakan ({printedDpdStats.length} dari{' '}
          {dpdStats.length} DPD):
        </span>
        {selectedStatDpds.size < dpdStats.length && (
          <button
            type="button"
            onClick={() => setSelectedStatDpds(new Set(SULUT_REGIONS.map((r) => r.name)))}
            className="text-slate-900 underline font-medium cursor-pointer"
          >
            Pilih Semua 15 DPD
          </button>
        )}
      </div>

      <div className="overflow-x-auto print:overflow-visible border border-slate-300">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
              <th className="no-print p-2 border-r border-slate-300 text-center w-8">✓</th>
              <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
              <th className="p-2 border-r border-slate-300">DPD Kabupaten / Kota</th>
              <th className="p-2 border-r border-slate-300 text-center">Zona</th>
              <th className="p-2 border-r border-slate-300 text-center">Jml DPC</th>
              <th className="p-2 border-r border-slate-300 text-right">Total</th>
              <th className="p-2 border-r border-slate-300 text-right">Aktif Riil</th>
              <th className="p-2 border-r border-slate-300 text-right">% Aktif</th>
              <th className="p-2 border-r border-slate-300 text-center">Non-Aktif</th>
              <th className="p-2 text-center">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {dpdStats.map((row) => {
              const isChecked = selectedStatDpds.has(row.dpd);
              const printIndex = printedDpdStats.findIndex((r) => r.dpd === row.dpd) + 1;
              const nonAktifRow = row.meninggal + row.pindahPartai + row.pindahDomisili;

              return (
                <tr
                  key={row.dpd}
                  className={!isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'}
                >
                  <td className="no-print p-2 border-r border-slate-200 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedStatDpds((prev) => {
                          const next = new Set(prev);
                          if (next.has(row.dpd)) next.delete(row.dpd);
                          else next.add(row.dpd);
                          return next;
                        });
                      }}
                      className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                    {isChecked ? printIndex : '-'}
                  </td>
                  <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                    {row.dpd}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-slate-600 text-[11px]">
                    {row.zona === 'Daratan Minahasa'
                      ? 'Minahasa'
                      : row.zona === 'BMR'
                      ? 'BMR'
                      : 'Kepulauan'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                    {row.dpcCount}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                    {row.total}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 text-[11px]">
                    {row.aktif}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                    {row.persentaseAktif}%
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 text-[11px]">
                    {nonAktifRow}
                  </td>
                  <td className="p-2 text-center text-[11px] text-slate-700">
                    {row.statusKesiapan}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-400 font-mono text-[11px]">
              <td className="no-print p-2"></td>
              <td className="p-2 text-center" colSpan={3}>
                TOTAL ({printedDpdStats.length} DPD)
              </td>
              <td className="p-2 text-center border-l border-slate-300">
                {grandTotal.dpcAll}
              </td>
              <td className="p-2 text-right border-l border-slate-300">
                {grandTotal.totalAll}
              </td>
              <td className="p-2 text-right border-l border-slate-300">
                {grandTotal.aktifAll}
              </td>
              <td className="p-2 text-right border-l border-slate-300">
                {grandTotal.avgPersen}%
              </td>
              <td className="p-2 text-center border-l border-slate-300">
                {grandTotal.nonAktifAll}
              </td>
              <td className="p-2 text-center border-l border-slate-300 font-sans">
                Terverifikasi
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

