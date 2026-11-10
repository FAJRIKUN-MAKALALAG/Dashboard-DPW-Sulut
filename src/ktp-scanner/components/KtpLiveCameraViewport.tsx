import React from 'react';
import { Camera, X, SwitchCamera, ScanLine, Zap, ZapOff } from 'lucide-react';

interface KtpLiveCameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  guideFrameRef: React.RefObject<HTMLDivElement | null>;
  isTorchOn: boolean;
  isTorchSupported: boolean;
  torchNotice: string | null;
  onToggleTorch: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
  onToggleFacingMode: () => void;
}

export const KtpLiveCameraViewport: React.FC<KtpLiveCameraViewportProps> = ({
  videoRef,
  guideFrameRef,
  isTorchOn,
  isTorchSupported,
  torchNotice,
  onToggleTorch,
  onStopCamera,
  onCapture,
  onToggleFacingMode,
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
      <div className="relative w-full aspect-4/3 sm:aspect-16/9 max-h-[430px] flex items-center justify-center overflow-hidden bg-black">
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
          <div
            ref={guideFrameRef}
            className="relative w-full max-w-[440px] aspect-[1.585/1] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.65)]"
          >
            <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-xl" />

            <div className="absolute top-[15%] left-[4%] right-[29%] h-[14%] border border-dashed border-white/65 rounded bg-white/10 flex items-center px-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-white tracking-wider uppercase">
                16 Digit NIK KTP
              </span>
            </div>

            <div className="hidden sm:flex absolute top-[32%] left-[4%] right-[30%] bottom-[10%] border border-dashed border-white/40 rounded items-center justify-center">
              <span className="text-[10px] font-medium text-white/80">
                Nama, TTL, Alamat, Kel/Desa & Kecamatan
              </span>
            </div>

            <div className="absolute top-[21%] right-[4%] w-[24%] h-[56%] border border-dashed border-white/65 rounded bg-white/10 flex items-center justify-center text-center p-1">
              <span className="text-[9px] font-semibold text-white/90 leading-tight">
                FOTO
              </span>
            </div>
          </div>
        </div>

        {/* Banner Instruksi Atas */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/15">
            <ScanLine className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="truncate">Paskan e-KTP penuh di dalam bingkai putih</span>
          </div>

          {isTorchOn && (
            <div className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-xs shrink-0">
              <Zap className="w-3 h-3 fill-current" />
              <span>Flash Aktif</span>
            </div>
          )}
        </div>

        {torchNotice && (
          <div className="absolute bottom-2.5 left-3 right-3 flex justify-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 text-[11px] text-center shadow-md">
              {torchNotice}
            </div>
          </div>
        )}
      </div>

      {/* Kontrol Kamera Bawah */}
      <div className="p-3 sm:p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStopCamera}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden xs:inline">Batal</span>
        </button>

        <button
          type="button"
          onClick={onCapture}
          className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-transform active:scale-95"
        >
          <Camera className="w-4 h-4 text-[#1A3282]" />
          <span>Ambil Foto & Baca KTP</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleTorch}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isTorchOn
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={
              isTorchSupported
                ? isTorchOn
                  ? 'Matikan Flash Kamera'
                  : 'Nyalakan Flash / Senter Kamera'
                : 'Nyalakan Lampu Bantuan Kamera'
            }
          >
            {isTorchOn ? (
              <Zap className="w-4 h-4 fill-current" />
            ) : (
              <ZapOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isTorchOn ? 'Flash ON' : 'Flash'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFacingMode}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Putar Kamera Depan / Belakang"
          >
            <SwitchCamera className="w-4 h-4" />
            <span className="hidden md:inline">Kamera</span>
          </button>
        </div>
      </div>
    </div>
  );
};

