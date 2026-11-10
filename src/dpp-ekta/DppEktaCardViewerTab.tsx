import React from 'react';
import { ShieldCheck, Check, Copy, Download, ExternalLink } from 'lucide-react';
import { dppEktaService, DppCreateKtaResult } from './dppEktaService';

interface DppEktaCardViewerTabProps {
  createdResult: DppCreateKtaResult | null;
  viewingNokta: string;
  setViewingNokta: (v: string) => void;
  viewingMemberName: string;
  copiedEkta: boolean;
  onCopyEkta: (text: string) => void;
}

export const DppEktaCardViewerTab: React.FC<DppEktaCardViewerTabProps> = ({
  createdResult,
  viewingNokta,
  setViewingNokta,
  viewingMemberName,
  copiedEkta,
  onCopyEkta,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
      {createdResult?.success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{createdResult.message}</span>
          </div>
          {createdResult.nomor_ekta && (
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <span>
                Nomor e-KTA Resmi DPP:{' '}
                <strong className="font-mono text-sm">{createdResult.nomor_ekta}</strong>
              </span>
              <button
                type="button"
                onClick={() => onCopyEkta(createdResult.nomor_ekta!)}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedEkta ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEkta ? 'Tersalin' : 'Salin No. e-KTA'}</span>
              </button>
              {createdResult.email && (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Akun DPP: <strong>{createdResult.email}</strong> (Password:{' '}
                  <code>{createdResult.password}</code>)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input manual cek kartu berdasarkan Nomor e-KTA DPP */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Nomor e-KTA Resmi DPP (16 Digit)
          </label>
          <input
            type="text"
            value={viewingNokta}
            onChange={(e) => setViewingNokta(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Masukkan 16 digit Nomor e-KTA DPP (contoh: 2502449098878709)"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>

        {viewingNokta.length >= 12 && (
          <a
            href={dppEktaService.getKtaCardUrl(viewingNokta, true)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Kartu e-KTA (PNG HD)</span>
          </a>
        )}
      </div>

      {viewingNokta.length >= 12 ? (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          {viewingMemberName && (
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kartu e-KTA Resmi DPP — {viewingMemberName} ({viewingNokta})
            </div>
          )}
          <img
            src={
              createdResult?.nomor_ekta === viewingNokta && createdResult?.kta_card_base64
                ? createdResult.kta_card_base64
                : dppEktaService.getKtaCardUrl(viewingNokta)
            }
            alt={`Kartu e-KTA ${viewingNokta}`}
            className="max-w-full sm:max-w-lg rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
          />
          <a
            href="https://digital.partainasdem.id/v1/index?page=iuran/pendaftaran"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-[#1A3282] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Buka Daftar Anggota di Portal Digital NasDem Pusat</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">
          Pilih anggota yang sudah memiliki e-KTA DPP pada Tab 1 atau terbitkan e-KTA baru pada Tab 2 untuk melihat dan mengunduh kartu resmi DPP.
        </div>
      )}
    </div>
  );
};
