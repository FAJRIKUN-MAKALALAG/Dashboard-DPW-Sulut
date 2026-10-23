import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { DpdImportComplianceInfo } from '../../../utils/territorial';

interface ImportComplianceCardProps {
  dpdPimpinanCompliance?: DpdImportComplianceInfo;
}

export const ImportComplianceCard: React.FC<ImportComplianceCardProps> = ({
  dpdPimpinanCompliance,
}) => {
  const [showVacantDetail, setShowVacantDetail] = useState(false);

  if (!dpdPimpinanCompliance) return null;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        dpdPimpinanCompliance.isComplete
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
          : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              dpdPimpinanCompliance.isComplete
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {dpdPimpinanCompliance.isComplete ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Formasi DPD Bagian A (Dewan Pimpinan Daerah):
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  dpdPimpinanCompliance.isComplete
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                }`}
              >
                {dpdPimpinanCompliance.filledCount}/36 Jabatan Terisi
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              {dpdPimpinanCompliance.isComplete
                ? 'Seluruh 36 formasi resmi pengurus harian DPD telah lengkap terisi.'
                : `Data yang dimasukkan baru mengisi ${dpdPimpinanCompliance.filledCount} dari 36 formasi baku DPD. Terdapat ${dpdPimpinanCompliance.vacantCount} jabatan yang belum terisi.`}
            </p>
          </div>
        </div>

        {dpdPimpinanCompliance.vacantCount > 0 && (
          <button
            type="button"
            onClick={() => setShowVacantDetail(!showVacantDetail)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <span>
              {showVacantDetail
                ? 'Tutup Rincian'
                : `Buka ${dpdPimpinanCompliance.vacantCount} Jabatan Belum Terisi`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showVacantDetail ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {showVacantDetail && dpdPimpinanCompliance.vacantCount > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/60 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 font-semibold">
            <span>Daftar Jabatan DPD Bagian A yang Belum Terisi:</span>
            <span className="text-[10px] font-mono">
              {dpdPimpinanCompliance.vacantCount} posisi lowong
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {dpdPimpinanCompliance.vacantSlots.map((slot) => (
              <div
                key={slot.no}
                className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-800/80 text-[11px]"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono text-[10px] w-5 h-5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    #{slot.no}
                  </span>
                  <span
                    className="font-medium text-slate-800 dark:text-slate-200 truncate"
                    title={slot.jabatan}
                  >
                    {slot.jabatan}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                  ⚡ Lowong
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
