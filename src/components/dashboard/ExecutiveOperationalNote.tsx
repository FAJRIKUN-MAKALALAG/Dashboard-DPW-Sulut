import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ExecutiveOperationalNote: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl flex items-start gap-3.5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
      <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          Catatan Operasional untuk Pimpinan / Atasan:
        </h4>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          Data keanggotaan di dashboard ini merupakan data operasional riil. Ketika kader penggerak
          merekrut anggota baru, sistem otomatis menghubungkan nama kader perekrut dengan anggota
          bersangkutan dan menaruh lokasinya ke DPRt berdasarkan alamat KTP secara akuntabel.
        </p>
      </div>
    </div>
  );
};
