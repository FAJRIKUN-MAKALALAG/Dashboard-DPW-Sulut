import React, { useRef, useState } from 'react';
import {
  IdCard,
  Camera,
  Trash2,
  Upload,
  User,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Member } from '../../types';
import { getInitials, getAvatarColor } from '../../utils/imageUtils';

export const AGAMA_OPTIONS = [
  'Kristen Protestan',
  'Islam',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
];

export const PEKERJAAN_SUGGESTIONS = [
  'Wiraswasta',
  'Karyawan Swasta',
  'Petani / Pekebun',
  'Nelayan / Perikanan',
  'Pedagang',
  'Pegawai Negeri Sipil (PNS)',
  'Pegawai BUMN / BUMD',
  'Mengurus Rumah Tangga',
  'Pelajar / Mahasiswa',
  'Pensiunan',
  'Tenaga Kesehatan',
  'Guru / Dosen',
  'Sopir / Transportasi',
];

interface RegistrationStep2IdentityProps {
  fotoKtpUrl: string;
  fotoProfilUrl: string;
  onRescanKtp: () => void;
  onUploadProfilePhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearProfilePhoto: () => void;
  isUploadingPhoto?: boolean;
  nik: string;
  onChangeNik: (val: string) => void;
  cleanNik: string;
  duplicateMember: Member | null;
  nikDecodedInfo: {
    isValidFormat: boolean;
    dpdName?: string;
    jenisKelamin?: 'Laki-laki' | 'Perempuan';
  };
  onSyncNikDecoder?: () => void;
  namaLengkap: string;
  onChangeNamaLengkap: (val: string) => void;
  tempatLahir: string;
  onChangeTempatLahir: (val: string) => void;
  tanggalLahir: string;
  onChangeTanggalLahir: (val: string) => void;
  jenisKelamin: string;
  onChangeJenisKelamin: (val: 'Laki-laki' | 'Perempuan' | '') => void;
  golonganDarah?: string;
  onChangeGolonganDarah?: (val: string) => void;
  agama: string;
  onChangeAgama: (val: string) => void;
  pekerjaan: string;
  onChangePekerjaan: (val: string) => void;
}

export const RegistrationStep2Identity: React.FC<RegistrationStep2IdentityProps> = ({
  fotoKtpUrl,
  fotoProfilUrl,
  onRescanKtp,
  onUploadProfilePhoto,
  onClearProfilePhoto,
  isUploadingPhoto = false,
  nik,
  onChangeNik,
  cleanNik,
  duplicateMember,
  nikDecodedInfo,
  onSyncNikDecoder,
  namaLengkap,
  onChangeNamaLengkap,
  tempatLahir,
  onChangeTempatLahir,
  tanggalLahir,
  onChangeTanggalLahir,
  jenisKelamin,
  onChangeJenisKelamin,
  golonganDarah = '',
  onChangeGolonganDarah,
  agama,
  onChangeAgama,
  pekerjaan,
  onChangePekerjaan,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [showMobileKtpPreview, setShowMobileKtpPreview] = useState<boolean>(false);
  const avatarColor = getAvatarColor(namaLengkap || 'NasDem');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Mode Mobile (< md): Bar Ringkas Pasfoto & Toggle Foto KTP agar form mudah diisi */}
      <div className="md:hidden p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
              {fotoProfilUrl ? (
                <img src={fotoProfilUrl} alt="Foto Kader" className="w-full h-full object-cover" />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                >
                  <span className="text-xs font-bold font-mono">
                    {getInitials(namaLengkap || 'ND')}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Pasfoto & Dokumen e-KTP
              </span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="btn-white px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer"
                >
                  {fotoProfilUrl ? 'Ganti Pasfoto' : 'Unggah Pasfoto'}
                </button>
                <button
                  type="button"
                  onClick={onRescanKtp}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 underline cursor-pointer"
                >
                  {fotoKtpUrl ? 'Scan Ulang' : 'Scan KTP'}
                </button>
              </div>
            </div>
          </div>

          {fotoKtpUrl && (
            <button
              type="button"
              onClick={() => setShowMobileKtpPreview((prev) => !prev)}
              className="btn-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {showMobileKtpPreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Tutup KTP</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat KTP</span>
                </>
              )}
            </button>
          )}
        </div>

        {fotoKtpUrl && showMobileKtpPreview && (
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
            <img
              src={fotoKtpUrl}
              alt="Referensi e-KTP"
              className="max-h-40 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Mode Tablet & Desktop (md+): Kartu Referensi Visual e-KTP & Pasfoto Berdampingan */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 items-center">
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-slate-500" />
              <span>Referensi Visual e-KTP</span>
            </span>
            <button
              type="button"
              onClick={onRescanKtp}
              className="text-[11px] font-semibold text-[#1A3282] dark:text-slate-300 hover:underline cursor-pointer"
            >
              {fotoKtpUrl ? 'Scan / Ganti Foto KTP' : '+ Scan / Unggah Foto KTP'}
            </button>
          </div>
          {fotoKtpUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-40 flex items-center justify-center">
              <img
                src={fotoKtpUrl}
                alt="Referensi e-KTP"
                className="max-h-40 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
              <IdCard className="w-5 h-5 opacity-60" />
              <span>Pengisian Tanpa Foto e-KTP (Mode Input Manual)</span>
            </div>
          )}
        </div>

        {/* Pasfoto Kader */}
        <div className="md:col-span-5 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Pasfoto Kader</span>
            </label>
            {fotoProfilUrl && (
              <button
                type="button"
                onClick={onClearProfilePhoto}
                className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {fotoProfilUrl ? (
                <img src={fotoProfilUrl} alt="Foto Kader" className="w-full h-full object-cover" />
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
                className="btn-white w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>{fotoProfilUrl ? 'Ganti Pasfoto' : 'Unggah Pasfoto'}</span>
              </button>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Otomatis terambil dari foto KTP atau unggah pasfoto baru.
              </p>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadProfilePhoto}
      />

      {/* Form Identitas KTP (Responsif: 1 Kolom di Mobile, 2-3 Kolom di Tablet & Desktop) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Identitas Sesuai e-KTP</span>
          </span>
          {nikDecodedInfo.isValidFormat && (
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              Kode NIK: {nikDecodedInfo.dpdName || 'Luar Sulut'} · {nikDecodedInfo.jenisKelamin}
            </span>
          )}
        </div>

        {/* Baris 1: NIK & Nama Lengkap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                NIK e-KTP (16 Digit) <span className="text-rose-500">*</span>
              </label>
              {cleanNik.length === 16 && onSyncNikDecoder && (
                <button
                  type="button"
                  onClick={onSyncNikDecoder}
                  className="text-[11px] font-semibold text-[#1A3282] dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Sinkronkan Tanggal Lahir, Jenis Kelamin & Wilayah dari 16 digit NIK"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sinkronkan dari NIK</span>
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={nik}
              onChange={(e) => onChangeNik(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="16 digit angka NIK e-KTP"
              className={`w-full bg-white dark:bg-slate-950 border rounded-xl px-3 py-2.5 text-xs sm:text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500 transition-colors ${
                duplicateMember
                  ? 'border-rose-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              required
            />
            <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
              <span>{cleanNik.length}/16 digit</span>
              {cleanNik.length === 16 && !duplicateMember && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> NIK Valid
                </span>
              )}
              {duplicateMember && (
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 truncate">
                  <AlertCircle className="w-3 h-3 shrink-0" /> Terdaftar: {duplicateMember.namaLengkap}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nama Lengkap (Sesuai e-KTP) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => onChangeNamaLengkap(e.target.value)}
              placeholder="Nama lengkap beserta gelar jika ada"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
              required
            />
          </div>
        </div>

        {/* Baris 2: Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Golongan Darah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Tempat Lahir <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={tempatLahir}
              onChange={(e) => onChangeTempatLahir(e.target.value)}
              placeholder="Contoh: Manado"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Tanggal Lahir <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="date"
              value={tanggalLahir}
              onChange={(e) => onChangeTanggalLahir(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <select
              value={jenisKelamin}
              onChange={(e) => onChangeJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan' | '')}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            >
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Golongan Darah <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <select
              value={golonganDarah}
              onChange={(e) => onChangeGolonganDarah?.(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            >
              <option value="">- Tidak Tahu (Opsional) -</option>
              <option value="O">Golongan O</option>
              <option value="A">Golongan A</option>
              <option value="B">Golongan B</option>
              <option value="AB">Golongan AB</option>
            </select>
          </div>
        </div>

        {/* Baris 3: Agama & Pekerjaan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Agama <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <select
              value={agama}
              onChange={(e) => onChangeAgama(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            >
              <option value="">-- Pilih Agama --</option>
              {AGAMA_OPTIONS.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Pekerjaan (Sesuai e-KTP)
            </label>
            <input
              type="text"
              list="ktp-pekerjaan-suggestions"
              value={pekerjaan}
              onChange={(e) => onChangePekerjaan(e.target.value)}
              placeholder="Contoh: Wiraswasta / Karyawan Swasta"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
            <datalist id="ktp-pekerjaan-suggestions">
              {PEKERJAAN_SUGGESTIONS.map((pk) => (
                <option key={pk} value={pk} />
              ))}
            </datalist>
          </div>
        </div>
      </div>
    </div>
  );
};
