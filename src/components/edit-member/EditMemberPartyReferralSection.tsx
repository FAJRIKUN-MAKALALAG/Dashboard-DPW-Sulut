import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { MemberStatus } from '../../types';
import { SULUT_REGIONS, LEVEL_PARTY_ROLES, STATUS_OPTIONS } from '../../data/sulutRegions';

interface EditMemberPartyReferralSectionProps {
  isPengurus: boolean;
  onChangeIsPengurus: (val: boolean) => void;
  tingkatKepengurusan: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus';
  onChangeTingkatKepengurusan: (val: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus') => void;
  allowedTingkatOptions: { value: string; label: string }[];
  nomorSK: string;
  onChangeNomorSK: (val: string) => void;
  kodeReferral: string;
  onChangeKodeReferral: (val: string) => void;
  dpd: string;
  onChangeDpd: (val: string) => void;
  isDpdLocked: boolean;
  dpc: string;
  onChangeDpc: (val: string) => void;
  isDpcLocked: boolean;
  availableSubdistricts: { name: string; villages: string[] }[];
  dprt: string;
  onChangeDprt: (val: string) => void;
  isDprtLocked: boolean;
  jabatan: string;
  onChangeJabatan: (val: string) => void;
  status: MemberStatus;
  onChangeStatus: (val: MemberStatus) => void;
  catatanMutasi: string;
  onChangeCatatanMutasi: (val: string) => void;
  kaderPerekrutKodeReferral: string;
  onChangeKaderPerekrutKodeReferral: (val: string) => void;
  kaderPerekrutNama: string;
  onChangeKaderPerekrutNama: (val: string) => void;
  kaderPerekrutJabatan: string;
  onChangeKaderPerekrutJabatan: (val: string) => void;
  refValidation: { loading: boolean; valid?: boolean; error?: string } | null;
  ketuaLangsungInfo: { nik: string; nama: string; jabatan: string; tingkat: string } | null;
}

export const EditMemberPartyReferralSection: React.FC<EditMemberPartyReferralSectionProps> = ({
  isPengurus,
  onChangeIsPengurus,
  tingkatKepengurusan,
  onChangeTingkatKepengurusan,
  allowedTingkatOptions,
  nomorSK,
  onChangeNomorSK,
  kodeReferral,
  onChangeKodeReferral,
  dpd,
  onChangeDpd,
  isDpdLocked,
  dpc,
  onChangeDpc,
  isDpcLocked,
  availableSubdistricts,
  dprt,
  onChangeDprt,
  isDprtLocked,
  jabatan,
  onChangeJabatan,
  status,
  onChangeStatus,
  catatanMutasi,
  onChangeCatatanMutasi,
  kaderPerekrutKodeReferral,
  onChangeKaderPerekrutKodeReferral,
  kaderPerekrutNama,
  onChangeKaderPerekrutNama,
  kaderPerekrutJabatan,
  onChangeKaderPerekrutJabatan,
  refValidation,
  ketuaLangsungInfo,
}) => {
  return (
    <div className="space-y-4">
      {/* Status Kepengurusan & SK Resmi */}
      <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Status SK Kepengurusan & Kode Referral</span>
          </span>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-900 dark:text-blue-200">
            <input
              type="checkbox"
              checked={isPengurus}
              onChange={(e) => onChangeIsPengurus(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Tercatat Sebagai Pengurus Ber-SK</span>
          </label>
        </div>

        {isPengurus && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tingkat Kepengurusan
              </label>
              <select
                value={tingkatKepengurusan}
                onChange={(e) => onChangeTingkatKepengurusan(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold"
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
                Nomor SK Kepengurusan
              </label>
              <input
                type="text"
                value={nomorSK}
                onChange={(e) => onChangeNomorSK(e.target.value)}
                placeholder="SK-DPW-SULUT/2024/001"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Kode Referral Rekrutmen
              </label>
              <input
                type="text"
                value={kodeReferral}
                onChange={(e) => onChangeKodeReferral(e.target.value.toUpperCase())}
                placeholder="REF-DPW-0001"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Struktur Domisili Daerah */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            DPD (Kabupaten / Kota)
            {isDpdLocked && (
              <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                (Terkunci sesuai akun)
              </span>
            )}
          </label>
          <select
            value={dpd}
            disabled={isDpdLocked}
            onChange={(e) => onChangeDpd(e.target.value)}
            className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${
              isDpdLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
            }`}
          >
            {SULUT_REGIONS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            DPC (Kecamatan)
            {isDpcLocked && (
              <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                (Terkunci sesuai akun)
              </span>
            )}
          </label>
          <select
            value={dpc}
            disabled={isDpcLocked}
            onChange={(e) => onChangeDpc(e.target.value)}
            className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${
              isDpcLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
            }`}
          >
            {availableSubdistricts.map((sub) => (
              <option key={sub.name} value={sub.name}>
                Kec. {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            DPRt (Kelurahan / Desa)
            {isDprtLocked && (
              <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                (Terkunci sesuai akun)
              </span>
            )}
          </label>
          <input
            type="text"
            value={dprt}
            disabled={isDprtLocked}
            onChange={(e) => onChangeDprt(e.target.value)}
            placeholder="Contoh: Ranomeida"
            className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
              isDprtLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
            }`}
          />
        </div>
      </div>

      {/* Jabatan & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Jabatan / Penugasan Partai
          </label>
          <select
            value={jabatan}
            onChange={(e) => onChangeJabatan(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
          >
            {(isPengurus && tingkatKepengurusan !== 'Bukan Pengurus'
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Status Keanggotaan
          </label>
          <select
            value={status}
            onChange={(e) => onChangeStatus(e.target.value as MemberStatus)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catatan Lapangan */}
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Catatan Faktual / Keterangan Penugasan
        </label>
        <textarea
          rows={2}
          value={catatanMutasi}
          onChange={(e) => onChangeCatatanMutasi(e.target.value)}
          placeholder="Contoh: Pengurus DPW Partai NasDem Sulut periode 2024-2029..."
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Kader Pengusung / Perekrut (Sistem Referral Berjenjang) */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kader Perekrut (Referral Pengurus Berjenjang)</span>
          </span>

          {refValidation?.loading && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Memvalidasi kode...</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Kode Referral Perekrut
            </label>
            <input
              type="text"
              value={kaderPerekrutKodeReferral}
              onChange={(e) => onChangeKaderPerekrutKodeReferral(e.target.value.toUpperCase())}
              placeholder="Contoh: NSD-DPC-5ZXF"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 uppercase tracking-wide"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nama Kader Perekrut
            </label>
            <input
              type="text"
              value={kaderPerekrutNama}
              onChange={(e) => onChangeKaderPerekrutNama(e.target.value)}
              placeholder="Otomatis dari kode referral"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Jabatan Perekrut
            </label>
            <input
              type="text"
              value={kaderPerekrutJabatan}
              onChange={(e) => onChangeKaderPerekrutJabatan(e.target.value)}
              placeholder="Jabatan di partai"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        {refValidation?.valid && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kode Sah: {kaderPerekrutNama} ({kaderPerekrutJabatan})</span>
            </div>
            {ketuaLangsungInfo && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pl-5 font-medium">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Ketua Langsung Terkait: <strong>{ketuaLangsungInfo.nama}</strong> ({ketuaLangsungInfo.jabatan}) — Perekrutan otomatis diatribusikan ke perekrut & dilaporkan ke pimpinan.
                </span>
              </div>
            )}
          </div>
        )}

        {refValidation?.valid === false && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{refValidation.error || 'Kode referral tidak ditemukan di database resmi.'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

