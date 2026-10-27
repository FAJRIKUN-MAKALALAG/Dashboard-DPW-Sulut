import React from 'react';
import {
  IdCard,
  Upload,
  Sparkles,
  Trash2,
  ZoomIn,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Member } from '../../types';

interface MemberKtpTabProps {
  member: Member;
  canEdit: boolean;
  isUploadingKtp: boolean;
  onKtpUploadClick: () => void;
  onGenerateSimulatedKtp: () => void;
  onRemoveKtp: () => void;
  isKtpZoomed: boolean;
  setIsKtpZoomed: (zoomed: boolean) => void;
}

export const MemberKtpTab: React.FC<MemberKtpTabProps> = ({
  member,
  canEdit,
  isUploadingKtp,
  onKtpUploadClick,
  onGenerateSimulatedKtp,
  onRemoveKtp,
  isKtpZoomed,
  setIsKtpZoomed,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <IdCard className="w-4 h-4 text-blue-500" />
            <span>Arsip Dokumen KTP Elektronik Anggota</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Dokumen KTP digunakan oleh Admin DPW &amp; Bappilu untuk verifikasi NIK faktual dan pencocokan data pemilih.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onKtpUploadClick}
            disabled={isUploadingKtp || !canEdit}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>{member.fotoKtpUrl ? 'Ganti Foto KTP' : 'Unggah Foto KTP'}</span>
          </button>

          <button
            type="button"
            onClick={onGenerateSimulatedKtp}
            disabled={!canEdit}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer disabled:opacity-40"
            title="Hasilkan simulasi e-KTP resmi berdasarkan NIK dan identitas kader"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hasilkan e-KTP Otomatis</span>
          </button>

          {member.fotoKtpUrl && canEdit && (
            <button
              type="button"
              onClick={onRemoveKtp}
              className="btn-white text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer"
              title="Hapus Arsip KTP"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KTP Preview Area */}
      {member.fotoKtpUrl ? (
        <div className="space-y-3">
          <div className="relative group max-w-2xl mx-auto rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-xl bg-slate-950">
            <img
              src={member.fotoKtpUrl}
              alt={`KTP ${member.namaLengkap}`}
              className="w-full h-auto object-contain max-h-[380px] mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
            />

            {/* Overlay action bar */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
              <div className="text-xs">
                <span className="font-bold block">{member.namaLengkap}</span>
                <span className="font-mono text-[11px] text-amber-400">NIK: {member.nik}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKtpZoomed(true)}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg"
              >
                <ZoomIn className="w-4 h-4 text-blue-500" />
                <span>Perbesar Layar Penuh</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Arsip KTP Terverifikasi untuk NIK {member.nik}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsKtpZoomed(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Buka Tampilan Zoom</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <IdCard className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Dokumen KTP untuk Kader Ini
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin dapat mengunggah foto KTP asli hasil foto kamera/scan, atau menggunakan generator otomatis e-KTP resmi berbasis NIK 16 digit.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onKtpUploadClick}
              disabled={!canEdit}
              className="btn-white flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Pilih Berkas Foto KTP</span>
            </button>
            <button
              type="button"
              onClick={onGenerateSimulatedKtp}
              disabled={!canEdit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-sm transition-colors disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Hasilkan e-KTP Otomatis</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Zoom Modal for KTP */}
      {isKtpZoomed && member.fotoKtpUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsKtpZoomed(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">
                  Arsip Dokumen KTP: {member.namaLengkap} ({member.nik})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsKtpZoomed(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/50">
              <img
                src={member.fotoKtpUrl}
                alt={`KTP ${member.namaLengkap}`}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>DPW Partai NasDem Sulawesi Utara · Arsip Faktual</span>
              <button
                type="button"
                onClick={() => setIsKtpZoomed(false)}
                className="btn-white px-3 py-1 text-xs rounded-lg cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
