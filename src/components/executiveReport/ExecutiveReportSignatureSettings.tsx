import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Member } from '../../types';
import { isRealEkta, isRealNik } from './executiveReportUtils';

interface ExecutiveReportSignatureSettingsProps {
  showSignaturePanel: boolean;
  showStampBox: boolean;
  setShowStampBox: (val: boolean) => void;
  onAutoDetectSignatories: (forceReset: boolean) => void;
  docCustomTitle: string;
  setDocCustomTitle: (val: string) => void;
  computedDocTitle: string;
  signCity: string;
  setSignCity: (val: string) => void;
  signDate: string;
  setSignDate: (val: string) => void;
  signLayout: '2_COL' | '3_COL' | '1_COL';
  setSignLayout: (val: '2_COL' | '3_COL' | '1_COL') => void;
  setIsSignManuallyEdited: (val: boolean) => void;

  pengurusQuickPickList: Member[];

  leftTitle: string;
  setLeftTitle: (val: string) => void;
  leftName: string;
  setLeftName: (val: string) => void;
  leftId: string;
  setLeftId: (val: string) => void;

  rightTitle: string;
  setRightTitle: (val: string) => void;
  rightName: string;
  setRightName: (val: string) => void;
  rightId: string;
  setRightId: (val: string) => void;

  centerTitle: string;
  setCenterTitle: (val: string) => void;
  centerName: string;
  setCenterName: (val: string) => void;
  centerId: string;
  setCenterId: (val: string) => void;
}

export const ExecutiveReportSignatureSettings: React.FC<ExecutiveReportSignatureSettingsProps> = ({
  showSignaturePanel,
  showStampBox,
  setShowStampBox,
  onAutoDetectSignatories,
  docCustomTitle,
  setDocCustomTitle,
  computedDocTitle,
  signCity,
  setSignCity,
  signDate,
  setSignDate,
  signLayout,
  setSignLayout,
  setIsSignManuallyEdited,

  pengurusQuickPickList,

  leftTitle,
  setLeftTitle,
  leftName,
  setLeftName,
  leftId,
  setLeftId,

  rightTitle,
  setRightTitle,
  rightName,
  setRightName,
  rightId,
  setRightId,

  centerTitle,
  setCenterTitle,
  centerName,
  setCenterName,
  centerId,
  setCenterId,
}) => {
  if (!showSignaturePanel) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">
          Pengaturan Manual Tanda Tangan &amp; Kop Dokumen
        </span>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={showStampBox}
              onChange={(e) => setShowStampBox(e.target.checked)}
              className="rounded border-slate-300 accent-slate-900"
            />
            <span>Lingkaran Stempel</span>
          </label>
          <button
            type="button"
            onClick={() => onAutoDetectSignatories(true)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Deteksi Otomatis Wilayah</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="lg:col-span-2">
          <label className="block text-[10px] text-slate-500 mb-0.5">Judul Dokumen</label>
          <input
            type="text"
            value={docCustomTitle}
            onChange={(e) => setDocCustomTitle(e.target.value)}
            placeholder={computedDocTitle}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Kota</label>
          <input
            type="text"
            value={signCity}
            onChange={(e) => {
              setSignCity(e.target.value);
              setIsSignManuallyEdited(true);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Tanggal</label>
          <input
            type="text"
            value={signDate}
            onChange={(e) => {
              setSignDate(e.target.value);
              setIsSignManuallyEdited(true);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Jumlah Pejabat</label>
          <select
            value={signLayout}
            onChange={(e) => setSignLayout(e.target.value as '2_COL' | '3_COL' | '1_COL')}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
          >
            <option value="2_COL">2 Pejabat (Kiri &amp; Kanan)</option>
            <option value="3_COL">3 Pejabat (+ Tengah)</option>
            <option value="1_COL">1 Pejabat (Kanan Saja)</option>
          </select>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${
          signLayout === '3_COL'
            ? 'lg:grid-cols-3'
            : signLayout === '2_COL'
            ? 'lg:grid-cols-2'
            : 'lg:grid-cols-1'
        } gap-2.5`}
      >
        {signLayout !== '1_COL' && (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-700">
                Pejabat Kiri (Sekretaris)
              </span>
              <select
                value=""
                onChange={(e) => {
                  const found = pengurusQuickPickList.find((p) => p.nik === e.target.value);
                  if (found) {
                    setLeftName(found.namaLengkap);
                    setLeftId(
                      isRealEkta(found.nomorEKTA)
                        ? `No. e-KTA: ${found.nomorEKTA}`
                        : isRealNik(found.nik)
                        ? `NIK: ${found.nik}`
                        : ''
                    );
                    if (found.jabatan) {
                      setLeftTitle(
                        `${found.jabatan.toUpperCase()} ${found.tingkatKepengurusan || ''}`.trim()
                      );
                    }
                    setIsSignManuallyEdited(true);
                  }
                }}
                className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
              >
                <option value="">Pilih dari Pengurus...</option>
                {pengurusQuickPickList.map((p, i) => (
                  <option key={`l-${p.nik}-${i}`} value={p.nik}>
                    {p.namaLengkap} ({p.jabatan})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <input
                type="text"
                value={leftTitle}
                onChange={(e) => {
                  setLeftTitle(e.target.value);
                  setIsSignManuallyEdited(true);
                }}
                placeholder="Jabatan Kiri"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
              />
              <input
                type="text"
                value={leftName}
                onChange={(e) => {
                  setLeftName(e.target.value);
                  setIsSignManuallyEdited(true);
                }}
                placeholder="Ketik Nama Pejabat Kiri..."
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
              />
              <input
                type="text"
                value={leftId}
                onChange={(e) => {
                  setLeftId(e.target.value);
                  setIsSignManuallyEdited(true);
                }}
                placeholder="No. e-KTA / NIK"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
              />
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              Pejabat Kanan (Ketua)
            </span>
            <select
              value=""
              onChange={(e) => {
                const found = pengurusQuickPickList.find((p) => p.nik === e.target.value);
                if (found) {
                  setRightName(found.namaLengkap);
                  setRightId(
                    isRealEkta(found.nomorEKTA)
                      ? `No. e-KTA: ${found.nomorEKTA}`
                      : isRealNik(found.nik)
                      ? `NIK: ${found.nik}`
                      : ''
                  );
                  if (found.jabatan) {
                    setRightTitle(
                      `${found.jabatan.toUpperCase()} ${found.tingkatKepengurusan || ''}`.trim()
                    );
                  }
                  setIsSignManuallyEdited(true);
                }
              }}
              className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
            >
              <option value="">Pilih dari Pengurus...</option>
              {pengurusQuickPickList.map((p, i) => (
                <option key={`r-${p.nik}-${i}`} value={p.nik}>
                  {p.namaLengkap} ({p.jabatan})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <input
              type="text"
              value={rightTitle}
              onChange={(e) => {
                setRightTitle(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="Jabatan Kanan"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
            />
            <input
              type="text"
              value={rightName}
              onChange={(e) => {
                setRightName(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="Ketik Nama Pejabat Kanan..."
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
            />
            <input
              type="text"
              value={rightId}
              onChange={(e) => {
                setRightId(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="No. e-KTA / NIK"
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {signLayout === '3_COL' && (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 block">
              Pejabat Tengah (Mengetahui)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <input
                type="text"
                value={centerTitle}
                onChange={(e) => setCenterTitle(e.target.value)}
                placeholder="Jabatan Tengah"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
              />
              <input
                type="text"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                placeholder="Ketik Nama Pejabat Tengah..."
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
              />
              <input
                type="text"
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                placeholder="No. e-KTA / NIK"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

