import React from 'react';
import {
  MapPin,
  Lock,
  Phone,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { SULUT_REGIONS, LEVEL_PARTY_ROLES } from '../../data/sulutRegions';

interface RegistrationStep3AddressContactProps {
  alamatLengkap: string;
  onChangeAlamatLengkap: (val: string) => void;
  dpd: string;
  onChangeDpd: (val: string) => void;
  isDpdLocked: boolean;
  lockedDpdLabel: string;
  dpc: string;
  onChangeDpc: (val: string) => void;
  isDpcLocked: boolean;
  lockedDpcLabel: string;
  availableSubdistricts: { name: string; villages: string[] }[];
  dprt: string;
  onChangeDprt: (val: string) => void;
  isDprtLocked: boolean;
  lockedDprtLabel: string;
  availableVillages?: string[];
  nomorHP: string;
  onChangeNomorHP: (val: string) => void;
  email: string;
  onChangeEmail: (val: string) => void;
  sosmed: string;
  onChangeSosmed: (val: string) => void;

  // Optional Admin Kepengurusan & Referral fields
  showAdminPartyFields?: boolean;
  isPengurus?: boolean;
  onChangeIsPengurus?: (val: boolean) => void;
  tingkatKepengurusan?: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus';
  onChangeTingkatKepengurusan?: (val: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus') => void;
  allowedTingkatOptions?: { value: string; label: string }[];
  jabatan?: string;
  onChangeJabatan?: (val: string) => void;
  nomorSK?: string;
  onChangeNomorSK?: (val: string) => void;
  kodeReferral?: string;
  onChangeKodeReferral?: (val: string) => void;
  kaderPerekrutKodeReferral?: string;
  onChangeKaderPerekrutKodeReferral?: (val: string) => void;
  kaderPerekrutNama?: string;
  onChangeKaderPerekrutNama?: (val: string) => void;
  kaderPerekrutJabatan?: string;
  onChangeKaderPerekrutJabatan?: (val: string) => void;
  refValidation?: { loading: boolean; valid?: boolean; error?: string } | null;
  ketuaLangsungInfo?: { nik: string; nama: string; jabatan: string; tingkat: string } | null;
}

export const RegistrationStep3AddressContact: React.FC<RegistrationStep3AddressContactProps> = ({
  alamatLengkap,
  onChangeAlamatLengkap,
  dpd,
  onChangeDpd,
  isDpdLocked,
  lockedDpdLabel,
  dpc,
  onChangeDpc,
  isDpcLocked,
  lockedDpcLabel,
  availableSubdistricts,
  dprt,
  onChangeDprt,
  isDprtLocked,
  lockedDprtLabel,
  availableVillages = [],
  nomorHP,
  onChangeNomorHP,
  email,
  onChangeEmail,
  sosmed,
  onChangeSosmed,
  showAdminPartyFields = false,
  isPengurus = false,
  onChangeIsPengurus,
  tingkatKepengurusan = 'DPW',
  onChangeTingkatKepengurusan,
  allowedTingkatOptions = [],
  jabatan = 'Anggota / Kader Biasa',
  onChangeJabatan,
  nomorSK = '',
  onChangeNomorSK,
  kodeReferral = '',
  onChangeKodeReferral,
  kaderPerekrutKodeReferral = '',
  onChangeKaderPerekrutKodeReferral,
  kaderPerekrutNama = '',
  onChangeKaderPerekrutNama,
  kaderPerekrutJabatan = '',
  onChangeKaderPerekrutJabatan,
  refValidation = null,
  ketuaLangsungInfo = null,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Alamat Lengkap & Wilayah Organisasi */}
      <div className="space-y-3.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>Alamat Domisili & Wilayah Organisasi (DPD / DPC / DPRt)</span>
        </span>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Alamat Lengkap Sesuai e-KTP (Jalan / Lingkungan / RT / RW) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={alamatLengkap}
            onChange={(e) => onChangeAlamatLengkap(e.target.value)}
            placeholder="Contoh: Jl. Piere Tendean Lingk. III, RT/RW 003/001"
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
          />
        </div>

        {/* Struktur Domisili Daerah (1 Kolom di Mobile, 2 di Tablet, 3 di Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>DPD (Kabupaten / Kota)</span>
              {isDpdLocked && (
                <span className="text-[10px] text-slate-500 font-normal flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <select
              value={isDpdLocked ? lockedDpdLabel : dpd}
              disabled={isDpdLocked}
              onChange={(e) => {
                if (isDpdLocked) return;
                onChangeDpd(e.target.value);
              }}
              className={`w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500 ${
                isDpdLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                  : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
              }`}
            >
              {isDpdLocked ? (
                <option value={lockedDpdLabel}>{lockedDpdLabel}</option>
              ) : (
                SULUT_REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>DPC (Kecamatan)</span>
              {isDpcLocked && (
                <span className="text-[10px] text-slate-500 font-normal flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <select
              value={isDpcLocked ? lockedDpcLabel : dpc}
              disabled={isDpcLocked}
              onChange={(e) => {
                if (isDpcLocked) return;
                onChangeDpc(e.target.value);
              }}
              className={`w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500 ${
                isDpcLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                  : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
              }`}
            >
              {isDpcLocked ? (
                <option value={lockedDpcLabel}>Kec. {lockedDpcLabel}</option>
              ) : (
                availableSubdistricts.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    Kec. {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>
                DPRt (Kelurahan / Desa) <span className="text-rose-500">*</span>
              </span>
              {isDprtLocked && (
                <span className="text-[10px] text-slate-500 font-normal flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <input
              type="text"
              list={!isDprtLocked && availableVillages.length > 0 ? 'step3-villages-list' : undefined}
              value={isDprtLocked ? lockedDprtLabel : dprt}
              disabled={isDprtLocked}
              readOnly={isDprtLocked}
              onChange={(e) => {
                if (isDprtLocked) return;
                onChangeDprt(e.target.value);
              }}
              placeholder="Pilih atau ketik nama kelurahan/desa"
              className={`w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500 ${
                isDprtLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                  : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
              }`}
            />
            {!isDprtLocked && availableVillages.length > 0 && (
              <datalist id="step3-villages-list">
                {availableVillages.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            )}
          </div>
        </div>
      </div>

      {/* Kontak Aktif */}
      <div className="space-y-3.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>Kontak & Media Sosial</span>
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nomor HP / WhatsApp
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={nomorHP}
              onChange={(e) => onChangeNomorHP(e.target.value)}
              placeholder="Contoh: 081244558891"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email (Opsional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="kader@nasdem.id"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Media Sosial (Opsional)
            </label>
            <input
              type="text"
              value={sosmed}
              onChange={(e) => onChangeSosmed(e.target.value)}
              placeholder="@username_kader"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] dark:focus:border-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Optional Admin Kepengurusan & Referral Attribution (Clean Neutral Style) */}
      {showAdminPartyFields && (
        <div className="space-y-3.5 pt-1">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Status Kepengurusan & SK (Opsional)</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isPengurus}
                  onChange={(e) => onChangeIsPengurus?.(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1A3282] focus:ring-[#1A3282] cursor-pointer"
                />
                <span>Daftarkan Sekaligus Sebagai Pengurus Ber-SK</span>
              </label>
            </div>

            {isPengurus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tingkat Kepengurusan
                  </label>
                  <select
                    value={tingkatKepengurusan}
                    onChange={(e) => onChangeTingkatKepengurusan?.(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] font-semibold"
                  >
                    {allowedTingkatOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jabatan / Penugasan
                  </label>
                  <select
                    value={jabatan}
                    onChange={(e) => onChangeJabatan?.(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] font-medium"
                  >
                    {(tingkatKepengurusan !== 'Bukan Pengurus'
                      ? LEVEL_PARTY_ROLES[tingkatKepengurusan as 'DPW' | 'DPD' | 'DPC' | 'DPRt']
                      : LEVEL_PARTY_ROLES.UMUM
                    ).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor SK Kepengurusan
                  </label>
                  <input
                    type="text"
                    value={nomorSK}
                    onChange={(e) => onChangeNomorSK?.(e.target.value)}
                    placeholder="SK-DPW-SULUT/2024/001"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Referral Pengurus
                  </label>
                  <input
                    type="text"
                    value={kodeReferral}
                    onChange={(e) => onChangeKodeReferral?.(e.target.value.toUpperCase())}
                    placeholder="REF-DPW-0001"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Atribusi Kader Perekrut (Opsional)</span>
              </span>

              {refValidation?.loading && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Memvalidasi kode...</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kode Referral Perekrut
                </label>
                <input
                  type="text"
                  value={kaderPerekrutKodeReferral}
                  onChange={(e) => onChangeKaderPerekrutKodeReferral?.(e.target.value.toUpperCase())}
                  placeholder="Contoh: REF-DPD-MANADO-001"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Pengurus Perekrut
                </label>
                <input
                  type="text"
                  value={kaderPerekrutNama}
                  onChange={(e) => onChangeKaderPerekrutNama?.(e.target.value)}
                  placeholder="Otomatis dari kode referral"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jabatan Perekrut
                </label>
                <input
                  type="text"
                  value={kaderPerekrutJabatan}
                  onChange={(e) => onChangeKaderPerekrutJabatan?.(e.target.value)}
                  placeholder="Jabatan pengurus perekrut"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282]"
                />
              </div>
            </div>

            {refValidation && !refValidation.loading && refValidation.valid && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Perekrut Terverifikasi: {kaderPerekrutNama} ({kaderPerekrutJabatan})
                </span>
                {ketuaLangsungInfo && (
                  <span className="font-mono text-[10px] text-slate-500">
                    Ketua Langsung ({ketuaLangsungInfo.tingkat}): {ketuaLangsungInfo.nama}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
