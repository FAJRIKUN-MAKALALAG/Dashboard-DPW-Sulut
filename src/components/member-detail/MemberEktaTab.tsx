import React from 'react';
import { Printer, QrCode } from 'lucide-react';
import { Member } from '../../types';
import { STATUS_BADGE_CONFIG } from '../../data/sulutRegions';
import { getInitials, getAvatarColor } from '../../utils/imageUtils';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';

interface MemberEktaTabProps {
  member: Member;
  onOpenCardModal: (member: Member) => void;
}

export const MemberEktaTab: React.FC<MemberEktaTabProps> = ({
  member,
  onOpenCardModal,
}) => {
  const statusConfig = STATUS_BADGE_CONFIG[member.status];
  const avatarColor = getAvatarColor(member.namaLengkap);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">
            Kartu Tanda Anggota Elektronik (e-KTA)
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Standar kartu digital DPW Partai NasDem Sulawesi Utara dilengkapi Chip ID &amp; QR Verifikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCardModal(member)}
          className="btn-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-blue-500" />
          <span>Mode Cetak / Unduh</span>
        </button>
      </div>

      {/* Rendered Live e-KTA Card */}
      <div className="max-w-xl mx-auto">
        <div className="relative w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden shadow-2xl p-5 flex flex-col justify-between border border-amber-500/40 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white select-none">
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
