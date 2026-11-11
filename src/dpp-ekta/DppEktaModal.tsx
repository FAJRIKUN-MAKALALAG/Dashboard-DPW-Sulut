import React from 'react';
import { X, Globe, ShieldCheck } from 'lucide-react';
import { Member } from '../types';
import { DppEktaRegistrationPanel } from './DppEktaRegistrationPanel';

interface DppEktaModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialMember?: Member | null;
  onMemberEktaUpdated?: (nik: string, nokta: string) => void;
}

export const DppEktaModal: React.FC<DppEktaModalProps> = ({
  isOpen,
  onClose,
  members,
  initialMember = null,
  onMemberEktaUpdated,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A3282] text-[#FFDD00] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Modul Pendaftaran e-KTA Pusat (Digital NasDem DPP)
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Terpisah dari Pendaftaran Keanggotaan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Penerbitan langsung 16 digit Nomor e-KTA Resmi DPP &amp; Kartu Digital dari portal pusat tanpa OTP anggota
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <DppEktaRegistrationPanel
            members={members}
            initialMember={initialMember}
            onMemberEktaUpdated={onMemberEktaUpdated}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

