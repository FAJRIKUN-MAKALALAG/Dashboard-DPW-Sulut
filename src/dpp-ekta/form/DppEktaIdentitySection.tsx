import React from 'react';
import { CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import {
  DPP_PENDIDIKAN_OPTIONS,
  DPP_STATUS_KAWIN_OPTIONS,
  DPP_GOL_DARAH_OPTIONS,
} from '../dppEktaService';

interface DppEktaIdentitySectionProps {
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
  checkingNikStatus: boolean;
  nikDppCheckInfo: {
    checked: boolean;
    existsInDpp: boolean;
    nomorEktaDpp?: string;
    namaDpp?: string;
    existsInLocal: boolean;
  } | null;
  setNikDppCheckInfo: (v: null) => void;
  onCheckNikInDpp: () => void;
  onSyncExistingEkta?: () => void;
  isSyncingExisting?: boolean;
  manualEktaInput?: string;
  setManualEktaInput?: (v: string) => void;
}

export const DppEktaIdentitySection: React.FC<DppEktaIdentitySectionProps> = ({
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
  checkingNikStatus,
  nikDppCheckInfo,
  setNikDppCheckInfo,
  onCheckNikInDpp,
  onSyncExistingEkta,
  isSyncingExisting,
  manualEktaInput,
  setManualEktaInput,
}) => {
  return (
    <div className="xl:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
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
                nikDppCheckInfo.existsInDpp
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
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

          {nikDppCheckInfo?.checked && nikDppCheckInfo.existsInDpp && (
            <div className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-300 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>NIK Sudah Terdaftar di DPP Pusat!</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold">
                      PUSAT
                    </span>
                  </h5>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed mt-0.5">
                    Data Anda sudah tercatat di basis data DPP Partai NasDem.{' '}
                    <strong>Tidak perlu mendaftar ulang atau membuat KTA baru</strong>. Sistem dapat langsung mengambil e-KTA resmi dan memasukkannya ke profil data diri Anda.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Nomor e-KTA Resmi:</span>
                  {nikDppCheckInfo.nomorEktaDpp || manualEktaInput ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 font-mono text-xs sm:text-sm font-black text-[#1A3282] dark:text-amber-200 shadow-xs tracking-wider">
                        {nikDppCheckInfo.nomorEktaDpp || manualEktaInput}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Terdeteksi dari DPP
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      maxLength={20}
                      value={manualEktaInput || ''}
                      onChange={(e) => setManualEktaInput?.(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Ketik 16 digit e-KTA"
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-mono text-xs font-bold text-slate-900 dark:text-white min-w-[200px]"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={onSyncExistingEkta}
                  disabled={isSyncingExisting || (!nikDppCheckInfo.nomorEktaDpp && !manualEktaInput?.trim())}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#FDB813] hover:from-amber-600 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0 touch-manipulation"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingExisting ? 'animate-spin' : ''}`} />
                  <span>{isSyncingExisting ? 'Menyinkronkan...' : '⚡ Tarik & Masukkan ke Data Diri'}</span>
                </button>
              </div>
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
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Jenis Kelamin *</label>
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
            <option value="">- Tidak Tahu / Belum Tahu -</option>
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
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Status Perkawinan *</label>
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
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Agama *</label>
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
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Pendidikan Terakhir</label>
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
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Pekerjaan *</label>
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
  );
};
