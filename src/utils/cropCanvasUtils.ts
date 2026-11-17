import { KTP_SCANNER_CONFIG } from '../ktp-scanner/ktpScannerConfig';

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CropModalMode = 'ktp' | 'profile';

export const MIN_CROP_SIZE = 64;

/**
 * Menghitung skala dasar agar gambar muat secara proporsional di dalam kanvas cropper.
 */
export function getCropBaseScale(
  imgW: number,
  imgH: number,
  stageW: number,
  stageH: number,
  rotDeg: number
): number {
  if (!imgW || !imgH || !stageW || !stageH) return 1;
  const rad = (Math.abs(rotDeg % 180) * Math.PI) / 180;
  const rotBoundingW = imgW * Math.cos(rad) + imgH * Math.sin(rad);
  const rotBoundingH = imgW * Math.sin(rad) + imgH * Math.cos(rad);
  const padFactor = 0.88;
  return Math.min(
    (stageW * padFactor) / Math.max(1, rotBoundingW),
    (stageH * padFactor) / Math.max(1, rotBoundingH)
  );
}

/**
 * Menghitung kotak crop awal di tengah area gambar sesuai aspek rasio target.
 */
export function computeInitialCropRect(
  stgW: number,
  stgH: number,
  imgW: number,
  imgH: number,
  rotDeg: number,
  targetAspect: number
): CropRect {
  const bScale = getCropBaseScale(imgW, imgH, stgW, stgH, rotDeg);
  const isRotated90 = Math.abs(Math.round(rotDeg / 90)) % 2 === 1;
  const dispW = (isRotated90 ? imgH : imgW) * bScale;
  const dispH = (isRotated90 ? imgW : imgH) * bScale;

  let boxW = Math.min(dispW * 0.84, stgW * 0.8);
  let boxH = boxW / targetAspect;

  if (boxH > dispH * 0.84 || boxH > stgH * 0.78) {
    boxH = Math.min(dispH * 0.84, stgH * 0.78);
    boxW = Math.min(dispW * 0.88, boxH * targetAspect);
  }

  boxW = Math.max(MIN_CROP_SIZE * 1.2, Math.round(boxW));
  boxH = Math.max(MIN_CROP_SIZE, Math.round(boxH));

  return {
    x: Math.round((stgW - boxW) / 2),
    y: Math.round((stgH - boxH) / 2),
    w: boxW,
    h: boxH,
  };
}

/**
 * Merender gambar dengan transformasi zoom, pan, dan rotasi ke atas stage canvas.
 */
export function renderCropStageCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  imgSize: { w: number; h: number },
  stageSize: { w: number; h: number },
  zoom: number,
  pan: { x: number; y: number },
  totalRotationDeg: number
): void {
  if (!imgSize.w || !imgSize.h) return;
  canvas.width = stageSize.w;
  canvas.height = stageSize.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, stageSize.w, stageSize.h);

  const bScale = getCropBaseScale(
    imgSize.w,
    imgSize.h,
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
  ctx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2);
  ctx.restore();
}

/**
 * Mengekspor hasil potongan resolusi tinggi langsung dari gambar sumber asli.
 */
export function exportCroppedImageDataUrls(params: {
  img: HTMLImageElement;
  imgSize: { w: number; h: number };
  stageSize: { w: number; h: number };
  cropRect: CropRect;
  zoom: number;
  pan: { x: number; y: number };
  totalRotationDeg: number;
  mode: CropModalMode;
}): { croppedDataUrl: string; croppedFaceDataUrl: string } {
  const { img, imgSize, stageSize, cropRect, zoom, pan, totalRotationDeg, mode } = params;
  const bScale = getCropBaseScale(
    imgSize.w,
    imgSize.h,
    stageSize.w,
    stageSize.h,
    totalRotationDeg
  );
  const effectiveScale = bScale * zoom;

  const cropAspect = cropRect.w / Math.max(1, cropRect.h);
  let outW: number;
  let outH: number;

  if (mode === 'profile') {
    const maxDim = 720;
    if (cropAspect >= 1) {
      outW = maxDim;
      outH = Math.max(240, Math.round(maxDim / cropAspect));
    } else {
      outH = maxDim;
      outW = Math.max(240, Math.round(maxDim * cropAspect));
    }
  } else {
    outW = KTP_SCANNER_CONFIG.TARGET_WIDTH; // 1400px agar teks NIK & biodata KTP tajam
    outH = Math.max(400, Math.round(outW / cropAspect));
  }

  const outScale = outW / Math.max(1, cropRect.w);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return { croppedDataUrl: '', croppedFaceDataUrl: '' };

  outCtx.fillStyle = mode === 'profile' ? '#ffffff' : '#0f172a';
  outCtx.fillRect(0, 0, outW, outH);

  outCtx.save();
  outCtx.scale(outScale, outScale);
  outCtx.translate(stageSize.w / 2 + pan.x - cropRect.x, stageSize.h / 2 + pan.y - cropRect.y);
  outCtx.rotate((totalRotationDeg * Math.PI) / 180);
  outCtx.scale(effectiveScale, effectiveScale);
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2);
  outCtx.restore();

  const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.91);

  // Khusus mode KTP, ekstrak otomatis area pasfoto dari sisi kanan kartu e-KTP
  let croppedFaceDataUrl = '';
  if (mode === 'ktp') {
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = KTP_SCANNER_CONFIG.FACE_CROP_WIDTH;
    faceCanvas.height = KTP_SCANNER_CONFIG.FACE_CROP_HEIGHT;
    const faceCtx = faceCanvas.getContext('2d');
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
  }

  return { croppedDataUrl, croppedFaceDataUrl };
}
