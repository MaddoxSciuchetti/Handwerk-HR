import { useAvatarBackgroundLayer } from '@/components/layout/sidebar/hooks/useAvatarBackgroundLayer';
import { useAvatarCropSave } from '@/components/layout/sidebar/hooks/useAvatarCropSave';
import { getModalStyle } from '@/components/layout/sidebar/styles/avatarCrop.styles';
import {
  moveDrag,
  onImgLoad,
  startDrag,
} from '@/components/layout/sidebar/utils/avatarCrop.utils';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ImageCrop from './crop-functionality/ImageCrop';
import ImageCropHeader from './ImageCropHeader';

const PREVIEW_SIZE = 220;
const CROP_SIZE = 160;
const OUTPUT_SIZE = 256;

type Props = {
  file: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
  anchorRect?: DOMRect;
};

export const AvatarCropModal = ({
  file,
  onSave,
  onCancel,
  anchorRect,
}: Props) => {
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file]);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });

  const cropLeft = (PREVIEW_SIZE - CROP_SIZE) / 2;
  const cropTop = (PREVIEW_SIZE - CROP_SIZE) / 2;

  useEffect(() => {
    return () => URL.revokeObjectURL(imgSrc);
  }, [imgSrc]);

  const { backgroundScale, backgroundPos } = useAvatarBackgroundLayer(
    PREVIEW_SIZE,
    naturalSize
  );

  const handleSave = useAvatarCropSave({
    naturalSize,
    imagePos,
    imageScale,
    cropLeft,
    cropTop,
    cropSize: CROP_SIZE,
    outputSize: OUTPUT_SIZE,
    imgSrc,
    onSave,
  });

  return createPortal(
    <div
      style={getModalStyle(anchorRect)}
      className="w-fit rounded-2xl border border-border bg-(--background) p-3 shadow-xl"
    >
      <ImageCropHeader onCancel={onCancel} />

      <ImageCrop
        imagePos={imagePos}
        naturalSize={naturalSize}
        imageScale={imageScale}
        cropLeft={cropLeft}
        cropTop={cropTop}
        CROP_SIZE={CROP_SIZE}
        imgSrc={imgSrc}
        backgroundPos={backgroundPos}
        backgroundScale={backgroundScale}
        onImgLoad={onImgLoad}
        startDrag={startDrag}
        moveDrag={moveDrag}
        setImagePos={setImagePos}
        PREVIEW_SIZE={PREVIEW_SIZE}
        setNaturalSize={setNaturalSize}
        setImageScale={setImageScale}
      />

      <Button
        size="sm"
        className="mt-1 w-full cursor-pointer"
        onClick={handleSave}
      >
        Speichern
      </Button>
    </div>,
    document.body
  );
};
