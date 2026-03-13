import { useCallback } from 'react';

type NaturalSize = {
  w: number;
  h: number;
};

type Position = {
  x: number;
  y: number;
};

type Params = {
  naturalSize: NaturalSize;
  imagePos: Position;
  imageScale: number;
  cropLeft: number;
  cropTop: number;
  cropSize: number;
  outputSize: number;
  imgSrc: string;
  onSave: (croppedFile: File) => void;
};

export const useAvatarCropSave = ({
  naturalSize,
  imagePos,
  imageScale,
  cropLeft,
  cropTop,
  cropSize,
  outputSize,
  imgSrc,
  onSave,
}: Params) =>
  useCallback(() => {
    if (!naturalSize.w) return;

    const cropX = (cropLeft - imagePos.x) / imageScale;
    const cropY = (cropTop - imagePos.y) / imageScale;
    const normalizedCropSize = cropSize / imageScale;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        cropX,
        cropY,
        normalizedCropSize,
        normalizedCropSize,
        0,
        0,
        outputSize,
        outputSize,
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          onSave(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9,
      );
    };
    img.src = imgSrc;
  }, [
    naturalSize.w,
    imagePos.x,
    imagePos.y,
    imageScale,
    cropLeft,
    cropTop,
    cropSize,
    outputSize,
    imgSrc,
    onSave,
  ]);
