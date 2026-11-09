import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GridRowItem } from '../../matrix';
import { isRealNik, isRealEkta } from './printModalUtils';

interface TerritorialPrintSignSettingsProps {
  showSettings: boolean;
  showStamp: boolean;
  setShowStamp: (val: boolean) => void;
  onResetSettings: () => void;
  skNumber: string;
  setSkNumber: (val: string) => void;
  signCity: string;
  setSignCity: (val: string) => void;
  signDate: string;
  setSignDate: (val: string) => void;
  filledRows: GridRowItem[];
  leftJabatan: string;
  setLeftJabatan: (val: string) => void;
  sekretarisName: string;
  setSekretarisName: (val: string) => void;
  sekretarisKta: string;
  setSekretarisKta: (val: string) => void;
  rightJabatan: string;
  setRightJabatan: (val: string) => void;
  ketuaName: string;
  setKetuaName: (val: string) => void;
  ketuaKta: string;
  setKetuaKta: (val: string) => void;
}

export const TerritorialPrintSignSettings: React.FC<TerritorialPrintSignSettingsProps> = ({
  showSettings,
  showStamp,
  setShowStamp,
  onResetSettings,
  skNumber,
  setSkNumber,
  signCity,
  setSignCity,
  signDate,
  setSignDate,
  filledRows,
  leftJabatan,
  setLeftJabatan,
  sekretarisName,
  setSekretarisName,
  sekretarisKta,
  setSekretarisKta,
  rightJabatan,
  setRightJabatan,
  ketuaName,
  setKetuaName,
  ketuaKta,
  setKetuaKta,
}) => {
  if (!showSettings) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">
          Pengaturan Manual Tanda Tangan &amp; Nomor SK
        </span>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={showStamp}
              onChange={(e) => setShowStamp(e.target.checked)}
              className="rounded border-slate-300 accent-slate-900"
            />
            <span>Lingkaran Stempel</span>
          </label>
          <button
            type="button"
            onClick={onResetSettings}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Otomatis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Nomor SK</label>
          <input
            type="text"
            value={skNumber}
            onChange={(e) => setSkNumber(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Kota Penetapan</label>
          <input
            type="text"
            value={signCity}
            onChange={(e) => setSignCity(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">
            Tanggal Penetapan
          </label>
          <input
            type="text"
            value={signDate}
            onChange={(e) => setSignDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Left Signatory */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              Pejabat Kiri (Sekretaris)
            </span>
            {filledRows.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const found = filledRows.find((r) => r.namaLengkap === e.target.value);
                  if (found) {
                    setSekretarisName(found.namaLengkap);
                    setSekretarisKta(
                      isRealEkta(found.nomorEKTA)
                        ? `No. e-KTA: ${found.nomorEKTA}`
                        : isRealNik(found.nik)
                        ? `NIK: ${found.nik}`
                        : ''
                    );
                  }
                }}
                className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
              >
                <option value="">Pilih dari Pengurus...</option>
                {filledRows.map((r, idx) => (
                  <option key={`sek-${idx}`} value={r.namaLengkap}>
                    {r.namaLengkap} ({r.jabatan})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <input
              type="text"
              value={leftJabatan}
              onChange={(e) => setLeftJabatan(e.target.value)}
              placeholder="Jabatan Kiri"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
            />
            <input
              type="text"
              value={sekretarisName}
              onChange={(e) => setSekretarisName(e.target.value)}
              placeholder="Ketik Nama Pejabat Kiri..."
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
            />
            <input
              type="text"
              value={sekretarisKta}
              onChange={(e) => setSekretarisKta(e.target.value)}
              placeholder="No. e-KTA / NIK"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {/* Right Signatory */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              Pejabat Kanan (Ketua)
            </span>
            {filledRows.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const found = filledRows.find((r) => r.namaLengkap === e.target.value);
                  if (found) {
                    setKetuaName(found.namaLengkap);
                    setKetuaKta(
                      isRealEkta(found.nomorEKTA)
                        ? `No. e-KTA: ${found.nomorEKTA}`
                        : isRealNik(found.nik)
                        ? `NIK: ${found.nik}`
                        : ''
                    );
                  }
                }}
                className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
              >
                <option value="">Pilih dari Pengurus...</option>
                {filledRows.map((r, idx) => (
                  <option key={`ket-${idx}`} value={r.namaLengkap}>
                    {r.namaLengkap} ({r.jabatan})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <input
              type="text"
              value={rightJabatan}
              onChange={(e) => setRightJabatan(e.target.value)}
              placeholder="Jabatan Kanan"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
            />
            <input
              type="text"
              value={ketuaName}
              onChange={(e) => setKetuaName(e.target.value)}
              placeholder="Ketik Nama Pejabat Kanan..."
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
            />
            <input
              type="text"
              value={ketuaKta}
              onChange={(e) => setKetuaKta(e.target.value)}
              placeholder="No. e-KTA / NIK"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

