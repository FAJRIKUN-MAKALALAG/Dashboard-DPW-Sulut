import React from 'react';
import {
  Camera,
  Upload,
  Trash2,
  IdCard,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { Member } from '../../types';
import { STATUS_BADGE_CONFIG } from '../../data/sulutRegions';

interface MemberBiodataTabProps {
  member: Member;
  canEdit: boolean;
  isUploadingPhoto: boolean;
  onPhotoUploadClick: () => void;
  onRemovePhoto: () => void;
}

export const MemberBiodataTab: React.FC<MemberBiodataTabProps> = ({
  member,
  canEdit,
  isUploadingPhoto,
  onPhotoUploadClick,
  onRemovePhoto,
}) => {
  const statusConfig = STATUS_BADGE_CONFIG[member.status];

  return (
    <div className="space-y-6">
      {/* Photo Management Row */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Manajemen Foto Profil Kader
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {member.fotoProfilUrl
                ? 'Foto profil tersimpan dan digunakan di kartu e-KTA digital.'
                : 'Belum ada foto profil. Anda dapat mengunggah foto kader berjas atau berbusana resmi Partai NasDem.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPhotoUploadClick}
            disabled={isUploadingPhoto || !canEdit}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span>{member.fotoProfilUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
          </button>
          {member.fotoProfilUrl && canEdit && (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="btn-white text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer"
              title="Hapus Foto Profil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Data Kependudukan */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <IdCard className="w-4 h-4" />
            <span>Data Identitas & Kependudukan</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Nomor Induk Kependudukan (NIK)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white" data-tabular="true">
                {member.nik}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Nama Lengkap</span>
              <span className="font-semibold text-slate-900 dark:text-white">{member.namaLengkap}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Nomor HP / WhatsApp</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {member.nomorHP || '-'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Verifikasi Berkas KTP</span>
              <span className="flex items-center gap-1 font-semibold">
                {member.fotoKtpUrl ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi KTP
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Menunggu Unggah KTP
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Struktur & Penugasan Partai */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <MapPin className="w-4 h-4" />
            <span>Struktur Partai & Wilayah Kerja</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Nomor e-KTA Partai NasDem</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400" data-tabular="true">
                {member.nomorEKTA}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tingkat DPD (Kabupaten/Kota)</span>
              <span className="font-semibold text-slate-900 dark:text-white">{member.dpd}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tingkat DPC (Kecamatan)</span>
              <span className="font-medium text-slate-900 dark:text-white">Kec. {member.dpc}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tingkat DPRt (Desa/Kelurahan)</span>
              <span className="font-medium text-slate-900 dark:text-white">{member.dprt || '-'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Status Kepengurusan Ber-SK</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {member.isPengurus ? (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Pengurus {member.tingkatKepengurusan || 'DPW'}
                  </span>
                ) : (
                  <span className="text-slate-500">Anggota Biasa (Non-Pengurus)</span>
                )}
              </span>
            </div>

            {member.nomorSK && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nomor SK Resmi</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {member.nomorSK}
                </span>
              </div>
            )}

            {member.kodeReferral && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Kode Referral Perekrut (Unik)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  {member.kodeReferral}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Penugasan / Jabatan</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{member.jabatan}</span>
            </div>

            {member.email && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{member.email}</span>
              </div>
            )}

            {member.sosmed && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Media Sosial</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{member.sosmed}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tanggal Bergabung Resmi</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {member.tanggalBergabung}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Box */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Status Keanggotaan & Kebijakan Suara
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
          >
            {member.status}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {member.catatanMutasi ||
            'Tidak ada catatan mutasi. Anggota berstatus aktif dan terhitung dalam validasi faktual DPW.'}
        </p>
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Terakhir diubah: {member.terakhirDiubah || '-'}</span>
          <span>Operator: {member.diubahOleh || 'Sistem DPW'}</span>
        </div>
      </div>
    </div>
  );
};
