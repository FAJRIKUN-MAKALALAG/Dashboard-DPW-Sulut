import React from 'react';
import {
  ImageCropperModal,
  ImageCropperModalProps,
  ImageCropResult,
} from '../../components/ui/ImageCropperModal';

export type KtpCropResult = ImageCropResult;
export type KtpImageCropperModalProps = ImageCropperModalProps;

/**
 * Wrapper khusus pemotongan (crop) e-KTP menggunakan komponen terpusat `ImageCropperModal`.
 */
export const KtpImageCropperModal: React.FC<KtpImageCropperModalProps> = (props) => (
  <ImageCropperModal mode="ktp" {...props} />
);
