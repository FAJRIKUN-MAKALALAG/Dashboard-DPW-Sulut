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
import { KTP_SCANNER_CONFIG } from '../ktpScannerConfig';
import { resolveImageUrl } from '../../utils/imageUtils';

export interface KtpCropResult {
  croppedKtpDataUrl: string;
  croppedFaceDataUrl: string;
  triggerOcr?: boolean;
}

export interface KtpImageCropperModalProps {
  isOpen: boolean;
  imageSource: string | File | null;
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  showOcrButton?: boolean;
  showSkipCropButton?: boolean;
  onConfirmCrop: (result: KtpCropResult) => void;
  onSkipCrop?: () => void;
  onCancel: () => void;
}

type DragMode =
  | null
  | 'move_box'
  | 'pan_image'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'e'
  | 'w';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_CROP_SIZE = 64;

export const KtpImageCropperModal: React.FC<KtpImageCropperModalProps> = ({
  isOpen,
  imageSource,
  title = 'Potong & Sesuaikan Posisi Foto e-KTP',
  subtitle = 'Perbesar atau geser kotak potong agar pas pada ke-4 sudut kartu e-KTP (sangat berguna jika foto diambil dari jauh).',
  primaryButtonText = 'Potong & Gunakan Foto KTP',
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
  const [baseRotation, setBaseRotation] = useState<number>(0); // 0, 90, 180, 270, etc.
  const [fineAngle, setFineAngle] = useState<number>(0); // -15 to +15
  const [aspectMode, setAspectMode] = useState<'free' | 'ktp'>('free');
  const [showKtpGuideOverlay, setShowKtpGuideOverlay] = useState<boolean>(true);

  const [cropRect, setCropRect] = useState<CropRect>({ x: 80, y: 50, w: 480, h: 300 });

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

  // Hitung baseScale agar gambar muat secara proporsional di dalam stage saat zoom = 1
  const getBaseScale = useCallback(
    (imgW: number, imgH: number, stgW: number, stgH: number, rotDeg: number) => {
      if (!imgW || !imgH || !stgW || !stgH) return 1;
      const rad = (Math.abs(rotDeg % 180) * Math.PI) / 180;
      const rotBoundingW = imgW * Math.cos(rad) + imgH * Math.sin(rad);
      const rotBoundingH = imgW * Math.sin(rad) + imgH * Math.cos(rad);
      const padFactor = 0.88;
      return Math.min(
        (stgW * padFactor) / Math.max(1, rotBoundingW),
        (stgH * padFactor) / Math.max(1, rotBoundingH)
      );
    },
    []
  );

  // Inisialisasi posisi kotak crop di tengah gambar
  const initializeCropBoxForStage = useCallback(
    (stgW: number, stgH: number, imgW: number, imgH: number, rotDeg: number) => {
      const bScale = getBaseScale(imgW, imgH, stgW, stgH, rotDeg);
      const isRotated90 = Math.abs(Math.round(rotDeg / 90)) % 2 === 1;
      const dispW = (isRotated90 ? imgH : imgW) * bScale;
      const dispH = (isRotated90 ? imgW : imgH) * bScale;

      const targetRatio = KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
      let boxW = Math.min(dispW * 0.86, stgW * 0.82);
      let boxH = boxW / targetRatio;

      if (boxH > dispH * 0.86) {
        boxH = Math.min(dispH * 0.86, stgH * 0.78);
        boxW = Math.min(dispW * 0.9, boxH * targetRatio);
      }

      boxW = Math.max(MIN_CROP_SIZE * 1.5, Math.round(boxW));
      boxH = Math.max(MIN_CROP_SIZE, Math.round(boxH));

      setCropRect({
        x: Math.round((stgW - boxW) / 2),
        y: Math.round((stgH - boxH) / 2),
        w: boxW,
        h: boxH,
      });
    },
    [getBaseScale]
  );

  // Ukur ukuran container stage secara responsif
  useEffect(() => {
    if (!isOpen) return;
    const updateStageDimensions = () => {
      const el = stageContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const newW = Math.max(280, Math.floor(rect.width));
      const newH = Math.max(240, Math.floor(rect.height));
      setStageSize((prev) => {
        if (Math.abs(prev.w - newW) > 2 || Math.abs(prev.h - newH) > 2) {
          return { w: newW, h: newH };
        }
        return prev;
      });
    };

    updateStageDimensions();
    const timer = setTimeout(updateStageDimensions, 60);
    window.addEventListener('resize', updateStageDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateStageDimensions);
    };
  }, [isOpen]);

  // Muat gambar dari File atau URL
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

        // Jika foto potret (tinggi jauh lebih besar dari lebar), tetap tampilkan utuh agar pengguna leluasa memutar atau memotong langsung
        setBaseRotation(0);
        setFineAngle(0);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsLoadingImage(false);

        const el = stageContainerRef.current;
        const stgW = el ? Math.max(280, Math.floor(el.clientWidth)) : stageSize.w;
        const stgH = el ? Math.max(240, Math.floor(el.clientHeight)) : stageSize.h;
        setStageSize({ w: stgW, h: stgH });
        initializeCropBoxForStage(stgW, stgH, nw, nh, 0);
      };
      img.onerror = () => {
        if (isCancelled) return;
        setIsLoadingImage(false);
        setImageError('Gagal memuat gambar KTP. Silakan pilih ulang berkas foto.');
      };
      img.src = srcUrl;
    };

    if (typeof imageSource === 'string') {
      loadImg(resolveImageUrl(imageSource) || imageSource);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!isCancelled && e.target?.result) {
          loadImg(e.target.result as string);
        }
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
  }, [isOpen, imageSource, initializeCropBoxForStage]);

  // Render stage canvas setiap kali transform atau ukuran berubah
  useEffect(() => {
    if (!isOpen) return;
    const canvas = stageCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img || !imgNaturalSize.w) return;

    canvas.width = stageSize.w;
    canvas.height = stageSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Latar belakang gelap studio
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, stageSize.w, stageSize.h);

    const bScale = getBaseScale(
      imgNaturalSize.w,
      imgNaturalSize.h,
      stageSize.w,
      stageSize.h,
      totalRotationDeg
    );
    const effectiveScale = bScale * zoom;

    ctx.save();
    ctx.translate(stageSize.w / 2 + pan.x, stageSize.h / 2 + pan.y);
    ctx.rotate((totalRotationDeg * Math.PI) / 180);
    ctx.scale(effectiveScale, effectiveScale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -imgNaturalSize.w / 2, -imgNaturalSize.h / 2);
    ctx.restore();
  }, [isOpen, stageSize, imgNaturalSize, zoom, pan, totalRotationDeg, getBaseScale]);

  const handleRotate90 = (dir: -1 | 1) => {
    const nextRot = baseRotation + dir * 90;
    setBaseRotation(nextRot);
    if (imgNaturalSize.w > 0) {
      initializeCropBoxForStage(
        stageSize.w,
        stageSize.h,
        imgNaturalSize.w,
        imgNaturalSize.h,
        nextRot + fineAngle
      );
    }
  };

  const handleSnapToKtpRatio = () => {
    setAspectMode('ktp');
    const ratio = KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
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

  const handleResetAll = () => {
    setBaseRotation(0);
    setFineAngle(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAspectMode('free');
    if (imgNaturalSize.w > 0) {
      initializeCropBoxForStage(stageSize.w, stageSize.h, imgNaturalSize.w, imgNaturalSize.h, 0);
    }
  };

  // Pointer Down untuk Drag Box, Resize Handle, atau Pan Gambar
  const startPointerDrag = (e: React.PointerEvent, mode: DragMode) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      mode,
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
      setPan({
        x: state.initialPan.x + dx,
        y: state.initialPan.y + dy,
      });
      return;
    }

    if (state.mode === 'move_box') {
      const nextX = Math.max(pad, Math.min(stageSize.w - init.w - pad, init.x + dx));
      const nextY = Math.max(pad, Math.min(stageSize.h - init.h - pad, init.y + dy));
      setCropRect({ ...init, x: nextX, y: nextY });
      return;
    }

    let { x, y, w, h } = init;
    const mode = state.mode;

    // Resize sisi kanan / kiri
    if (mode.includes('e')) {
      w = Math.max(MIN_CROP_SIZE, Math.min(stageSize.w - x - pad, init.w + dx));
    }
    if (mode.includes('w')) {
      const maxLeftDx = init.w - MIN_CROP_SIZE;
      const clampedDx = Math.max(-(init.x - pad), Math.min(maxLeftDx, dx));
      x = init.x + clampedDx;
      w = init.w - clampedDx;
    }

    // Resize sisi bawah / atas
    if (mode.includes('s')) {
      h = Math.max(MIN_CROP_SIZE, Math.min(stageSize.h - y - pad, init.h + dy));
    }
    if (mode.includes('n')) {
      const maxTopDy = init.h - MIN_CROP_SIZE;
      const clampedDy = Math.max(-(init.y - pad), Math.min(maxTopDy, dy));
      y = init.y + clampedDy;
      h = init.h - clampedDy;
    }

    // Jika mode rasio KTP terkunci dan menarik salah satu sudut (nw, ne, sw, se)
    if (aspectMode === 'ktp' && (mode === 'nw' || mode === 'ne' || mode === 'sw' || mode === 'se')) {
      const ratio = KTP_SCANNER_CONFIG.ID1_ASPECT_RATIO;
      let lockedH = Math.round(w / ratio);
      if (y + lockedH > stageSize.h - pad) {
        lockedH = stageSize.h - pad - y;
        w = Math.round(lockedH * ratio);
      }
      if (lockedH >= MIN_CROP_SIZE && w >= MIN_CROP_SIZE) {
        if (mode.includes('n')) {
          y = init.y + init.h - lockedH;
        }
        h = lockedH;
      }
    }

    setCropRect({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStateRef.current.mode) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      dragStateRef.current.mode = null;
    }
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.14 : -0.14;
    setZoom((prev) => Math.max(0.5, Math.min(5, Number((prev + delta).toFixed(2)))));
  };

  // Eksekusi pemotongan dari resolusi asli gambar (High-Res Output)
  const executeHighResCrop = (triggerOcr: boolean) => {
    const img = loadedImageRef.current;
    if (!img || !imgNaturalSize.w) return;

    const bScale = getBaseScale(
      imgNaturalSize.w,
      imgNaturalSize.h,
      stageSize.w,
      stageSize.h,
      totalRotationDeg
    );
    const effectiveScale = bScale * zoom;

    // Resolusi kanvas hasil crop: standar tinggi (maks 1400px lebar agar teks NIK & Nama super tajam)
    const cropAspect = cropRect.w / Math.max(1, cropRect.h);
    const outW = KTP_SCANNER_CONFIG.TARGET_WIDTH; // 1400px
    const outH = Math.max(400, Math.round(outW / cropAspect));
    const outScale = outW / Math.max(1, cropRect.w);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    outCtx.fillStyle = '#0f172a';
    outCtx.fillRect(0, 0, outW, outH);

    outCtx.save();
    outCtx.scale(outScale, outScale);
    outCtx.translate(stageSize.w / 2 + pan.x - cropRect.x, stageSize.h / 2 + pan.y - cropRect.y);
    outCtx.rotate((totalRotationDeg * Math.PI) / 180);
    outCtx.scale(effectiveScale, effectiveScale);
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(img, -imgNaturalSize.w / 2, -imgNaturalSize.h / 2);
    outCtx.restore();

    const croppedKtpDataUrl = outCanvas.toDataURL('image/jpeg', 0.92);

    // Ekstrak juga pasfoto wajah dari sisi kanan hasil crop KTP
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = KTP_SCANNER_CONFIG.FACE_CROP_WIDTH;
    faceCanvas.height = KTP_SCANNER_CONFIG.FACE_CROP_HEIGHT;
    const faceCtx = faceCanvas.getContext('2d');
    let croppedFaceDataUrl = '';
    if (faceCtx) {
      faceCtx.drawImage(
        outCanvas,
        Math.round(outW * KTP_SCANNER_CONFIG.FACE_ROI.xRatio),
        Math.round(outH * KTP_SCANNER_CONFIG.FACE_ROI.yRatio),
        Math.round(outW * KTP_SCANNER_CONFIG.FACE_ROI.widthRatio),
        Math.round(outH * KTP_SCANNER_CONFIG.FACE_ROI.heightRatio),
        0,
        0,
        KTP_SCANNER_CONFIG.FACE_CROP_WIDTH,
        KTP_SCANNER_CONFIG.FACE_CROP_HEIGHT
      );
      croppedFaceDataUrl = faceCanvas.toDataURL('image/jpeg', 0.88);
    }

    onConfirmCrop({
      croppedKtpDataUrl,
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
                {title}
              </h3>
              <p className="text-[0.7rem] sm:text-[0.75rem] text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
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

        {/* Area Kanvas Interaktif Cropper */}
        <div
          ref={stageContainerRef}
          onWheel={handleWheelZoom}
          onPointerDown={(e) => startPointerDrag(e, 'pan_image')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-[100%] flex-1 min-h-[17rem] sm:min-h-[23rem] max-h-[56vh] bg-[#090d16] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
        >
          <canvas
            ref={stageCanvasRef}
            className="block w-[100%] h-[100%] pointer-events-none"
          />

          {isLoadingImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2 z-20">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-[0.75rem] font-semibold">Memuat resolusi asli foto KTP...</span>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-rose-300 p-4 text-center z-20">
              <p className="text-[0.8rem] font-semibold">{imageError}</p>
            </div>
          )}

          {/* Masking Gelap di Luar Area Crop + Kotak Crop Interaktif */}
          {!isLoadingImage && !imageError && (
            <>
              {/* 4 Panel Mask Gelap di sekeliling Crop Box */}
              <div
                className="absolute bg-slate-950/70 pointer-events-none"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${Math.max(0, cropRect.y)}px`,
                }}
              />
              <div
                className="absolute bg-slate-950/70 pointer-events-none"
                style={{
                  top: `${cropRect.y + cropRect.h}px`,
                  left: 0,
                  width: '100%',
                  bottom: 0,
                }}
              />
              <div
                className="absolute bg-slate-950/70 pointer-events-none"
                style={{
                  top: `${cropRect.y}px`,
                  left: 0,
                  width: `${Math.max(0, cropRect.x)}px`,
                  height: `${cropRect.h}px`,
                }}
              />
              <div
                className="absolute bg-slate-950/70 pointer-events-none"
                style={{
                  top: `${cropRect.y}px`,
                  left: `${cropRect.x + cropRect.w}px`,
                  right: 0,
                  height: `${cropRect.h}px`,
                }}
              />

              {/* Bingkai Utama Kotak Crop */}
              <div
                onPointerDown={(e) => startPointerDrag(e, 'move_box')}
                style={{
                  left: `${cropRect.x}px`,
                  top: `${cropRect.y}px`,
                  width: `${cropRect.w}px`,
                  height: `${cropRect.h}px`,
                }}
                className="absolute border-[2px] border-amber-400 shadow-[0_0_0_1px_rgba(15,23,42,0.8)] cursor-move touch-none"
              >
                {/* Garis bantu Rule of Thirds */}
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

                {/* Panduan Siluet Zona NIK & Pasfoto KTP */}
                {showKtpGuideOverlay && cropRect.w > 160 && cropRect.h > 100 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Zona Baris NIK */}
                    <div
                      style={{
                        left: '4%',
                        top: '15%',
                        width: '64%',
                        height: '13%',
                      }}
                      className="absolute rounded border border-dashed border-sky-300/60 bg-sky-400/10 flex items-center px-1.5"
                    >
                      <span className="text-[0.6rem] font-mono font-bold text-sky-200/90 drop-shadow-xs truncate">
                        AREA 16 DIGIT NIK
                      </span>
                    </div>

                    {/* Zona Pasfoto KTP di Kanan */}
                    <div
                      style={{
                        left: '72%',
                        top: '21%',
                        width: '24%',
                        height: '55%',
                      }}
                      className="absolute rounded border border-dashed border-amber-300/65 bg-amber-400/10 flex items-center justify-center text-center p-1"
                    >
                      <span className="text-[0.58rem] font-bold text-amber-200/90 drop-shadow-xs leading-tight">
                        PASFOTO KTP
                      </span>
                    </div>
                  </div>
                )}

                {/* 4 Sudut Handle (Touch-Friendly 40x40px Hit Area) */}
                {/* Top-Left (NW) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'nw')}
                  className="absolute -top-3.5 -left-3.5 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-10"
                >
                  <div className="w-4 h-4 border-t-[3.5px] border-l-[3.5px] border-amber-400 rounded-tl-xs bg-slate-950/40" />
                </div>

                {/* Top-Right (NE) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'ne')}
                  className="absolute -top-3.5 -right-3.5 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-10"
                >
                  <div className="w-4 h-4 border-t-[3.5px] border-r-[3.5px] border-amber-400 rounded-tr-xs bg-slate-950/40" />
                </div>

                {/* Bottom-Left (SW) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'sw')}
                  className="absolute -bottom-3.5 -left-3.5 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-10"
                >
                  <div className="w-4 h-4 border-b-[3.5px] border-l-[3.5px] border-amber-400 rounded-bl-xs bg-slate-950/40" />
                </div>

                {/* Bottom-Right (SE) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'se')}
                  className="absolute -bottom-3.5 -right-3.5 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-10"
                >
                  <div className="w-4 h-4 border-b-[3.5px] border-r-[3.5px] border-amber-400 rounded-br-xs bg-slate-950/40" />
                </div>

                {/* 4 Sisi Tengah Handle (N, S, E, W) */}
                {/* Top (N) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'n')}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center cursor-ns-resize touch-none z-10"
                >
                  <div className="w-7 h-1.5 rounded-full bg-amber-400 shadow-xs" />
                </div>

                {/* Bottom (S) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 's')}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center cursor-ns-resize touch-none z-10"
                >
                  <div className="w-7 h-1.5 rounded-full bg-amber-400 shadow-xs" />
                </div>

                {/* Left (W) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'w')}
                  className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize touch-none z-10"
                >
                  <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-xs" />
                </div>

                {/* Right (E) */}
                <div
                  onPointerDown={(e) => startPointerDrag(e, 'e')}
                  className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 flex items-center justify-center cursor-ew-resize touch-none z-10"
                >
                  <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-xs" />
                </div>
              </div>

              {/* Petunjuk Singkat di Sudut Atas Stage */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 border border-slate-700/80 text-white text-[0.68rem] font-semibold">
                  Tarik sudut kuning untuk memotong • Geser gambar untuk memposisikan
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-700/80 text-amber-300 font-mono text-[0.68rem] font-bold">
                  Zoom {(zoom * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Panel Kontrol Zoom, Rotasi, & Rasio */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
          {/* Baris 1: Zoom Slider & Kemiringan Halus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 items-center">
            {/* Kontrol Perbesar (Zoom In/Out untuk Foto KTP dari Jauh) */}
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
                  <span className="font-mono text-[#1A3282] dark:text-amber-300">
                    {(zoom * 100).toFixed(0)}%
                  </span>
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

            {/* Kontrol Luruskan Kemiringan Halus (-15° s/d +15°) */}
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

          {/* Baris 2: Tombol Cepat Putar 90°, Rasio KTP, Panduan, Reset */}
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

              <button
                type="button"
                onClick={() => {
                  if (aspectMode === 'ktp') setAspectMode('free');
                  else handleSnapToKtpRatio();
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  aspectMode === 'ktp'
                    ? 'bg-[#1A3282] text-white border-[#1A3282]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{aspectMode === 'ktp' ? 'Rasio KTP Terkunci' : 'Pas Rasio KTP'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowKtpGuideOverlay((v) => !v)}
                className={`px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer transition-colors ${
                  showKtpGuideOverlay
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                Panduan Zona KTP
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

        {/* Footer Tombol Aksi */}
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
            {showOcrButton && (
              <button
                type="button"
                disabled={isLoadingImage || Boolean(imageError)}
                onClick={() => executeHighResCrop(true)}
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
              onClick={() => executeHighResCrop(false)}
              style={{ padding: '0.65em 1.35em' }}
              className="rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-[0.78rem] font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{primaryButtonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
