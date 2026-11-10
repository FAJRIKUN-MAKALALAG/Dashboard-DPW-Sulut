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

/**
 * Standarisasi & Pra-Pemrosesan Citra e-KTP:
 * 1. Memutar otomatis jika foto diambil vertikal (portrait) menjadi horizontal (landscape).
 * 2. Mengecek kualitas pencahayaan (gelap / silau flash) dan ketajaman (blur).
 * 3. Menghasilkan:
 *    - `standardizedKtpDataUrl`: Gambar KTP warna berkualitas rapi (rasio e-KTP) untuk arsip database.
 *    - `ocrEnhancedDataUrl`: Gambar KTP kontras tinggi untuk dibaca mesin OCR.
 *    - `croppedFaceDataUrl`: Potongan pasfoto wajah dari sisi kanan KTP untuk opsi foto profil kader.
 */
export async function standardizeAndPreprocessKtpImage(
  imageSource: string | File
): Promise<{
  standardizedKtpDataUrl: string;
  ocrEnhancedDataUrl: string;
  croppedFaceDataUrl: string;
  quality: KtpImageQualityReport;
}> {
  const img = await loadImageElement(imageSource);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const wasAutoRotated = srcH > srcW * 1.08;

  const targetW = 1000;
  const targetH = 630; // Rasio standar kartu ID-1 e-KTP (85.6mm x 53.98mm ~ 1.585)

  // 1. Canvas Standar Warna (untuk disimpan sebagai fotoKtpUrl)
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

  const standardizedKtpDataUrl = colorCanvas.toDataURL('image/jpeg', 0.86);

  // 2. Potong Pasfoto Wajah dari Sisi Kanan KTP (Area standar pasfoto e-KTP Indonesia)
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 300;
  faceCanvas.height = 380;
  const faceCtx = faceCanvas.getContext('2d')!;
  faceCtx.drawImage(
    colorCanvas,
    Math.round(targetW * 0.715),
    Math.round(targetH * 0.21),
    Math.round(targetW * 0.245),
    Math.round(targetH * 0.56),
    0,
    0,
    300,
    380
  );
  const croppedFaceDataUrl = faceCanvas.toDataURL('image/jpeg', 0.85);

  // 3. Evaluasi Kualitas Gambar & Pra-pemrosesan Kontras Tinggi untuk OCR
  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = targetW;
  ocrCanvas.height = targetH;
  const ocrCtx = ocrCanvas.getContext('2d')!;
  ocrCtx.drawImage(colorCanvas, 0, 0);

  const imgData = ocrCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  let totalLum = 0;
  let brightPixels = 0;
  const gray = new Uint8Array(targetW * targetH);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = lum;
    totalLum += lum;
    if (lum > 245) brightPixels++;
  }

  const pixelCount = targetW * targetH;
  const avgLum = totalLum / pixelCount;
  const glareRatio = brightPixels / pixelCount;

  let edgeEnergy = 0;
  let edgeSamples = 0;
  const textAreaW = Math.floor(targetW * 0.72);
  for (let y = 40; y < targetH - 40; y += 2) {
    for (let x = 30; x < textAreaW; x += 2) {
      const idx = y * targetW + x;
      const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
      const gy = Math.abs(gray[idx + targetW] - gray[idx - targetW]);
      edgeEnergy += gx + gy;
      edgeSamples++;
    }
  }
  const sharpnessVal = edgeSamples > 0 ? edgeEnergy / edgeSamples : 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = gray[p];
    let enhanced = (lum - avgLum * 0.88) * 2.15 + 145;
    if (enhanced < 0) enhanced = 0;
    if (enhanced > 255) enhanced = 255;
    const finalVal = enhanced > 175 ? 255 : enhanced < 75 ? 0 : enhanced;
    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
  }
  ocrCtx.putImageData(imgData, 0, 0);
  const ocrEnhancedDataUrl = ocrCanvas.toDataURL('image/png');

  const warnings: string[] = [];
  const tips: string[] = [];

  const brightnessStatus: 'TOO_DARK' | 'TOO_BRIGHT' | 'GOOD' =
    avgLum < 60 ? 'TOO_DARK' : avgLum > 225 || glareRatio > 0.28 ? 'TOO_BRIGHT' : 'GOOD';
  const sharpnessStatus: 'BLURRY' | 'GOOD' = sharpnessVal < 8.5 ? 'BLURRY' : 'GOOD';
  const resolutionStatus: 'LOW' | 'GOOD' = Math.max(srcW, srcH) < 500 ? 'LOW' : 'GOOD';

  if (brightnessStatus === 'TOO_DARK') {
    warnings.push('Pencahayaan KTP tampak agak gelap.');
    tips.push('Pindahkan KTP ke tempat yang lebih terang agar angka NIK terbaca sempurna.');
  } else if (brightnessStatus === 'TOO_BRIGHT') {
    warnings.push('Terdeteksi pantulan cahaya / flash berlebih pada KTP.');
    tips.push('Hindari pantulan lampu tepat di atas tulisan NIK dan Nama.');
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
    croppedFaceDataUrl,
    quality: {
      isValid: score >= 55,
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

