import React from 'react';
import { Check } from 'lucide-react';

export type WizardStepNumber = 1 | 2 | 3 | 4;

interface StepDef {
  id: WizardStepNumber;
  title: string;
  subtitle: string;
  mobileHint: string;
}

const DEFAULT_STEPS: StepDef[] = [
  {
    id: 1,
    title: 'Tahap 1',
    subtitle: 'Scan / Upload e-KTP',
    mobileHint: 'Foto e-KTP dengan kamera atau pilih dari galeri',
  },
  {
    id: 2,
    title: 'Tahap 2',
    subtitle: 'Verifikasi Data Diri',
    mobileHint: 'Periksa & koreksi NIK, nama, TTL, dan pekerjaan',
  },
  {
    id: 3,
    title: 'Tahap 3',
    subtitle: 'Alamat & Wilayah',
    mobileHint: 'Lengkapi domisili DPD/DPC/DPRt & nomor WhatsApp',
  },
  {
    id: 4,
    title: 'Tahap 4',
    subtitle: 'Konfirmasi & Simpan',
    mobileHint: 'Pastikan seluruh data sudah benar sebelum disimpan',
  },
];

interface RegistrationStepProgressBarProps {
  currentStep: WizardStepNumber;
  onSelectStep: (step: WizardStepNumber) => void;
}

export const RegistrationStepProgressBar: React.FC<RegistrationStepProgressBarProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const activeStepObj = DEFAULT_STEPS.find((s) => s.id === currentStep) || DEFAULT_STEPS[0];
  const progressPercent = (currentStep / DEFAULT_STEPS.length) * 100;

  return (
    <div>
      {/* Mode Mobile (< md): Header Langkah Ringkas & Tidak Membingungkan */}
      <div className="md:hidden p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-[#1A3282] text-white text-[10px] font-bold">
                Langkah {currentStep}/4
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeStepObj.subtitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {activeStepObj.mobileHint}
            </p>
          </div>

          {/* Indikator Angka 1-4 yang dapat disentuh */}
          <div className="flex items-center gap-1 shrink-0">
            {DEFAULT_STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isCompleted = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectStep(s.id)}
                  className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1A3282] text-white'
                      : isCompleted
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                  title={`${s.title}: ${s.subtitle}`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bar Progres Horizontal */}
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#1A3282] dark:bg-slate-200 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mode Tablet & Desktop (md+): 4 Kolom Tahap Terstruktur */}
      <div className="hidden md:grid md:grid-cols-4 gap-2.5">
        {DEFAULT_STEPS.map((s) => {
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStep(s.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1A3282] text-white border-[#1A3282] shadow-2xs'
                  : isCompleted
                  ? 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-[#1A3282]'
                    : isCompleted
                    ? 'bg-[#1A3282] text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-[10px] font-semibold uppercase tracking-wider truncate ${
                    isActive
                      ? 'text-slate-200'
                      : isCompleted
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-xs font-bold truncate">{s.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
