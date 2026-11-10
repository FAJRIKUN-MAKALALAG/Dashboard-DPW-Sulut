import { KTP_SCANNER_CONFIG } from './ktpScannerConfig';

export interface KtpImageQualityReport {
  isValid: boolean;
  score: number; // 0 - 100
  isLandscape: boolean;
  wasAutoRotated: boolean;
  brightnessStatus: 'TOO_DARK' | 'TOO_BRIGHT' | 'GOOD';
  sharpnessStatus: 'BLURRY' | 'GOOD';
  resolutionStatus: 'LOW' | 'GOOD';
  warnings: string[];
  tips: string[];
}

export interface PreprocessedKtpImages {
  standardizedKtpDataUrl: string;
  ocrEnhancedDataUrl: string;
  nikZoneDataUrl: string;
  biodataZoneDataUrl: string;
  croppedFaceDataUrl: string;
  quality: KtpImageQualityReport;
}

function loadImageElement(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

function buildAdaptiveOcrGrayscale(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): {
  enhancedGray: Uint8ClampedArray;
  avgLum: number;
  glareRatio: number;
  sharpnessVal: number;
} {
  const pixelCount = width * height;
  const cyanFiltered = new Uint8Array(pixelCount);

  let totalLum = 0;
  let brightPixels = 0;

  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLum += lum;
    if (lum > 245) brightPixels++;

    const isCyanBackground = b > r + 16 && g > r + 10 && b > 95;
    if (isCyanBackground) {
      cyanFiltered[p] = Math.min(255, Math.round(b * 0.65 + g * 0.35 + 28));
    } else {
      cyanFiltered[p] = Math.round(0.65 * r + 0.25 * g + 0.1 * b);
    }
  }

  const avgLum = totalLum / pixelCount;
  const glareRatio = brightPixels / pixelCount;

  let edgeEnergy = 0;
  let edgeSamples = 0;
  const textAreaW = Math.floor(width * 0.71);
  for (let y = 40; y < height - 40; y += 2) {
    for (let x = 30; x < textAreaW; x += 2) {
      const idx = y * width + x;
      const gx = Math.abs(cyanFiltered[idx + 1] - cyanFiltered[idx - 1]);
      const gy = Math.abs(cyanFiltered[idx + width] - cyanFiltered[idx - width]);
      edgeEnergy += gx + gy;
      edgeSamples++;
    }
  }
  const sharpnessVal = edgeSamples > 0 ? edgeEnergy / edgeSamples : 0;

  const sharpened = new Uint8ClampedArray(pixelCount);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        sharpened[idx] = cyanFiltered[idx];
        continue;
      }
      const center = cyanFiltered[idx];
      const neighbors =
        (cyanFiltered[idx - 1] +
          cyanFiltered[idx + 1] +
          cyanFiltered[idx - width] +
          cyanFiltered[idx + width]) *
        0.25;
      const diff = center - neighbors;
      sharpened[idx] = Math.max(0, Math.min(255, Math.round(center + diff * 1.45)));
    }
  }

  const integral = new Float64Array(pixelCount);
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      rowSum += sharpened[rowOffset + x];
      integral[rowOffset + x] = (y > 0 ? integral[(y - 1) * width + x] : 0) + rowSum;
    }
  }

  const enhancedGray = new Uint8ClampedArray(pixelCount);
  const radius = Math.max(18, Math.round(width * 0.024));

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - radius);
    const y2 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - radius);
      const x2 = Math.min(width - 1, x + radius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const a = integral[y2 * width + x2];
      const b = y1 > 0 ? integral[(y1 - 1) * width + x2] : 0;
      const c = x1 > 0 ? integral[y2 * width + (x1 - 1)] : 0;
      const d = y1 > 0 && x1 > 0 ? integral[(y1 - 1) * width + (x1 - 1)] : 0;
      const localMean = (a - b - c + d) / count;

      const idx = y * width + x;
      const val = sharpened[idx];

      const ratio = localMean > 10 ? val / localMean : 1;
      if (ratio < 0.78 && val < 175) {
        const ink = Math.max(0, Math.round((ratio - 0.45) * 260));
        enhancedGray[idx] = Math.min(90, Math.max(0, ink));
      } else if (ratio < 0.87 && val < 195) {
        enhancedGray[idx] = Math.round(110 + (ratio - 0.78) * 1100);
      } else {
        enhancedGray[idx] = 255;
      }
    }
  }

  return {
    enhancedGray,
    avgLum,
    glareRatio,
    sharpnessVal,
  };
}

export async function standardizeAndPreprocessKtpImage(
  imageSource: string | File
): Promise<PreprocessedKtpImages> {
  const img = await loadImageElement(imageSource);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const wasAutoRotated = srcH > srcW * 1.08;

  const targetW = KTP_SCANNER_CONFIG.TARGET_WIDTH;
  const targetH = KTP_SCANNER_CONFIG.TARGET_HEIGHT;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = targetW;
  colorCanvas.height = targetH;
  const colorCtx = colorCanvas.getContext('2d')!;

  if (wasAutoRotated) {
    colorCtx.save();
    colorCtx.translate(targetW / 2, targetH / 2);
    colorCtx.rotate(-Math.PI / 2);
    colorCtx.drawImage(img, -targetH / 2, -targetW / 2, targetH, targetW);
    colorCtx.restore();
  } else {
    colorCtx.drawImage(img, 0, 0, targetW, targetH);
  }

  const standardizedKtpDataUrl = colorCanvas.toDataURL('image/jpeg', 0.88);

  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = KTP_SCANNER_CONFIG.FACE_CROP_WIDTH;
  faceCanvas.height = KTP_SCANNER_CONFIG.FACE_CROP_HEIGHT;
  const faceCtx = faceCanvas.getContext('2d')!;
  faceCtx.drawImage(
    colorCanvas,
    Math.round(targetW * KTP_SCANNER_CONFIG.FACE_ROI.xRatio),
    Math.round(targetH * KTP_SCANNER_CONFIG.FACE_ROI.yRatio),
    Math.round(targetW * KTP_SCANNER_CONFIG.FACE_ROI.widthRatio),
    Math.round(targetH * KTP_SCANNER_CONFIG.FACE_ROI.heightRatio),
    0,
    0,
    KTP_SCANNER_CONFIG.FACE_CROP_WIDTH,
    KTP_SCANNER_CONFIG.FACE_CROP_HEIGHT
  );
  const croppedFaceDataUrl = faceCanvas.toDataURL('image/jpeg', 0.86);

  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = targetW;
  ocrCanvas.height = targetH;
  const ocrCtx = ocrCanvas.getContext('2d')!;
  ocrCtx.drawImage(colorCanvas, 0, 0);

  const imgData = ocrCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  const { enhancedGray, avgLum, glareRatio, sharpnessVal } = buildAdaptiveOcrGrayscale(
    data,
    targetW,
    targetH
  );

  const maskStartX = Math.floor(targetW * 0.715);
  const maskStartY = Math.floor(targetH * 0.19);

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const p = y * targetW + x;
      const i = p * 4;
      const isRightPhotoOrSignZone = x >= maskStartX && y >= maskStartY;
      const val = isRightPhotoOrSignZone ? 255 : enhancedGray[p];
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  }
  ocrCtx.putImageData(imgData, 0, 0);
  const ocrEnhancedDataUrl = ocrCanvas.toDataURL('image/png');

  const nikSrcX = Math.round(targetW * 0.03);
  const nikSrcY = Math.round(targetH * 0.12);
  const nikSrcW = Math.round(targetW * 0.71);
  const nikSrcH = Math.round(targetH * 0.175);

  const nikCanvas = document.createElement('canvas');
  nikCanvas.width = Math.round(nikSrcW * 1.35) + 40;
  nikCanvas.height = Math.round(nikSrcH * 1.35) + 40;
  const nikCtx = nikCanvas.getContext('2d')!;
  nikCtx.fillStyle = '#ffffff';
  nikCtx.fillRect(0, 0, nikCanvas.width, nikCanvas.height);
  nikCtx.drawImage(
    ocrCanvas,
    nikSrcX,
    nikSrcY,
    nikSrcW,
    nikSrcH,
    20,
    20,
    nikCanvas.width - 40,
    nikCanvas.height - 40
  );
  const nikZoneDataUrl = nikCanvas.toDataURL('image/png');

  const bioSrcX = Math.round(targetW * 0.02);
  const bioSrcY = Math.round(targetH * 0.13);
  const bioSrcW = Math.round(targetW * 0.705);
  const bioSrcH = Math.round(targetH * 0.83);

  const bioCanvas = document.createElement('canvas');
  bioCanvas.width = bioSrcW + 32;
  bioCanvas.height = bioSrcH + 32;
  const bioCtx = bioCanvas.getContext('2d')!;
  bioCtx.fillStyle = '#ffffff';
  bioCtx.fillRect(0, 0, bioCanvas.width, bioCanvas.height);
  bioCtx.drawImage(ocrCanvas, bioSrcX, bioSrcY, bioSrcW, bioSrcH, 16, 16, bioSrcW, bioSrcH);
  const biodataZoneDataUrl = bioCanvas.toDataURL('image/png');

  const warnings: string[] = [];
  const tips: string[] = [];
  const q = KTP_SCANNER_CONFIG.QUALITY_THRESHOLDS;

  const brightnessStatus: 'TOO_DARK' | 'TOO_BRIGHT' | 'GOOD' =
    avgLum < q.minBrightness
      ? 'TOO_DARK'
      : avgLum > q.maxBrightness || glareRatio > q.maxGlareRatio
      ? 'TOO_BRIGHT'
      : 'GOOD';
  const sharpnessStatus: 'BLURRY' | 'GOOD' = sharpnessVal < q.minSharpness ? 'BLURRY' : 'GOOD';
  const resolutionStatus: 'LOW' | 'GOOD' =
    Math.max(srcW, srcH) < q.minResolutionPx ? 'LOW' : 'GOOD';

  if (brightnessStatus === 'TOO_DARK') {
    warnings.push('Pencahayaan KTP tampak agak gelap.');
    tips.push('Nyalakan tombol Flash / Senter di kamera atau pindahkan ke tempat terang.');
  } else if (brightnessStatus === 'TOO_BRIGHT') {
    warnings.push('Terdeteksi pantulan cahaya berlebih pada permukaan KTP.');
    tips.push('Miringkan sedikit posisi kartu KTP agar pantulan lampu tidak menutupi tulisan NIK.');
  }

  if (sharpnessStatus === 'BLURRY') {
    warnings.push('Fokus gambar terdeteksi agak buram (blur).');
    tips.push('Tahan kamera dengan stabil hingga fokus mengunci sebelum memotret.');
  }

  if (resolutionStatus === 'LOW') {
    warnings.push('Resolusi gambar KTP cukup rendah.');
    tips.push('Dekatkan kamera agar kartu KTP memenuhi bingkai panduan.');
  }

  if (wasAutoRotated) {
    tips.push('Foto vertikal otomatis diputar ke posisi mendatar (landscape) standar e-KTP.');
  }

  let score = 100;
  if (brightnessStatus !== 'GOOD') score -= 20;
  if (sharpnessStatus === 'BLURRY') score -= 25;
  if (resolutionStatus === 'LOW') score -= 20;

  return {
    standardizedKtpDataUrl,
    ocrEnhancedDataUrl,
    nikZoneDataUrl,
    biodataZoneDataUrl,
    croppedFaceDataUrl,
    quality: {
      isValid: score >= q.minValidScore,
      score: Math.max(0, score),
      isLandscape: true,
      wasAutoRotated,
      brightnessStatus,
      sharpnessStatus,
      resolutionStatus,
      warnings,
      tips,
    },
  };
}

