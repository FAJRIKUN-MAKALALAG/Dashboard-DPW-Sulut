/**
 * Konfigurasi Terpusat Sistem Pemindaian e-KTP (KTP Scanner).
 * Seluruh parameter resolusi, aspek rasio kartu ID-1, ambang kualitas, dan endpoint OCR berada di sini.
 */
export const KTP_SCANNER_CONFIG = {
  /** Endpoint Backend Deep Learning OCR (RapidOCR PP-OCRv4 ONNX) */
  BACKEND_SCAN_ENDPOINT: '/ktp-scanner/scan',

  /** Rasio standar ISO/IEC 7810 ID-1 e-KTP Indonesia (85.60mm x 53.98mm = 1.585) */
  ID1_ASPECT_RATIO: 1.585,

  /** Resolusi kanvas standar kartu e-KTP (Landscape) */
  TARGET_WIDTH: 1400,
  TARGET_HEIGHT: 884,

  /** Resolusi potongan pasfoto wajah kader dari sisi kanan KTP */
  FACE_CROP_WIDTH: 300,
  FACE_CROP_HEIGHT: 380,

  /** Koordinat relatif area pasfoto pada kartu e-KTP */
  FACE_ROI: {
    xRatio: 0.715,
    yRatio: 0.21,
    widthRatio: 0.245,
    heightRatio: 0.56,
  },

  /** Ambang batas evaluasi kualitas gambar KTP */
  QUALITY_THRESHOLDS: {
    minValidScore: 55,
    minBrightness: 58,
    maxBrightness: 228,
    maxGlareRatio: 0.3,
    minSharpness: 7.5,
    minResolutionPx: 500,
  },
} as const;

