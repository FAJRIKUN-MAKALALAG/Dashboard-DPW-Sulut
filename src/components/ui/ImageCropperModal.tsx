import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  X,
  ScanLine,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { KTP_SCANNER_CONFIG } from '../../ktp-scanner/ktpScannerConfig';
import { resolveImageUrl } from '../../utils/imageUtils';
import {
  CropModalMode,
  CropRect,
  MIN_CROP_SIZE,
  computeInitialCropRect,
  exportCroppedImageDataUrls,
  renderCropStageCanvas,
} from '../../utils/cropCanvasUtils';

export interface ImageCropResult {
  croppedDataUrl: string;
  croppedKtpDataUrl: string; // Alias kompatibilitas KTP
  croppedFaceDataUrl: string;
  triggerOcr?: boolean;
}

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSource: string | File | null;
  mode?: CropModalMode;
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  showOcrButton?: boolean;
  showSkipCropButton?: boolean;
  onConfirmCrop: (result: ImageCropResult) => void;
  onSkipCrop?: () => void;
  onCancel: () => void;
}

type DragMode = null | 'move_box' | 'pan_image' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
type AspectLock = 'free' | 'ktp' | '3:4' | '1:1';

function resolveAspectRatioValue(aspect: AspectLock, mode: CropModalMode): number | null {
  if (aspect === 'ktp') return KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
  if (aspect === '3:4') return 3 / 4;
  if (aspect === '1:1') return 1;
  return mode === 'profile' ? null : null;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSource,
  mode = 'ktp',
  title,
  subtitle,
  primaryButtonText,
  showOcrButton = false,
  showSkipCropButton = false,
  onConfirmCrop,
  onSkipCrop,
  onCancel,
}) => {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 680, h: 420 });
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [baseRotation, setBaseRotation] = useState<number>(0);
  const [fineAngle, setFineAngle] = useState<number>(0);
  const [aspectMode, setAspectMode] = useState<AspectLock>(mode === 'profile' ? '3:4' : 'free');
  const [showGuideOverlay, setShowGuideOverlay] = useState<boolean>(true);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 80, y: 50, w: 320, h: 320 });

  const dragStateRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    initialRect: CropRect;
    initialPan: { x: number; y: number };
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    initialRect: { x: 0, y: 0, w: 0, h: 0 },
    initialPan: { x: 0, y: 0 },
  });

  const totalRotationDeg = baseRotation + fineAngle;
  const resolvedTitle =
    title ||
    (mode === 'profile' ? 'Potong & Sesuaikan Pasfoto Profil' : 'Potong & Paskan Foto e-KTP');
  const resolvedSubtitle =
    subtitle ||
    (mode === 'profile'
      ? 'Perbesar (zoom) atau posisikan wajah tepat di tengah bingkai agar pasfoto tercetak rapi pada kartu e-KTA.'
      : 'Perbesar atau tarik sudut kotak potong tepat pada ke-4 sudut kartu e-KTP.');
  const resolvedPrimaryBtn =
    primaryButtonText ||
    (mode === 'profile' ? 'Simpan Pasfoto Profil' : 'Potong & Gunakan Foto KTP');

  const initCropBox = useCallback(
    (stgW: number, stgH: number, imgW: number, imgH: number, rotDeg: number, aspect?: AspectLock) => {
      const target =
        aspect === '1:1'
          ? 1
          : aspect === '3:4'
          ? 3 / 4
          : aspect === 'ktp'
          ? KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO
          : mode === 'profile'
          ? 3 / 4
          : KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
      setCropRect(computeInitialCropRect(stgW, stgH, imgW, imgH, rotDeg, target));
    },
    [mode]
  );

  useEffect(() => {
    if (!isOpen) return;
    setAspectMode(mode === 'profile' ? '3:4' : 'free');
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const updateStageDimensions = () => {
      const el = stageContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const newW = Math.max(280, Math.floor(rect.width));
      const newH = Math.max(240, Math.floor(rect.height));
      setStageSize((prev) =>
        Math.abs(prev.w - newW) > 2 || Math.abs(prev.h - newH) > 2 ? { w: newW, h: newH } : prev
      );
    };
    updateStageDimensions();
    const timer = setTimeout(updateStageDimensions, 60);
    window.addEventListener('resize', updateStageDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateStageDimensions);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !imageSource) return;

    let isCancelled = false;
    setIsLoadingImage(true);
    setImageError(null);

    const loadImg = (srcUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (isCancelled) return;
        loadedImageRef.current = img;
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        setImgNaturalSize({ w: nw, h: nh });
        setBaseRotation(0);
        setFineAngle(0);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsLoadingImage(false);

        const el = stageContainerRef.current;
        const stgW = el ? Math.max(280, Math.floor(el.clientWidth)) : stageSize.w;
        const stgH = el ? Math.max(240, Math.floor(el.clientHeight)) : stageSize.h;
        setStageSize({ w: stgW, h: stgH });
        initCropBox(stgW, stgH, nw, nh, 0, mode === 'profile' ? '3:4' : 'free');
      };
      img.onerror = () => {
        if (isCancelled) return;
        setIsLoadingImage(false);
        setImageError('Gagal memuat berkas gambar. Silakan pilih ulang foto.');
      };
      img.src = srcUrl;
    };

    if (typeof imageSource === 'string') {
      loadImg(resolveImageUrl(imageSource) || imageSource);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!isCancelled && e.target?.result) loadImg(e.target.result as string);
      };
      reader.onerror = () => {
        if (!isCancelled) {
          setIsLoadingImage(false);
          setImageError('Gagal membaca berkas gambar dari perangkat.');
        }
      };
      reader.readAsDataURL(imageSource);
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, imageSource, mode, initCropBox]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = stageCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;
    renderCropStageCanvas(canvas, img, imgNaturalSize, stageSize, zoom, pan, totalRotationDeg);
  }, [isOpen, stageSize, imgNaturalSize, zoom, pan, totalRotationDeg]);

  const applyAspectPreset = (nextAspect: AspectLock) => {
    setAspectMode(nextAspect);
    const ratio = resolveAspectRatioValue(nextAspect, mode);
    if (!ratio) return;

    setCropRect((prev) => {
      const centerX = prev.x + prev.w / 2;
      const centerY = prev.y + prev.h / 2;
      let newW = prev.w;
      let newH = Math.round(newW / ratio);

      if (newH > stageSize.h - 24) {
        newH = stageSize.h - 24;
        newW = Math.round(newH * ratio);
      }
      if (newW > stageSize.w - 24) {
        newW = stageSize.w - 24;
        newH = Math.round(newW / ratio);
      }

      const newX = Math.max(8, Math.min(stageSize.w - newW - 8, Math.round(centerX - newW / 2)));
      const newY = Math.max(8, Math.min(stageSize.h - newH - 8, Math.round(centerY - newH / 2)));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  const handleRotate90 = (dir: -1 | 1) => {
    const nextRot = baseRotation + dir * 90;
    setBaseRotation(nextRot);
    if (imgNaturalSize.w > 0) {
      initCropBox(stageSize.w, stageSize.h, imgNaturalSize.w, imgNaturalSize.h, nextRot + fineAngle, aspectMode);
    }
  };

  const handleResetAll = () => {
    const defaultAspect: AspectLock = mode === 'profile' ? '3:4' : 'free';
    setBaseRotation(0);
    setFineAngle(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAspectMode(defaultAspect);
    if (imgNaturalSize.w > 0) {
      initCropBox(stageSize.w, stageSize.h, imgNaturalSize.w, imgNaturalSize.h, 0, defaultAspect);
    }
  };

  const startPointerDrag = (e: React.PointerEvent, dragMode: DragMode) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      mode: dragMode,
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect },
      initialPan: { ...pan },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragStateRef.current;
    if (!state.mode) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const init = state.initialRect;
    const pad = 6;

    if (state.mode === 'pan_image') {
      setPan({ x: state.initialPan.x + dx, y: state.initialPan.y + dy });
      return;
    }

    if (state.mode === 'move_box') {
      setCropRect({
        ...init,
        x: Math.max(pad, Math.min(stageSize.w - init.w - pad, init.x + dx)),
        y: Math.max(pad, Math.min(stageSize.h - init.h - pad, init.y + dy)),
      });
      return;
    }

    let { x, y, w, h } = init;
    const dMode = state.mode;

    if (dMode.includes('e')) w = Math.max(MIN_CROP_SIZE, Math.min(stageSize.w - x - pad, init.w + dx));
    if (dMode.includes('w')) {
      const clampedDx = Math.max(-(init.x - pad), Math.min(init.w - MIN_CROP_SIZE, dx));
      x = init.x + clampedDx;
      w = init.w - clampedDx;
    }
    if (dMode.includes('s')) h = Math.max(MIN_CROP_SIZE, Math.min(stageSize.h - y - pad, init.h + dy));
    if (dMode.includes('n')) {
      const clampedDy = Math.max(-(init.y - pad), Math.min(init.h - MIN_CROP_SIZE, dy));
      y = init.y + clampedDy;
      h = init.h - clampedDy;
    }

    const lockedRatio = resolveAspectRatioValue(aspectMode, mode);
    if (lockedRatio && (dMode === 'nw' || dMode === 'ne' || dMode === 'sw' || dMode === 'se')) {
      let lockedH = Math.round(w / lockedRatio);
      if (y + lockedH > stageSize.h - pad) {
        lockedH = stageSize.h - pad - y;
        w = Math.round(lockedH * lockedRatio);
      }
      if (lockedH >= MIN_CROP_SIZE && w >= MIN_CROP_SIZE) {
        if (dMode.includes('n')) y = init.y + init.h - lockedH;
        h = lockedH;
      }
    }

    setCropRect({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStateRef.current.mode) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      dragStateRef.current.mode = null;
    }
  };

  const handleConfirm = (triggerOcr: boolean) => {
    const img = loadedImageRef.current;
    if (!img || !imgNaturalSize.w) return;
    const { croppedDataUrl, croppedFaceDataUrl } = exportCroppedImageDataUrls({
      img,
      imgSize: imgNaturalSize,
      stageSize,
      cropRect,
      zoom,
      pan,
      totalRotationDeg,
      mode,
    });
    onConfirmCrop({
      croppedDataUrl,
      croppedKtpDataUrl: croppedDataUrl,
      croppedFaceDataUrl,
      triggerOcr,
    });
  };

  if (!isOpen || !imageSource) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-[100vw] h-[100dvh] sm:w-[95%] sm:max-w-[54rem] sm:h-auto sm:max-h-[94vh] bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1A3282] text-white flex items-center justify-center shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[0.875rem] sm:text-[0.95rem] font-bold text-slate-900 dark:text-white truncate">
                {resolvedTitle}
              </h3>
              <p className="text-[0.7rem] sm:text-[0.75rem] text-slate-500 dark:text-slate-400 truncate">
                {resolvedSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
            title="Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Kanvas Interaktif */}
        <div
          ref={stageContainerRef}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.14 : -0.14;
            setZoom((prev) => Math.max(0.5, Math.min(5, Number((prev + delta).toFixed(2)))));
          }}
          onPointerDown={(e) => startPointerDrag(e, 'pan_image')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-[100%] flex-1 min-h-[17rem] sm:min-h-[23rem] max-h-[56vh] bg-[#090d16] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
        >
          <canvas ref={stageCanvasRef} className="block w-[100%] h-[100%] pointer-events-none" />

          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2 z-20">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-[0.75rem] font-semibold">Memuat resolusi asli foto...</span>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-rose-300 p-4 text-center z-20">
              <p className="text-[0.8rem] font-semibold">{imageError}</p>
            </div>
          )}

          {!isLoadingImage && !imageError && (
            <>
              {/* Masking Gelap 4 Sisi */}
              <div className="absolute bg-slate-950/70 pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: `${Math.max(0, cropRect.y)}px` }} />
              <div className="absolute bg-slate-950/70 pointer-events-none" style={{ top: `${cropRect.y + cropRect.h}px`, left: 0, width: '100%', bottom: 0 }} />
              <div className="absolute bg-slate-950/70 pointer-events-none" style={{ top: `${cropRect.y}px`, left: 0, width: `${Math.max(0, cropRect.x)}px`, height: `${cropRect.h}px` }} />
              <div className="absolute bg-slate-950/70 pointer-events-none" style={{ top: `${cropRect.y}px`, left: `${cropRect.x + cropRect.w}px`, right: 0, height: `${cropRect.h}px` }} />

              {/* Kotak Crop */}
              <div
                onPointerDown={(e) => startPointerDrag(e, 'move_box')}
                style={{ left: `${cropRect.x}px`, top: `${cropRect.y}px`, width: `${cropRect.w}px`, height: `${cropRect.h}px` }}
                className="absolute border-[2px] border-amber-400 shadow-[0_0_0_1px_rgba(15,23,42,0.8)] cursor-move touch-none"
              >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-white/25" />
                  <div className="border-r border-white/25" />
                  <div />
                </div>

                {/* Panduan Visual Sesuai Mode (KTP vs Pasfoto Profil) */}
                {showGuideOverlay && mode === 'ktp' && cropRect.w > 160 && cropRect.h > 100 && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      style={{ left: '4%', top: '15%', width: '64%', height: '13%' }}
                      className="absolute rounded border border-dashed border-sky-300/60 bg-sky-400/10 flex items-center px-1.5"
                    >
                      <span className="text-[0.6rem] font-mono font-bold text-sky-200/90 drop-shadow-xs truncate">
                        AREA 16 DIGIT NIK
                      </span>
                    </div>
                    <div
                      style={{ left: '72%', top: '21%', width: '24%', height: '55%' }}
                      className="absolute rounded border border-dashed border-amber-300/65 bg-amber-400/10 flex items-center justify-center text-center p-1"
                    >
                      <span className="text-[0.58rem] font-bold text-amber-200/90 drop-shadow-xs leading-tight">
                        PASFOTO KTP
                      </span>
                    </div>
                  </div>
                )}

                {showGuideOverlay && mode === 'profile' && cropRect.w > 90 && cropRect.h > 90 && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-[54%] h-[62%] rounded-full border-2 border-dashed border-amber-300/65 bg-amber-400/5 -mt-3 flex items-end justify-center pb-2">
                      <span className="text-[0.58rem] font-bold text-amber-200/90 drop-shadow-xs bg-slate-950/60 px-1.5 py-0.5 rounded">
                        POSISI WAJAH
                      </span>
                    </div>
                  </div>
                )}

                {/* 4 Sudut + 4 Sisi Handle */}
                <div onPointerDown={(e) => startPointerDrag(e, 'nw')} className="absolute -top-3.5 -left-3.5 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-10">
                  <div className="w-4 h-4 border-t-[3.5px] border-l-[3.5px] border-amber-400 rounded-tl-xs bg-slate-950/40" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 'ne')} className="absolute -top-3.5 -right-3.5 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-10">
                  <div className="w-4 h-4 border-t-[3.5px] border-r-[3.5px] border-amber-400 rounded-tr-xs bg-slate-950/40" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 'sw')} className="absolute -bottom-3.5 -left-3.5 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-10">
                  <div className="w-4 h-4 border-b-[3.5px] border-l-[3.5px] border-amber-400 rounded-bl-xs bg-slate-950/40" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 'se')} className="absolute -bottom-3.5 -right-3.5 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-10">
                  <div className="w-4 h-4 border-b-[3.5px] border-r-[3.5px] border-amber-400 rounded-br-xs bg-slate-950/40" />
                </div>

                <div onPointerDown={(e) => startPointerDrag(e, 'n')} className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center cursor-ns-resize touch-none z-10">
                  <div className="w-7 h-1.5 rounded-full bg-amber-400 shadow-xs" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 's')} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center cursor-ns-resize touch-none z-10">
                  <div className="w-7 h-1.5 rounded-full bg-amber-400 shadow-xs" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 'w')} className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize touch-none z-10">
                  <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-xs" />
                </div>
                <div onPointerDown={(e) => startPointerDrag(e, 'e')} className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize touch-none z-10">
                  <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-xs" />
                </div>
              </div>

              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 border border-slate-700/80 text-white text-[0.68rem] font-semibold">
                  Tarik sudut kuning untuk memotong • Geser foto untuk memposisikan
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-700/80 text-amber-300 font-mono text-[0.68rem] font-bold">
                  Zoom {(zoom * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Panel Kontrol Zoom, Kemiringan & Rasio */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(2))))}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between text-[0.65rem] font-bold text-slate-500 dark:text-slate-400">
                  <span>Perbesar Foto (Zoom)</span>
                  <span className="font-mono text-[#1A3282] dark:text-amber-300">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={4.5}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-[100%] accent-[#1A3282] cursor-pointer h-1.5"
                />
              </div>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4.5, Number((z + 0.2).toFixed(2))))}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between text-[0.65rem] font-bold text-slate-500 dark:text-slate-400">
                  <span>Luruskan Kemiringan</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={fineAngle}
                  onChange={(e) => setFineAngle(parseFloat(e.target.value))}
                  className="w-[100%] accent-[#1A3282] cursor-pointer h-1.5"
                />
              </div>
              {fineAngle !== 0 && (
                <button
                  type="button"
                  onClick={() => setFineAngle(0)}
                  className="text-[0.65rem] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  0°
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRotate90(-1)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[0.72rem] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Putar Kiri</span>
              </button>

              <button
                type="button"
                onClick={() => handleRotate90(1)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[0.72rem] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Putar Kanan</span>
              </button>

              {mode === 'ktp' ? (
                <button
                  type="button"
                  onClick={() => (aspectMode === 'ktp' ? setAspectMode('free') : applyAspectPreset('ktp'))}
                  className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    aspectMode === 'ktp'
                      ? 'bg-[#1A3282] text-white border-[#1A3282]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{aspectMode === 'ktp' ? 'Rasio KTP Terkunci' : 'Pas Rasio KTP'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => applyAspectPreset('3:4')}
                    className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer ${
                      aspectMode === '3:4'
                        ? 'bg-[#1A3282] text-white border-[#1A3282]'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Pasfoto 3:4
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAspectPreset('1:1')}
                    className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer ${
                      aspectMode === '1:1'
                        ? 'bg-[#1A3282] text-white border-[#1A3282]'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Persegi 1:1
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectMode('free')}
                    className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer ${
                      aspectMode === 'free'
                        ? 'bg-[#1A3282] text-white border-[#1A3282]'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Bebas
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowGuideOverlay((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer transition-colors ${
                  showGuideOverlay
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                {mode === 'profile' ? 'Panduan Wajah' : 'Panduan Zona KTP'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-[0.72rem] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Posisi</span>
            </button>
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.6em 1.1em' }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[0.75rem] font-semibold cursor-pointer"
            >
              Batal
            </button>

            {showSkipCropButton && onSkipCrop && (
              <button
                type="button"
                onClick={onSkipCrop}
                style={{ padding: '0.6em 1.1em' }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[0.75rem] font-semibold cursor-pointer"
              >
                Gunakan Utuh Tanpa Crop
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {showOcrButton && mode === 'ktp' && (
              <button
                type="button"
                disabled={isLoadingImage || Boolean(imageError)}
                onClick={() => handleConfirm(true)}
                style={{ padding: '0.65em 1.25em' }}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[0.75rem] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ScanLine className="w-4 h-4" />
                <span>Crop &amp; Baca Data KTP Otomatis</span>
              </button>
            )}

            <button
              type="button"
              disabled={isLoadingImage || Boolean(imageError)}
              onClick={() => handleConfirm(false)}
              style={{ padding: '0.65em 1.35em' }}
              className="rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-[0.78rem] font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{resolvedPrimaryBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
