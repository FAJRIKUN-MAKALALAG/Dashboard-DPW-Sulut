import React from 'react';
import { Printer, QrCode, Globe, Download, Sparkles } from 'lucide-react';
import { Member } from '../../types';
import { STATUS_BADGE_CONFIG } from '../../data/sulutRegions';
import { getInitials, getAvatarColor } from '../../utils/imageUtils';
import { isOfficialDppEkta, getDppKtaCardUrl } from '../../dpp-ekta';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';

interface MemberEktaTabProps {
  member: Member;
  onOpenCardModal: (member: Member) => void;
  onOpenDppEktaModal?: (member: Member) => void;
}

export const MemberEktaTab: React.FC<MemberEktaTabProps> = ({
  member,
  onOpenCardModal,
  onOpenDppEktaModal,
}) => {
  const statusConfig = STATUS_BADGE_CONFIG[member.status];
  const avatarColor = getAvatarColor(member.namaLengkap);
  const hasOfficialDpp = isOfficialDppEkta(member.nomorEKTA);

  return (
    <div className="space-y-5">
      {/* Status e-KTA Pusat DPP Banner */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border text-xs ${
          hasOfficialDpp
            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Globe className={`w-4 h-4 ${hasOfficialDpp ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <h4 className="font-bold text-slate-900 dark:text-white">
              {hasOfficialDpp
                ? `Terdaftar Resmi di Digital NasDem Pusat (No. e-KTA: ${member.nomorEKTA})`
                : 'Belum Terdaftar e-KTA Pusat (Masih Nomor Lokal DPW)'}
            </h4>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            {hasOfficialDpp
              ? 'Anggota ini telah memiliki 16 digit Nomor e-KTA resmi yang diterbitkan langsung oleh portal Digital NasDem DPP.'
              : 'Daftarkan anggota ini pada modul Pendaftaran e-KTA Pusat (DPP) untuk menerbitkan 16 digit Nomor e-KTA resmi DPP.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasOfficialDpp ? (
            <a
              href={getDppKtaCardUrl(member.nomorEKTA, true)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Kartu Resmi DPP</span>
            </a>
          ) : (
            onOpenDppEktaModal && (
              <button
                type="button"
                onClick={() => onOpenDppEktaModal(member)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A3282] hover:bg-[#21409A] text-white shadow-2xs cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFDD00]" />
                <span>Daftarkan e-KTA Pusat (DPP)</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Jika sudah punya e-KTA resmi DPP 16 digit, tampilkan juga kartu asli dari server DPP */}
      {hasOfficialDpp && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Kartu e-KTA Resmi Digital NasDem Pusat (DPP)
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {member.nomorEKTA}
            </span>
          </div>
          <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-slate-100 dark:bg-slate-950">
            <img
              src={getDppKtaCardUrl(member.nomorEKTA)}
              alt={`Kartu e-KTA DPP ${member.namaLengkap}`}
              className="w-full h-auto object-contain block"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">
            Kartu Tanda Anggota Elektronik (e-KTA DPW Sulut)
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Standar kartu digital DPW Partai NasDem Sulawesi Utara dilengkapi Chip ID &amp; QR Verifikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCardModal(member)}
          className="btn-white flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg font-semibold cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-blue-500" />
          <span>Mode Cetak / Unduh</span>
        </button>
      </div>

      {/* Rendered Live e-KTA Card */}
      <div className="max-w-xl mx-auto">
        <div className="relative w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden shadow-2xl p-3 sm:p-5 flex flex-col justify-between border border-amber-500/40 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white select-none">
          {/* Background watermarks */}
          <div className="absolute inset-0 bg-radial from-blue-700/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Logo & Title */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={nasdemLogo}
                alt="Partai NasDem"
                className="h-9 w-auto object-contain drop-shadow"
              />
              <div className="text-left">
                <h4 className="text-xs font-bold tracking-tight text-white leading-tight">
                  PARTAI NASDEM
                </h4>
                <p className="text-[9px] text-amber-300 font-medium">
                  DPW SULAWESI UTARA
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] uppercase tracking-wider font-mono text-blue-200 block">
                KARTU TANDA ANGGOTA
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                e-KTA DIGITAL
              </span>
            </div>
          </div>

          {/* Card Middle: Photo + Info */}
          <div className="relative z-10 grid grid-cols-4 gap-3 my-auto items-center">
            {/* Photo or Chip */}
            <div className="col-span-1 flex flex-col items-center gap-1">
              <div className="w-16 h-20 rounded-lg bg-slate-800 border border-amber-400/60 overflow-hidden flex items-center justify-center relative shadow-inner">
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
                    <div className="w-4 h-2 rounded bg-amber-400/40 border border-amber-400/70 mt-1"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Member Info */}
            <div className="col-span-3 space-y-1 text-left">
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-mono block">
                  Nama Lengkap
                </span>
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {member.namaLengkap}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                <div>
                  <span className="text-[7px] text-slate-400 uppercase block">NIK KTP</span>
                  <span className="text-slate-200 font-bold" data-tabular="true">
                    {member.nik}
                  </span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-400 uppercase block">No e-KTA Pusat</span>
                  <span className="text-amber-400 font-bold" data-tabular="true">
                    {member.nomorEKTA}
                  </span>
                </div>
              </div>

              <div className="text-[9px]">
                <span className="text-[7px] text-slate-400 uppercase font-mono block">
                  Jabatan / Penugasan
                </span>
                <p className="text-amber-300 font-semibold truncate">{member.jabatan}</p>
              </div>

              <div className="text-[8px] text-slate-300 truncate">
                <span>{member.dpd}</span> · <span>Kec. {member.dpc}</span>
              </div>
            </div>
          </div>

          {/* Card Bottom */}
          <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status Validasi:</span>
              <span className={`font-semibold ${statusConfig.textClass}`}>
                {member.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <QrCode className="w-3 h-3 text-slate-300" />
              <span>SECURE-ID-NASDEM-SULUT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
