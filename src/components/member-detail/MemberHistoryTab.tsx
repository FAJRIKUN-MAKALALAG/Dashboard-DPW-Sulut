import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Member } from '../../types';

interface MemberHistoryTabProps {
  member: Member;
}

export const MemberHistoryTab: React.FC<MemberHistoryTabProps> = ({ member }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white mb-1">
          Catatan Audit &amp; Riwayat Mutasi Kader
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
          Setiap perubahan data identitas, foto, maupun status keanggotaan tercatat secara kronologis dalam sistem shadow database DPW.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Pembaruan Terakhir Data Anggota
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {member.terakhirDiubah || '2024-06-01'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Diperbarui oleh: <strong className="text-slate-800 dark:text-slate-200">{member.diubahOleh || 'Sistem DPW'}</strong>
            </p>
            {member.catatanMutasi && (
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 italic border border-slate-200/60 dark:border-slate-800 text-[11px]">
                "{member.catatanMutasi}"
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Registrasi Anggota &amp; Penerbitan e-KTA
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {member.tanggalBergabung}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Kader resmi terdaftar di struktur DPW Partai NasDem Provinsi Sulawesi Utara.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
