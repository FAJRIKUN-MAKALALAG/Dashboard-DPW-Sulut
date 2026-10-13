import React from 'react';
import { Member } from '../types';
import { STATUS_BADGE_CONFIG } from '../data/sulutRegions';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import { getInitials, getAvatarColor } from '../utils/imageUtils';
import { X, Printer, Shield, QrCode, CheckCircle2, AlertTriangle, IdCard } from 'lucide-react';

interface EKtaCardModalProps {
  isOpen?: boolean;
  member: Member | null;
  onClose: () => void;
}

export const EKtaCardModal: React.FC<EKtaCardModalProps> = ({ isOpen = true, member, onClose }) => {
  if (!isOpen || !member) return null;

  const statusConfig = STATUS_BADGE_CONFIG[member.status];
  const avatarColor = getAvatarColor(member.namaLengkap);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Pratinjau e-KTA Digital Partai NasDem Sulut
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col items-center flex-1 overflow-y-auto">
          {/* Physical e-KTA simulation card */}
          <div className="w-full max-w-md aspect-[1.58/1] rounded-2xl p-5 relative overflow-hidden shadow-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-900 text-white flex flex-col justify-between">
            {/* Background watermark / security pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Bar on Card */}
            <div className="relative z-10 flex items-start justify-between border-b border-blue-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={nasdemLogo}
                  alt="Logo Partai NasDem"
                  className="h-9 w-auto object-contain shrink-0 drop-shadow"
                />
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                    PARTAI NASDEM
                  </h4>
                  <p className="text-[9px] font-bold text-white uppercase tracking-wider">
                    DPW PROVINSI SULAWESI UTARA
                  </p>
                  <p className="text-[8px] text-blue-200/80 italic font-sans tracking-tight">
                    Gerakan Perubahan · Restorasi Indonesia
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider font-mono text-blue-200 block">
                  KARTU TANDA ANGGOTA
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">e-KTA DIGITAL</span>
              </div>
            </div>

            {/* Middle Section: Member Identity */}
            <div className="relative z-10 grid grid-cols-4 gap-3 my-auto items-center">
              {/* Photo box with chip */}
              <div className="col-span-1 flex flex-col items-center gap-1.5">
                <div className="w-16 h-20 rounded-lg bg-slate-800 border border-amber-500/40 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                  {member.fotoProfilUrl ? (
                    <img
                      src={member.fotoProfilUrl}
                      alt={member.namaLengkap}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                    >
                      <span className="text-base font-bold font-mono">
                        {getInitials(member.namaLengkap)}
                      </span>
                      <div className="w-6 h-3 rounded bg-amber-400/40 border border-amber-400/60 mt-1 flex items-center justify-center">
                        <div className="w-4 h-1 border-t border-b border-amber-300/60"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data fields */}
              <div className="col-span-3 space-y-1 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Nama Lengkap</span>
                  <p className="text-sm font-bold text-white tracking-tight truncate">
                    {member.namaLengkap}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">NIK KTP</span>
                    <span className="text-slate-200 font-bold" data-tabular="true">{member.nik}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">No e-KTA Pusat</span>
                    <span className="text-amber-400 font-bold" data-tabular="true">{member.nomorEKTA}</span>
                  </div>
                </div>

                <div className="text-[10px]">
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Penugasan / Jabatan</span>
                  <p className="text-amber-300 font-semibold truncate">{member.jabatan}</p>
                </div>

                <div className="text-[9px] text-slate-300 truncate">
                  <span>{member.dpd}</span> · <span>Kec. {member.dpc}</span> · <span>{member.dprt}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status Validasi:</span>
                <span className={`font-semibold ${statusConfig.textClass}`}>
                  {member.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <QrCode className="w-3.5 h-3.5 text-slate-300" />
                <span>SECURE-ID-NASDEM-SULUT</span>
              </div>
            </div>
          </div>

          {/* Operational Details below card */}
          <div className="w-full mt-5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Tanggal Registrasi Awal:</span>
              <span className="text-slate-900 dark:text-white font-mono font-medium">{member.tanggalBergabung}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Nomor Kontak/WhatsApp:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">{member.nomorHP}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Status Dokumen KTP:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {member.fotoKtpUrl ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi KTP Elektronik
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Belum Unggah KTP
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="btn-white flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-500" />
            <span>Cetak Kartu Fisik</span>
          </button>
          <button
            onClick={onClose}
            className="btn-white px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
