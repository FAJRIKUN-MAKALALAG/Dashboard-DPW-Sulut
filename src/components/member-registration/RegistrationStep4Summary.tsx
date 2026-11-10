import React from 'react';
import { FileCheck2, Shield, Edit3, Globe } from 'lucide-react';
import { KtpImageQualityReport } from '../../ktp-scanner';
import { getInitials } from '../../utils/imageUtils';

interface RegistrationStep4SummaryProps {
  cleanNik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  pekerjaan: string;
  alamatLengkap: string;
  dpd: string;
  dpc: string;
  dprt: string;
  nomorHP: string;
  email: string;
  sosmed: string;
  fotoProfilUrl: string;
  fotoKtpUrl: string;
  ktpQualityReport: KtpImageQualityReport | null;
  roleBadgeText: string;
  recruiterLabel?: string;
  autoRegisterDpp?: boolean;
  onToggleAutoRegisterDpp?: (val: boolean) => void;
  onEditStep2?: () => void;
  onEditStep3?: () => void;
}

export const RegistrationStep4Summary: React.FC<RegistrationStep4SummaryProps> = ({
  cleanNik,
  namaLengkap,
  tempatLahir,
  tanggalLahir,
  jenisKelamin,
  agama,
  pekerjaan,
  alamatLengkap,
  dpd,
  dpc,
  dprt,
  nomorHP,
  email,
  sosmed,
  fotoProfilUrl,
  fotoKtpUrl,
  ktpQualityReport,
  roleBadgeText,
  recruiterLabel,
  autoRegisterDpp = true,
  onToggleAutoRegisterDpp,
  onEditStep2,
  onEditStep3,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner Konfirmasi */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A3282] text-white flex items-center justify-center shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Konfirmasi Akhir Pendaftaran Anggota
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pastikan seluruh data di bawah ini sudah sesuai sebelum disimpan ke database.
            </p>
          </div>
        </div>
        {ktpQualityReport && (
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shrink-0">
            e-KTP Terverifikasi ({ktpQualityReport.score}%)
          </span>
        )}
      </div>

      {/* Mode Mobile (< md): Kartu Ringkas Ala Mobile Banking */}
      <div className="md:hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* Identitas Header */}
        <div className="p-3.5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="w-12 h-15 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {fotoProfilUrl ? (
              <img src={fotoProfilUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold font-mono">{getInitials(namaLengkap || 'ND')}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {namaLengkap || '-'}
            </div>
            <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              NIK: {cleanNik}
            </div>
            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Shield className="w-2.5 h-2.5" />
              <span>{roleBadgeText}</span>
            </span>
          </div>
        </div>

        {/* Bagian 1: Data Diri */}
        <div className="p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">1. Data Diri e-KTP</span>
            {onEditStep2 && (
              <button
                type="button"
                onClick={onEditStep2}
                className="text-[11px] font-semibold text-[#1A3282] dark:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah</span>
              </button>
            )}
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500">TTL</span>
            <span className="font-medium text-slate-900 dark:text-white text-right">
              {tempatLahir || '-'}, {tanggalLahir || '-'}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500">Gender & Agama</span>
            <span className="font-medium text-slate-900 dark:text-white text-right">
              {jenisKelamin || '-'} · {agama || '-'}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500">Pekerjaan</span>
            <span className="font-medium text-slate-900 dark:text-white text-right">
              {pekerjaan || '-'}
            </span>
          </div>
        </div>

        {/* Bagian 2: Domisili & Kontak */}
        <div className="p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">2. Domisili & Kontak</span>
            {onEditStep3 && (
              <button
                type="button"
                onClick={onEditStep3}
                className="text-[11px] font-semibold text-[#1A3282] dark:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah</span>
              </button>
            )}
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500 shrink-0">Alamat</span>
            <span className="font-medium text-slate-900 dark:text-white text-right">
              {alamatLengkap || '-'}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500 shrink-0">Wilayah</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">
              {dpd} › {dpc} › {dprt || 'Umum'}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[11px]">
            <span className="text-slate-500">No. WhatsApp</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-right">
              {nomorHP || '-'}
            </span>
          </div>
          {recruiterLabel && (
            <div className="flex justify-between gap-2 text-[11px]">
              <span className="text-slate-500">Perekrut</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                {recruiterLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Tablet & Desktop (md+): 12-Column Split Layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-4">
        {/* Visual KTP & Profile Summary */}
        <div className="md:col-span-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col items-center text-center">
          <div className="w-20 h-24 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            {fotoProfilUrl ? (
              <img src={fotoProfilUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold font-mono">{getInitials(namaLengkap || 'ND')}</span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{namaLengkap || '-'}</div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold mt-0.5">
              NIK: {cleanNik}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              <Shield className="w-3 h-3" />
              <span>{roleBadgeText}</span>
            </div>
          </div>

          {fotoKtpUrl && (
            <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">Dokumen e-KTP</div>
              <img
                src={fotoKtpUrl}
                alt="KTP"
                className="w-full h-24 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Full Field Table Summary */}
        <div className="md:col-span-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Ringkasan Data Keanggotaan
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              {onEditStep2 && (
                <button
                  type="button"
                  onClick={onEditStep2}
                  className="font-semibold text-[#1A3282] dark:text-slate-300 hover:underline cursor-pointer"
                >
                  Ubah Data Diri
                </button>
              )}
              {onEditStep3 && (
                <button
                  type="button"
                  onClick={onEditStep3}
                  className="font-semibold text-[#1A3282] dark:text-slate-300 hover:underline cursor-pointer"
                >
                  Ubah Domisili & Kontak
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Tempat, Tanggal Lahir</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">
              {tempatLahir || '-'}, {tanggalLahir || '-'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Jenis Kelamin & Agama</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">
              {jenisKelamin || '-'} · {agama || '-'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Pekerjaan</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">{pekerjaan || '-'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Alamat Lengkap KTP</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">{alamatLengkap || '-'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Wilayah Organisasi</span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {dpd} · Kec. {dpc} · Kel/Desa {dprt || 'Umum'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Nomor HP / WhatsApp</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-right">
              {nomorHP || '-'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500">Email & Media Sosial</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right">
              {email || '-'} · {sosmed || '-'}
            </span>
          </div>
          {recruiterLabel && (
            <div className="grid grid-cols-2 gap-2 py-1">
              <span className="text-slate-500">Direkrut Oleh</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">
                {recruiterLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Kartu Integrasi Digital NasDem DPP Pusat */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 space-y-3">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1A3282] text-white flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                <span>Penerbitan e-KTA Digital NasDem DPP</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Admin Sulut Terhubung
                </span>
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Pembuatan e-KTA resmi dari portal pusat digital.partainasdem.id tanpa OTP/verifikasi mandiri pemohon.
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <input
            type="checkbox"
            checked={autoRegisterDpp}
            onChange={(e) => onToggleAutoRegisterDpp?.(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#1A3282] rounded border-slate-300 dark:border-slate-700 focus:ring-[#1A3282] cursor-pointer shrink-0"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">
              Daftarkan dan Terbitkan Nomor e-KTA DPP Resmi Sekarang
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Saat pendaftaran disimpan, sistem backend akan langsung menembus portal DPP menggunakan akun Admin Sulut, mengunggah foto e-KTP dan profil, serta otomatis mengaitkan Nomor e-KTA pusat resmi.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
