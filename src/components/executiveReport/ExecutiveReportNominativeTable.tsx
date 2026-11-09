import React from 'react';
import { Member } from '../../types';
import { ExportScopeMode } from './executiveReportTypes';
import { isRealEkta, isRealNik } from './executiveReportUtils';

export interface TerritorySectionItem {
  groupId: string;
  groupTitle: string;
  groupSubtitle: string;
  items: { member: Member; key: string }[];
}

interface ExecutiveReportNominativeTableProps {
  exportScope: ExportScopeMode;
  nominativeMembers: Member[];
  printedNominativeMembers: Member[];
  groupedTerritorySections: TerritorySectionItem[];
  uncheckedKeys: Set<string>;
  onSelectAll: () => void;
  onToggleMemberCheck: (key: string) => void;
  onToggleGroupCheck: (groupItems: { member: Member; key: string }[]) => void;
  groupByTerritory: boolean;
  pageBreakPerGroup: boolean;
}

export const ExecutiveReportNominativeTable: React.FC<ExecutiveReportNominativeTableProps> = ({
  exportScope,
  nominativeMembers,
  printedNominativeMembers,
  groupedTerritorySections,
  uncheckedKeys,
  onSelectAll,
  onToggleMemberCheck,
  onToggleGroupCheck,
  groupByTerritory,
  pageBreakPerGroup,
}) => {
  return (
    <div className="mb-6 space-y-5 print:space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Menampilkan <strong className="text-slate-900">{printedNominativeMembers.length}</strong> data terpilih dalam{' '}
          <strong className="text-slate-900">{groupedTerritorySections.length}</strong> kelompok wilayah. Centang kotak <strong>✓</strong> untuk memilih wilayah/baris:
        </span>
        {uncheckedKeys.size > 0 && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-slate-900 underline font-medium cursor-pointer"
          >
            Pilih Semua ({nominativeMembers.length})
          </button>
        )}
      </div>

      {nominativeMembers.length === 0 ? (
        <div className="border border-slate-300 p-8 text-center text-slate-500 text-xs">
          Tidak ada data untuk jenjang / wilayah yang dipilih. Silakan pilih wilayah lain pada dropdown di atas.
        </div>
      ) : (
        groupedTerritorySections.map((section, sectionIdx) => {
          const activeSectionCount = section.items.filter(
            (it) => !uncheckedKeys.has(it.key)
          ).length;
          const isAllSectionChecked =
            section.items.length > 0 && activeSectionCount === section.items.length;

          let sectionPrintNo = 0;

          return (
            <div
              key={section.groupId}
              className={`border border-slate-300 overflow-x-auto print:overflow-visible ${
                activeSectionCount === 0 ? 'print:hidden' : ''
              } ${
                pageBreakPerGroup && sectionIdx > 0 ? 'print:break-before-page' : ''
              }`}
            >
              {/* Territory / Sub-Organization Section Header */}
              {groupByTerritory && (
                <div className="bg-slate-100 text-slate-900 border-b border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSectionChecked}
                      onChange={() => onToggleGroupCheck(section.items)}
                      className="no-print w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      title="Pilih / batalkan seluruh baris di wilayah ini"
                    />
                    <span>{section.groupTitle}</span>
                    {section.groupSubtitle && (
                      <span className="text-[11px] font-normal text-slate-600 normal-case">
                        ({section.groupSubtitle})
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] font-mono text-slate-600 font-normal shrink-0">
                    {activeSectionCount} Data
                  </span>
                </div>
              )}

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                    <th className="no-print border-r border-slate-300 p-2 text-center w-8">
                      ✓
                    </th>
                    <th className="border-r border-slate-300 p-2 text-center w-9">No</th>
                    {(exportScope === 'DPW' ||
                      exportScope === 'DPD' ||
                      exportScope === 'DPC' ||
                      exportScope === 'DPRt') && (
                      <th className="border-r border-slate-300 p-2 w-1/3">
                        Jabatan Kepengurusan ({exportScope})
                      </th>
                    )}
                    <th className="border-r border-slate-300 p-2">
                      Nama Lengkap &amp; NIK
                    </th>
                    <th className="border-r border-slate-300 p-2">Nomor e-KTA</th>
                    {exportScope === 'ALL_KADER' && (
                      <th className="border-r border-slate-300 p-2">Jabatan &amp; Tingkat</th>
                    )}
                    <th className="border-r border-slate-300 p-2">Wilayah</th>
                    <th className="border-r border-slate-300 p-2 text-center">No. HP</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {section.items.map(({ member: m, key }) => {
                    const isChecked = !uncheckedKeys.has(key);
                    if (isChecked) sectionPrintNo += 1;
                    const displayNo = isChecked ? sectionPrintNo : '-';

                    const cleanNik = isRealNik(m.nik) ? m.nik : '-';
                    const cleanEkta = isRealEkta(m.nomorEKTA) ? m.nomorEKTA : '-';

                    return (
                      <tr
                        key={key}
                        className={
                          !isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'
                        }
                      >
                        <td className="no-print border-r border-slate-200 p-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleMemberCheck(key)}
                            className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-200 p-1.5 text-center font-mono text-[11px]">
                          {displayNo}
                        </td>

                        {(exportScope === 'DPW' ||
                          exportScope === 'DPD' ||
                          exportScope === 'DPC' ||
                          exportScope === 'DPRt') && (
                          <td className="border-r border-slate-200 p-1.5 font-medium text-slate-900">
                            {m.jabatan || 'Pengurus'}
                          </td>
                        )}

                        <td className="border-r border-slate-200 p-1.5">
                          <div className="font-semibold text-slate-900 leading-tight">
                            {m.namaLengkap}
                          </div>
                          {cleanNik !== '-' && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              NIK: {cleanNik}
                            </div>
                          )}
                        </td>

                        <td className="border-r border-slate-200 p-1.5 font-mono text-slate-800 text-[11px]">
                          {cleanEkta}
                        </td>

                        {exportScope === 'ALL_KADER' && (
                          <td className="border-r border-slate-200 p-1.5 text-slate-800">
                            <div className="font-medium text-slate-900">
                              {m.jabatan || 'Anggota'}
                            </div>
                            {m.tingkatKepengurusan &&
                              m.tingkatKepengurusan !== 'Bukan Pengurus' && (
                                <div className="text-[10px] text-slate-500">
                                  {m.tingkatKepengurusan}
                                </div>
                              )}
                          </td>
                        )}

                        <td className="border-r border-slate-200 p-1.5 text-slate-700 text-[11px]">
                          {exportScope === 'DPW' ? (
                            <span>Provinsi Sulawesi Utara</span>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900">
                                {m.dpd || '-'}
                              </div>
                              {m.dpc &&
                                m.dpc !== '-' &&
                                m.dpc !== 'ALL' &&
                                m.dpc !== 'Umum (DPD)' && (
                                  <div className="text-[10px] text-slate-500">
                                    Kec. {m.dpc}
                                    {m.dprt &&
                                    m.dprt !== '-' &&
                                    m.dprt !== 'ALL' &&
                                    m.dprt !== 'Pusat/Umum'
                                      ? ` • Desa/Kel. ${m.dprt}`
                                      : ''}
                                  </div>
                                )}
                            </div>
                          )}
                        </td>

                        <td className="border-r border-slate-200 p-1.5 text-center font-mono text-slate-700 text-[11px]">
                          {m.nomorHP && m.nomorHP !== '-' ? m.nomorHP : '-'}
                        </td>

                        <td className="p-1.5 text-center text-[11px] text-slate-800">
                          {m.status === 'Aktif' ? 'Aktif' : 'Non-Aktif'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
};

