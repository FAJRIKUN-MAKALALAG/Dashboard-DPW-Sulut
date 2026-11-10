import React, { useRef } from 'react';
import { Camera, Trash2, Upload, IdCard, Sparkles } from 'lucide-react';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';

interface EditMemberPhotoKtpSectionProps {
  namaLengkap: string;
  fotoProfilUrl: string;
  onClearFotoProfil: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingPhoto: boolean;
  fotoKtpUrl: string;
  onClearFotoKtp: () => void;
  onKtpUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingKtp: boolean;
  onGenerateSimulatedKtp: () => void;
}

export const EditMemberPhotoKtpSection: React.FC<EditMemberPhotoKtpSectionProps> = ({
  namaLengkap,
  fotoProfilUrl,
  onClearFotoProfil,
  onPhotoUpload,
  isUploadingPhoto,
  fotoKtpUrl,
  onClearFotoKtp,
  onKtpUpload,
  isUploadingKtp,
  onGenerateSimulatedKtp,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const avatarColor = getAvatarColor(namaLengkap || 'NasDem');

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
        <Camera className="w-4 h-4" />
        <span>Foto Profil & Dokumen KTP Kader</span>
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo Profile Box */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Foto Profil Kader
            </label>
            {fotoProfilUrl && (
              <button
                type="button"
                onClick={onClearFotoProfil}
                className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-18 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {fotoProfilUrl ? (
                <img
                  src={resolveImageUrl(fotoProfilUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                >
                  <span className="text-sm font-bold font-mono">
                    {getInitials(namaLengkap || 'ND')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="btn-white w-full py-1.5 px-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>{fotoProfilUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
              </button>
              <p className="text-[10px] text-slate-400">Format JPG/PNG, maks 5MB.</p>
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoUpload}
          />
        </div>

        {/* KTP Document Box */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dokumen Foto KTP
            </label>
            {fotoKtpUrl && (
              <button
                type="button"
                onClick={onClearFotoKtp}
                className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {fotoKtpUrl ? (
                <img
                  src={resolveImageUrl(fotoKtpUrl)}
                  alt="Preview KTP"
                  className="w-full h-full object-cover"
                />
              ) : (
                <IdCard className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => ktpInputRef.current?.click()}
                  disabled={isUploadingKtp}
                  className="btn-white flex-1 py-1 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-blue-500" />
                  <span>{fotoKtpUrl ? 'Ganti' : 'Unggah'}</span>
                </button>
                <button
                  type="button"
                  onClick={onGenerateSimulatedKtp}
                  className="btn-white py-1 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  title="Hasilkan e-KTP otomatis"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Auto</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Scan KTP asli atau simulasi.</p>
            </div>
          </div>

          <input
            ref={ktpInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onKtpUpload}
          />
        </div>
      </div>
    </div>
  );
};

