export { KTP_SCANNER_CONFIG } from './ktpScannerConfig';
export {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  SULUT_NIK_PREFIX_TO_DPD,
  stringSimilarity,
} from './nikDecoder';
export {
  standardizeAndPreprocessKtpImage,
} from './ktpImageProcessor';
export type { KtpImageQualityReport, PreprocessedKtpImages } from './ktpImageProcessor';
export {
  parseKtpOcrText,
  mergeExtractedKtpData,
  toCleanTitleCase,
} from './ktpTextParser';
export type { ExtractedKtpData } from './ktpTextParser';
export {
  scanAndExtractKtpOnDevice,
} from './ktpScannerService';
export type { KtpScanPipelineResult } from './ktpScannerService';
export { KtpCameraScannerBox } from './components/KtpCameraScannerBox';
export { KtpLiveCameraViewport } from './components/KtpLiveCameraViewport';
export {
  KtpStandardizationGuide,
  KtpScannedPreviewCard,
} from './components/KtpStandardizationGuide';

