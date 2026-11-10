import React from 'react';
import { Camera, X, SwitchCamera, ScanLine } from 'lucide-react';

interface KtpLiveCameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStopCamera: () => void;
  onCapture: () => void;
  onToggleFacingMode: () => void;
}

export const KtpLiveCameraViewport: React.FC<KtpLiveCameraViewportProps> = ({
  videoRef,
  onStopCamera,
  onCapture,
  onToggleFacingMode,
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
      <div className="relative w-full aspect-4/3 sm:aspect-16/9 max-h-[420px] flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Gelapkan area luar bingkai KTP */}
        <div className="absolute inset-0 bg-slate-950/45 pointer-events-none flex items-center justify-center p-3 sm:p-6">
          {/* Bingkai Proporsional ID-1 e-KTP (1.585 : 1) */}
          <div className="relative w-full max-w-[440px] aspect-[1.585/1] rounded-xl border-2 border-white/85 shadow-[0_0_0_9999px_rgba(2,6,23,0.62)]">
            {/* 4 Sudut Siku Penanda */}
            <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-xl" />

            {/* Panduan Area Header & NIK */}
            <div className="absolute top-[16%] left-[5%] right-[30%] h-[13%] border border-dashed border-white/60 rounded bg-white/10 flex items-center px-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-white tracking-wider uppercase">
                16 Digit NIK KTP
              </span>
            </div>

            {/* Panduan Area Biodata Kiri */}
            <div className="hidden sm:flex absolute top-[33%] left-[5%] right-[32%] bottom-[12%] border border-dashed border-white/35 rounded items-center justify-center">
              <span className="text-[10px] font-medium text-white/75">
                Nama, TTL & Alamat
              </span>
            </div>

            {/* Panduan Area Pasfoto KTP Kanan */}
            <div className="absolute top-[22%] right-[5%] w-[23%] h-[54%] border border-dashed border-white/60 rounded bg-white/10 flex items-center justify-center text-center p-1">
              <span className="text-[9px] font-semibold text-white/90 leading-tight">
                FOTO
              </span>
            </div>
          </div>
        </div>

        {/* Banner Instruksi Atas */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/15">
            <ScanLine className="w-3.5 h-3.5 text-white" />
            <span>Posisikan e-KTP tepat di dalam bingkai</span>
          </div>
        </div>
      </div>

      {/* Kontrol Kamera Bawah (Responsif Mobile & Desktop) */}
      <div className="p-3 sm:p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStopCamera}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Batal</span>
        </button>

        <button
          type="button"
          onClick={onCapture}
          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-transform active:scale-95"
        >
          <Camera className="w-4 h-4 text-[#1A3282]" />
          <span>Ambil Foto & Baca KTP</span>
        </button>

        <button
          type="button"
          onClick={onToggleFacingMode}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Putar Kamera Depan / Belakang"
        >
          <SwitchCamera className="w-4 h-4" />
          <span className="hidden sm:inline">Kamera</span>
        </button>
      </div>
    </div>
  );
};
