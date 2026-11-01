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
      <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              {dpdPimpinanCompliance.isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Formasi DPD Bagian A (36 Jabatan Inti):
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dpdPimpinanCompliance.isComplete ? 'bg-emerald-500' : 'bg-[#FDB813]'
                    }`}
                  />
                  {dpdPimpinanCompliance.filledCount}/{dpdPimpinanCompliance.totalRequired} Terisi
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {dpdPimpinanCompliance.isComplete
                  ? `Seluruh ${dpdPimpinanCompliance.totalRequired} formasi resmi pengurus harian DPD ${selectedDpd} telah lengkap terisi.`
                  : `Terdapat ${dpdPimpinanCompliance.vacantCount} jabatan lowong dari ${dpdPimpinanCompliance.totalRequired} formasi wajib DPD ${selectedDpd}.`}
              </p>
            </div>
          </div>

          {dpdPimpinanCompliance.vacantCount > 0 && (
            <button
              type="button"
              onClick={() => setShowVacantModal(true)}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] dark:hover:bg-blue-700 text-white cursor-pointer transition-colors shrink-0"
            >
              <span>Lihat {dpdPimpinanCompliance.vacantCount} Lowong</span>
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
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Rincian Formasi DPD Bagian A Belum Terisi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    DPD Partai NasDem {selectedDpd} &middot;{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
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
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
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
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-slate-50/70 dark:bg-slate-950/40'
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
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              ✓ Terisi: {slot.member.namaLengkap}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Belum ada nama pengurus yang terdata
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {slot.isFilled ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Terisi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FDB813]/15 text-[#9E6706] dark:bg-slate-800 dark:text-[#FDB813]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
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
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] dark:hover:bg-blue-700 text-white shadow-xs cursor-pointer"
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
