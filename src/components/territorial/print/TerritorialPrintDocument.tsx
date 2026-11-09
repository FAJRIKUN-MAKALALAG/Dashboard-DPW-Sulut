import React from 'react';
import { GridRowItem } from '../../matrix';
import nasdemLogo from '../../../assets/logo/logo_nasdem.png';
import { isRealNik, isRealEkta } from './printModalUtils';

interface TerritorialPrintDocumentProps {
  levelText: string;
  territoryTitle: string;
  skNumber: string;
  signDate: string;
  signCity: string;
  setSignCity: (val: string) => void;
  setSignDate: (val: string) => void;
  selectedPrintCount: number;
  totalRowsToPrintCount: number;
  uncheckedRowKeys: Set<string>;
  onSelectAllRows: () => void;
  onToggleRowCheck: (key: string) => void;
  groupedRows: [string, { row: GridRowItem; key: string }[]][];
  pageBreakPerGroup: boolean;

  leftPrefix: string;
  setLeftPrefix: (val: string) => void;
  leftJabatan: string;
  setLeftJabatan: (val: string) => void;
  sekretarisName: string;
  setSekretarisName: (val: string) => void;
  sekretarisKta: string;
  setSekretarisKta: (val: string) => void;

  showStamp: boolean;

  rightJabatan: string;
  setRightJabatan: (val: string) => void;
  ketuaName: string;
  setKetuaName: (val: string) => void;
  ketuaKta: string;
  setKetuaKta: (val: string) => void;
}

export const TerritorialPrintDocument: React.FC<TerritorialPrintDocumentProps> = ({
  levelText,
  territoryTitle,
  skNumber,
  signDate,
  signCity,
  setSignCity,
  setSignDate,
  selectedPrintCount,
  totalRowsToPrintCount,
  uncheckedRowKeys,
  onSelectAllRows,
  onToggleRowCheck,
  groupedRows,
  pageBreakPerGroup,

  leftPrefix,
  setLeftPrefix,
  leftJabatan,
  setLeftJabatan,
  sekretarisName,
  setSekretarisName,
  sekretarisKta,
  setSekretarisKta,

  showStamp,

  rightJabatan,
  setRightJabatan,
  ketuaName,
  setKetuaName,
  ketuaKta,
  setKetuaKta,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
      <div className="max-w-5xl mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl p-5 sm:p-10 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        {/* CLEAN FORMAL LETTERHEAD */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 text-center sm:text-left print:text-left">
          <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5">
            <img
              src={nasdemLogo}
              alt="Logo Resmi Partai NasDem"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
            />
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase">
                PARTAI NASDEM (NASIONAL DEMOKRAT)
              </p>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                {levelText}
              </h1>
              <p className="text-xs font-bold text-slate-700 uppercase mt-0.5">
                {territoryTitle}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right print:text-right font-mono text-[10px] text-slate-600 shrink-0">
            <div className="font-bold text-slate-900 uppercase">LAMPIRAN SK RESMI</div>
            <div>No: {skNumber}</div>
            <div>Tanggal: {signDate}</div>
          </div>
        </div>

        {/* Document Title Header */}
        <div className="text-center mb-5">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 underline underline-offset-4">
            SUSUNAN PENGURUS {levelText}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {territoryTitle} &bull; Periode 2024 - 2029
          </p>
        </div>

        <div className="no-print mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            Centang baris yang akan dicetak (
            <strong className="text-slate-900">{selectedPrintCount}</strong> baris dalam{' '}
            <strong className="text-slate-900">{groupedRows.length}</strong> kelompok wilayah/dewan):
          </span>
          {uncheckedRowKeys.size > 0 && (
            <button
              type="button"
              onClick={onSelectAllRows}
              className="text-slate-900 underline font-medium cursor-pointer"
            >
              Pilih Semua ({totalRowsToPrintCount})
            </button>
          )}
        </div>

        {/* Tabel Susunan Pengurus (Clean Monochrome) */}
        <div className="mb-6 space-y-5 print:space-y-4">
          {groupedRows.map(([subOrgName, groupItems], groupIdx) => {
            const activeGroupCount = groupItems.filter(
              (item) => !uncheckedRowKeys.has(item.key)
            ).length;
            let printRowCounter = 0;

            return (
              <div
                key={groupIdx}
                className={`border border-slate-300 overflow-x-auto print:overflow-visible ${
                  activeGroupCount === 0 ? 'print:hidden' : ''
                } ${pageBreakPerGroup && groupIdx > 0 ? 'print:break-before-page' : ''}`}
              >
                <div className="bg-slate-100 text-slate-900 border-b border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>{subOrgName}</span>
                  <span className="text-[10px] font-mono text-slate-600 font-normal">
                    {activeGroupCount} Posisi
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                      <th className="no-print p-2 border-r border-slate-300 text-center w-8">
                        ✓
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                      <th className="p-2 border-r border-slate-300 w-1/3">Jabatan Pengurus</th>
                      <th className="p-2 border-r border-slate-300 w-1/3">
                        Nama Lengkap &amp; Gelar
                      </th>
                      <th className="p-2 border-r border-slate-300">Nomor e-KTA / NIK</th>
                      <th className="p-2 border-r border-slate-300">No. HP</th>
                      <th className="p-2 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {groupItems.map(({ row, key }) => {
                      const isChecked = !uncheckedRowKeys.has(key);
                      if (isChecked) printRowCounter += 1;
                      const isFilled = row.namaLengkap.trim() !== '';
                      const cleanId = isRealEkta(row.nomorEKTA)
                        ? row.nomorEKTA
                        : isRealNik(row.nik)
                        ? row.nik
                        : '-';

                      return (
                        <tr
                          key={key}
                          className={!isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'}
                        >
                          <td className="no-print p-2 border-r border-slate-200 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleRowCheck(key)}
                              className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                            {isChecked ? printRowCounter : '-'}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                            {row.jabatan}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {isFilled ? (
                              <span className="font-semibold text-slate-950">
                                {row.namaLengkap}
                              </span>
                            ) : (
                              <span className="italic text-slate-400 font-normal">
                                (Belum Ditetapkan)
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                            {cleanId}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 text-[11px] font-mono">
                            {row.nomorHP && row.nomorHP !== '-' ? row.nomorHP : '-'}
                          </td>
                          <td className="p-2 text-center text-[11px] text-slate-700">
                            {isFilled ? 'Aktif' : 'Lowong'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* CLEAN INTERACTIVE SIGNATURES BLOCK AT BOTTOM */}
        <div className="print-break-inside-avoid mt-8 pt-5 border-t border-slate-300">
          <div className="no-print mb-3 text-[11px] text-slate-500">
            Klik langsung pada jabatan atau nama di bawah ini untuk mengetik manual sebelum cetak:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 items-start gap-6 text-xs text-slate-800">
            {/* Kolom Kiri: Sekretaris */}
            <div className="text-center flex flex-col items-center w-full">
              <input
                type="text"
                value={leftPrefix}
                onChange={(e) => setLeftPrefix(e.target.value)}
                className="w-full text-center text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
              />
              <input
                type="text"
                value={leftJabatan}
                onChange={(e) => setLeftJabatan(e.target.value)}
                className="w-full text-center font-bold text-slate-950 uppercase mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
              />
              <p className="text-[10px] text-slate-600 mt-0.5">
                PARTAI NASDEM {territoryTitle}
              </p>

              <div className="h-20 sm:h-24 print:h-22 w-full" />

              <input
                type="text"
                value={sekretarisName}
                onChange={(e) => setSekretarisName(e.target.value)}
                placeholder="( Ketik Nama Pejabat Kiri )"
                className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
              />
              {!sekretarisName.trim() && (
                <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                  ( .................................................... )
                </div>
              )}
              <input
                type="text"
                value={sekretarisKta}
                onChange={(e) => setSekretarisKta(e.target.value)}
                placeholder="Ketik No. e-KTA / NIK (Opsional)"
                className="w-full text-center text-[10px] text-slate-600 font-mono mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
              />
            </div>

            {/* Kolom Tengah */}
            <div className="text-center flex flex-col items-center justify-center my-auto w-full">
              {showStamp && (
                <div className="w-24 h-24 rounded-full border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[9px] text-slate-400 font-mono select-none">
                  <span>STEMPEL</span>
                  <span>ORGANISASI</span>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Ketua */}
            <div className="text-center flex flex-col items-center w-full">
              <div className="flex items-center justify-center gap-1 w-full">
                <input
                  type="text"
                  value={signCity}
                  onChange={(e) => setSignCity(e.target.value)}
                  className="w-24 text-right text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />
                <span>,</span>
                <input
                  type="text"
                  value={signDate}
                  onChange={(e) => setSignDate(e.target.value)}
                  className="w-36 text-left text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />
              </div>
              <input
                type="text"
                value={rightJabatan}
                onChange={(e) => setRightJabatan(e.target.value)}
                className="w-full text-center font-bold text-slate-950 uppercase mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
              />
              <p className="text-[10px] text-slate-600 mt-0.5">
                PARTAI NASDEM {territoryTitle}
              </p>

              <div className="h-20 sm:h-24 print:h-22 w-full" />

              <input
                type="text"
                value={ketuaName}
                onChange={(e) => setKetuaName(e.target.value)}
                placeholder="( Ketik Nama Pejabat Kanan )"
                className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
              />
              {!ketuaName.trim() && (
                <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                  ( .................................................... )
                </div>
              )}
              <input
                type="text"
                value={ketuaKta}
                onChange={(e) => setKetuaKta(e.target.value)}
                placeholder="Ketik No. e-KTA / NIK (Opsional)"
                className="w-full text-center text-[10px] text-slate-600 font-mono mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

