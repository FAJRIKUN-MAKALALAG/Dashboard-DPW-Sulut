import React from 'react';
import { CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';
import { DpdComplianceResult } from '../../utils/structureReadinessUtils';

interface TerritoryComplianceBannerProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  selectedDpd: string;
  dpdPimpinanCompliance: DpdComplianceResult | null;
  showVacantModal: boolean;
  setShowVacantModal: (show: boolean) => void;
  onOpenEditMode: () => void;
}

export const TerritoryComplianceBanner: React.FC<TerritoryComplianceBannerProps> = ({
  level,
  selectedDpd,
  dpdPimpinanCompliance,
  showVacantModal,
  setShowVacantModal,
  onOpenEditMode,
}) => {
  if (level !== 'DPD' || !dpdPimpinanCompliance) return null;

  return (
    <>
      <div
        className={`p-3 sm:p-4 rounded-xl border transition-all ${
          dpdPimpinanCompliance.isComplete
            ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                dpdPimpinanCompliance.isComplete
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {dpdPimpinanCompliance.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  Formasi DPD Bagian A:
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold ${
                    dpdPimpinanCompliance.isComplete
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {dpdPimpinanCompliance.filledCount}/{dpdPimpinanCompliance.totalRequired} Terisi
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {dpdPimpinanCompliance.isComplete
                  ? `Seluruh ${dpdPimpinanCompliance.totalRequired} formasi resmi pengurus harian DPD ${selectedDpd} telah lengkap terisi.`
                  : `Data pengurus DPD ${selectedDpd} baru mengisi ${dpdPimpinanCompliance.filledCount} dari ${dpdPimpinanCompliance.totalRequired} formasi resmi. Terdapat ${dpdPimpinanCompliance.vacantCount} jabatan lowong.`}
              </p>
            </div>
          </div>

          {dpdPimpinanCompliance.vacantCount > 0 && (
            <button
              type="button"
              onClick={() => setShowVacantModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors shrink-0"
            >
              <span>{dpdPimpinanCompliance.vacantCount} Lowong</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modal Rincian Jabatan DPD Bagian A Yang Belum Terisi */}
      {showVacantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Rincian Formasi DPD Bagian A Belum Terisi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    DPD Partai NasDem {selectedDpd} &middot;{' '}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Terisi {dpdPimpinanCompliance.filledCount}/{dpdPimpinanCompliance.totalRequired} Jabatan ({dpdPimpinanCompliance.vacantCount} Lowong)
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVacantModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List / Table Content */}
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                Berikut adalah <strong>{dpdPimpinanCompliance.vacantCount} jabatan pimpinan daerah</strong> dari {dpdPimpinanCompliance.totalRequired} formasi yang masih kosong dan perlu diisi kader/pengurus ber-SK:
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Jabatan ({dpdPimpinanCompliance.totalRequired} Formasi Aktif)</th>
                      <th className="py-2.5 px-3 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dpdPimpinanCompliance.slots.map((slot: any) => (
                      <tr
                        key={slot.no}
                        className={
                          slot.isFilled
                            ? 'bg-slate-50/40 dark:bg-slate-900/40'
                            : 'bg-amber-50/30 dark:bg-amber-950/20'
                        }
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                          #{slot.no}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {slot.jabatan}
                          </div>
                          {slot.isFilled && slot.member ? (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Terisi: {slot.member.namaLengkap}
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                              ⚡ Belum ada nama pengurus yang terdata
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {slot.isFilled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Terisi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse">
                              <span>Lowong</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilih "Mode Edit" di tabel matriks untuk langsung mengisi posisi yang lowong.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVacantModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVacantModal(false);
                    onOpenEditMode();
                  }}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  Isi Langsung di Tabel Matriks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
