import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import {
  TerritoryContext,
  downloadTerritorialExcelTemplate,
  downloadAdvisoryOnlyExcelTemplate,
  downloadExpertOnlyExcelTemplate,
  downloadAdvisoryAndExpertExcelTemplate,
} from '../../../utils/territorial';
import { GridRowItem } from '../../matrix';

interface DownloadTemplateCardProps {
  territoryContext: TerritoryContext;
  currentRows?: GridRowItem[];
}

export const DownloadTemplateCard: React.FC<DownloadTemplateCardProps> = ({
  territoryContext,
  currentRows,
}) => {
  return (
    <div className="p-4.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Pilihan Unduh Template Excel Resmi
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih template spesifik sesuai kebutuhan pengisian susunan pengurus wilayah ini:
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => downloadTerritorialExcelTemplate(territoryContext, currentRows)}
          className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer shadow-2xs"
          title="Download Template Lengkap (Seluruh Jabatan Resmi)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Template Lengkap (Semua Posisi)</span>
        </button>

        {(territoryContext.level === 'DPW' || territoryContext.level === 'DPD') && (
          <>
            <button
              onClick={() => downloadAdvisoryOnlyExcelTemplate(territoryContext, currentRows)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-300 hover:border-amber-400 cursor-pointer shadow-2xs"
              title="Download Template MURNI Khusus Dewan Pertimbangan Saja"
            >
              <span className="text-amber-600 dark:text-amber-400">🏛️</span>
              <span>Template Pertimbangan Saja</span>
            </button>

            <button
              onClick={() => downloadExpertOnlyExcelTemplate(territoryContext, currentRows)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer shadow-2xs"
              title="Download Template MURNI Khusus Dewan Pakar Saja"
            >
              <span className="text-emerald-600 dark:text-emerald-400">🎓</span>
              <span>Template Pakar Saja</span>
            </button>

            <button
              onClick={() => downloadAdvisoryAndExpertExcelTemplate(territoryContext, currentRows)}
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 cursor-pointer shadow-2xs"
              title="Download Template Gabungan Pertimbangan & Pakar (2 Sheet Terpisah)"
            >
              <span className="text-indigo-600 dark:text-indigo-400">📑</span>
              <span>Template Gabungan (Pertimbangan & Pakar)</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
