import React from 'react';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../../utils/structureReadinessUtils';
import { DPP_SAYAP_OPTIONS } from '../dppEktaService';

interface DppEktaDomicileSectionProps {
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
  sayap: string;
  setSayap: (v: string) => void;
  nomorHP: string;
  setNomorHP: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  cleanNik: string;
  availableSubdistricts: { name: string; villages: string[] }[];
  availableVillages: string[];
}

export const DppEktaDomicileSection: React.FC<DppEktaDomicileSectionProps> = ({
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
  sayap,
  setSayap,
  nomorHP,
  setNomorHP,
  email,
  setEmail,
  cleanNik,
  availableSubdistricts,
  availableVillages,
}) => {
  return (
    <div className="xl:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
        3. Wilayah Domisili Sulawesi Utara &amp; Kontak
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-3">
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
            Sayap <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
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
            Email (Kosongkan untuk Otomatis)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={cleanNik ? `ektasulut${cleanNik}@gmail.com` : 'Otomatis tanpa OTP'}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};
