import React from 'react';
import { Globe, CheckCircle2, Upload, Camera } from 'lucide-react';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../utils/structureReadinessUtils';
import {
  KtpCameraScannerBox,
  ExtractedKtpData,
  KtpImageQualityReport,
} from '../ktp-scanner';
import {
  DPP_PENDIDIKAN_OPTIONS,
  DPP_STATUS_KAWIN_OPTIONS,
  DPP_GOL_DARAH_OPTIONS,
  DPP_SAYAP_OPTIONS,
} from './dppEktaService';

interface DppEktaFormTabProps {
  nik: string;
  setNik: (v: string) => void;
  cleanNik: string;
  namaLengkap: string;
  setNamaLengkap: (v: string) => void;
  tempatLahir: string;
  setTempatLahir: (v: string) => void;
  tanggalLahir: string;
  setTanggalLahir: (v: string) => void;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  setJenisKelamin: (v: 'Laki-laki' | 'Perempuan') => void;
  golonganDarah: string;
  setGolonganDarah: (v: string) => void;
  statusPerkawinan: string;
  setStatusPerkawinan: (v: string) => void;
  agama: string;
  setAgama: (v: string) => void;
  pendidikan: string;
  setPendidikan: (v: string) => void;
  pekerjaan: string;
  setPekerjaan: (v: string) => void;
  sayap: string;
  setSayap: (v: string) => void;
  dpd: string;
  setDpd: (v: string) => void;
  dpc: string;
  setDpc: (v: string) => void;
  dprt: string;
  setDprt: (v: string) => void;
  rtNumber: string;
  setRtNumber: (v: string) => void;
  rwNumber: string;
  setRwNumber: (v: string) => void;
  alamatLengkap: string;
  setAlamatLengkap: (v: string) => void;
  nomorHP: string;
  setNomorHP: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  fotoKtpUrl: string;
  setFotoKtpUrl: (v: string) => void;
  fotoProfilUrl: string;
  saveToLocalMembers: boolean;
  setSaveToLocalMembers: (v: boolean) => void;
  showKtpScanner: boolean;
  setShowKtpScanner: React.Dispatch<React.SetStateAction<boolean>>;
  ktpQuality: KtpImageQualityReport | null;
  extractedData: ExtractedKtpData | null;
  onScanComplete: (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>, target: 'ktp' | 'profil') => void;
  checkingNikStatus: boolean;
  nikDppCheckInfo: { checked: boolean; existsInDpp: boolean; existsInLocal: boolean } | null;
  setNikDppCheckInfo: (v: null) => void;
  onCheckNikInDpp: () => void;
  availableSubdistricts: { name: string; villages: string[] }[];
  availableVillages: string[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DppEktaFormTab: React.FC<DppEktaFormTabProps> = ({
  nik,
  setNik,
  cleanNik,
  namaLengkap,
  setNamaLengkap,
  tempatLahir,
  setTempatLahir,
  tanggalLahir,
  setTanggalLahir,
  jenisKelamin,
  setJenisKelamin,
  golonganDarah,
  setGolonganDarah,
  statusPerkawinan,
  setStatusPerkawinan,
  agama,
  setAgama,
  pendidikan,
  setPendidikan,
  pekerjaan,
  setPekerjaan,
  sayap,
  setSayap,
  dpd,
  setDpd,
  dpc,
  setDpc,
  dprt,
  setDprt,
  rtNumber,
  setRtNumber,
  rwNumber,
  setRwNumber,
  alamatLengkap,
  setAlamatLengkap,
  nomorHP,
  setNomorHP,
  email,
  setEmail,
  fotoKtpUrl,
  setFotoKtpUrl,
  fotoProfilUrl,
  saveToLocalMembers,
  setSaveToLocalMembers,
  showKtpScanner,
  setShowKtpScanner,
  ktpQuality,
  extractedData,
  onScanComplete,
  onUploadFile,
  checkingNikStatus,
  nikDppCheckInfo,
  setNikDppCheckInfo,
  onCheckNikInDpp,
  availableSubdistricts,
  availableVillages,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Baris Scan / Upload Foto KTP & Profil */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              1. Dokumen Foto e-KTP &amp; Pasfoto Profil (Format JPEG/PNG)
            </h4>
            <p className="text-[11px] text-slate-500">
              Server DPP membutuhkan foto KTP &amp; foto profil untuk dicetak langsung pada kartu fisik e-KTA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowKtpScanner((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-[#1A3282] text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{showKtpScanner ? 'Tutup Kamera Scanner' : 'Scan e-KTP Otomatis'}</span>
          </button>
        </div>

        {showKtpScanner && (
          <div className="pt-2">
            <KtpCameraScannerBox
              fotoKtpUrl={fotoKtpUrl}
              qualityReport={ktpQuality}
              extractedData={extractedData}
              onScanComplete={onScanComplete}
              onClearKtp={() => setFotoKtpUrl('')}
              onProceedNext={() => setShowKtpScanner(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-20 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {fotoKtpUrl ? (
                <img src={fotoKtpUrl} alt="KTP" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Foto KTP</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Berkas Foto e-KTP
              </div>
              <label className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Pilih Foto KTP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUploadFile(e, 'ktp')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {fotoProfilUrl ? (
                <img src={fotoProfilUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Pasfoto</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pasfoto Profil Kader
              </div>
              <label className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Pilih Foto Profil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUploadFile(e, 'profil')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Biodata Utama sesuai Form createKTA DPP */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          2. Identitas &amp; Biodata Kader (Sesuai Portal Digital NasDem DPP)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Nomor Induk Kependudukan (NIK 16 Digit) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => {
                  setNik(e.target.value.replace(/[^0-9]/g, ''));
                  setNikDppCheckInfo(null);
                }}
                placeholder="Contoh: 7106033003050011"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={onCheckNikInDpp}
                disabled={checkingNikStatus || cleanNik.length < 9}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold cursor-pointer hover:bg-slate-800 disabled:opacity-50 shrink-0"
              >
                {checkingNikStatus ? 'Mengecek...' : 'Cek NIK di DPP'}
              </button>
            </div>
            {nikDppCheckInfo?.checked && (
              <div
                className={`text-[11px] font-semibold mt-1 flex items-center gap-1.5 ${
                  nikDppCheckInfo.existsInDpp ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {nikDppCheckInfo.existsInDpp
                    ? 'NIK ini SUDAH TERDAFTAR di database Digital NasDem Pusat.'
                    : 'NIK BELUM terdaftar di DPP Pusat — siap diterbitkan e-KTA baru!'}
                </span>
              </div>
            )}
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Nama Lengkap Sesuai KTP *
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Tempat Lahir <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={tempatLahir}
              onChange={(e) => setTempatLahir(e.target.value)}
              placeholder="Contoh: Manado"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Tanggal Lahir <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="date"
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Jenis Kelamin *
            </label>
            <select
              value={jenisKelamin}
              onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              <option value="Laki-laki">Laki-Laki (L)</option>
              <option value="Perempuan">Perempuan (P)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Golongan Darah <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <select
              value={golonganDarah}
              onChange={(e) => setGolonganDarah(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              <option value="">- Tidak Tahu / Belum Tahu (Opsional) -</option>
              {DPP_GOL_DARAH_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  Golongan Darah {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Status Perkawinan *
            </label>
            <select
              value={statusPerkawinan}
              onChange={(e) => setStatusPerkawinan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {DPP_STATUS_KAWIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Agama *
            </label>
            <select
              value={agama}
              onChange={(e) => setAgama(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              <option value="Kristen Protestan">Kristen Protestan</option>
              <option value="Islam">Islam</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
              <option value="Khonghucu">Khonghucu</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pendidikan Terakhir
            </label>
            <select
              value={pendidikan}
              onChange={(e) => setPendidikan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {DPP_PENDIDIKAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pekerjaan *
            </label>
            <input
              type="text"
              value={pekerjaan}
              onChange={(e) => setPekerjaan(e.target.value)}
              placeholder="Wiraswasta / SWASTA / PNS"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Domisili & Kontak DPP */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          3. Wilayah Domisili Sulawesi Utara &amp; Kontak
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Kabupaten / Kota (DPD) *
            </label>
            <select
              value={dpd}
              onChange={(e) => {
                const val = e.target.value;
                setDpd(val);
                const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, val));
                if (reg && reg.subdistricts[0]) {
                  setDpc(reg.subdistricts[0].name);
                  setDprt(reg.subdistricts[0].villages[0] || '');
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {SULUT_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Kecamatan (DPC) *
            </label>
            <select
              value={dpc}
              onChange={(e) => {
                const val = e.target.value;
                setDpc(val);
                const sub = availableSubdistricts.find((s) => isDpcMatch(s.name, val));
                if (sub && sub.villages[0]) setDprt(sub.villages[0]);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {availableSubdistricts.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Kelurahan / Desa (DPRt) *
            </label>
            <select
              value={dprt}
              onChange={(e) => setDprt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- Pilih Kelurahan / Desa --</option>
              {availableVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Alamat Domisili Lengkap *
            </label>
            <input
              type="text"
              value={alamatLengkap}
              onChange={(e) => setAlamatLengkap(e.target.value)}
              placeholder="Nama jalan, lingkungan/jaga, kelurahan, kecamatan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              RT / RW <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Opsional)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={999}
                value={rtNumber}
                onChange={(e) => setRtNumber(e.target.value)}
                placeholder="RT"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center"
              />
              <span className="text-xs text-slate-400">/</span>
              <input
                type="number"
                min={0}
                max={999}
                value={rwNumber}
                onChange={(e) => setRwNumber(e.target.value)}
                placeholder="RW"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center"
              />
            </div>
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Organisasi Sayap (Opsional)
            </label>
            <select
              value={sayap}
              onChange={(e) => setSayap(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {DPP_SAYAP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Nomor HP / WhatsApp <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Opsional)</span>
            </label>
            <input
              type="tel"
              value={nomorHP}
              onChange={(e) => setNomorHP(e.target.value)}
              placeholder="0812xxxxxxxx"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Email (Kosongkan untuk Email Otomatis Tanpa OTP)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={cleanNik ? `Otomatis: ektasulut${cleanNik}@gmail.com` : 'Otomatis jika dikosongkan'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Footer Submit ke DPP */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={saveToLocalMembers}
            onChange={(e) => setSaveToLocalMembers(e.target.checked)}
            className="w-4 h-4 rounded text-[#1A3282]"
          />
          <span>Simpan &amp; sinkronkan Nomor e-KTA DPP ini ke tabel Anggota DPW Sulut</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors disabled:opacity-60"
        >
          <Globe className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          <span>
            {isSubmitting
              ? 'Mendaftarkan ke Server Digital NasDem DPP...'
              : 'Daftarkan & Terbitkan e-KTA Resmi DPP'}
          </span>
        </button>
      </div>
    </form>
  );
};

