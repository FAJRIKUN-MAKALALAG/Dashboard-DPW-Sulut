import React from 'react';
import {
  Camera,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Award,
  MapPin,
  Edit3,
  IdCard,
  Phone,
} from 'lucide-react';
import { Member } from '../../types';
import { STATUS_BADGE_CONFIG } from '../../data/sulutRegions';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';
import { getDewanWilayahInfo } from '../../utils/structureReadinessUtils';

interface MemberHeroCardProps {
  member: Member;
  canEdit: boolean;
  isUploadingPhoto: boolean;
  onPhotoUploadClick: () => void;
  onOpenStatusChange: (member: Member) => void;
  onOpenEdit: (member: Member) => void;
  onOpenCardModal: (member: Member) => void;
  onWhatsApp: () => void;
}

export const MemberHeroCard: React.FC<MemberHeroCardProps> = ({
  member,
  canEdit,
  isUploadingPhoto,
  onPhotoUploadClick,
  onOpenStatusChange,
  onOpenEdit,
  onOpenCardModal,
  onWhatsApp,
}) => {
  const statusConfig = STATUS_BADGE_CONFIG[member.status];
  const avatarColor = getAvatarColor(member.namaLengkap);

  return (
    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
      {/* Background geometric accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* Photo & Identity Left */}
        <div className="flex items-start sm:items-center gap-4">
          {/* Profile Photo with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-slate-800 flex items-center justify-center relative">
              {member.fotoProfilUrl ? (
                <img
                  src={resolveImageUrl(member.fotoProfilUrl)}
                  alt={member.namaLengkap}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                >
                  <span className="text-2xl font-bold font-mono">
                    {getInitials(member.namaLengkap)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-1">
                    NasDem
                  </span>
                </div>
              )}

              {/* Camera overlay hover button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={onPhotoUploadClick}
                  disabled={isUploadingPhoto}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-medium cursor-pointer"
                  title="Unggah / Ubah Foto Profil"
                >
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>{member.fotoProfilUrl ? 'Ubah' : 'Unggah'}</span>
                </button>
              )}
            </div>

            {/* Status dot badge */}
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 ${
                member.status === 'Aktif' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
              title={`Status: ${member.status}`}
            >
              {member.status === 'Aktif' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Identity Text */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-400 text-slate-950">
                {member.nomorEKTA}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
              >
                {member.status}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {member.namaLengkap}
            </h2>

            {(() => {
              const dewanInfo = getDewanWilayahInfo(member);
              if (dewanInfo.isDewan) {
                return (
                  <div className="flex flex-wrap items-center gap-2 py-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-xs ${
                        dewanInfo.category === 'PERTIMBANGAN'
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-purple-500 text-white border-purple-400'
                      }`}
                    >
                      {dewanInfo.category === 'PERTIMBANGAN' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                      ) : (
                        <Award className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                      <span>{dewanInfo.councilName}</span>
                      <span>·</span>
                      <span className="font-extrabold">{dewanInfo.shortLocationLabel}</span>
                    </span>
                    <span className="text-amber-300 font-bold text-xs sm:text-sm">
                      {member.jabatan}
                    </span>
                  </div>
                );
              }
              return (
                <p className="text-amber-300 font-semibold text-xs sm:text-sm">
                  {member.jabatan}
                </p>
              );
            })()}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {member.dpd} · Kec. {member.dpc}
              </span>
              <span>·</span>
              <span className="font-mono text-slate-400">NIK: {member.nik}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
          {/* Ubah Status */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onOpenStatusChange(member)}
            className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
            title="Ubah Status Keanggotaan"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Ubah Status</span>
          </button>

          {/* Edit Data */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onOpenEdit(member)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
            title="Edit Data Lengkap Kader"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Data</span>
          </button>

          {/* Pratinjau KTA */}
          <button
            type="button"
            onClick={() => onOpenCardModal(member)}
            className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            title="Lihat Kartu e-KTA Digital"
          >
            <IdCard className="w-3.5 h-3.5 text-blue-500" />
            <span>e-KTA Digital</span>
          </button>

          {/* WhatsApp */}
          {member.nomorHP && member.nomorHP !== '-' && (
            <button
              type="button"
              onClick={onWhatsApp}
              className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              title="Hubungi Kader via WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
