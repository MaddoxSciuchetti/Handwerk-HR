import { getCenteredPosition, getCoverScale } from '../utils/avatarCrop.utils';

type NaturalSize = {
  w: number;
  h: number;
};

export const useAvatarBackgroundLayer = (
  previewSize: number,
  naturalSize: NaturalSize
) => {
  const backgroundScale =
    naturalSize.w > 0
      ? getCoverScale(previewSize, naturalSize.w, naturalSize.h)
      : 1;

  const backgroundPos =
    naturalSize.w > 0
      ? getCenteredPosition(
          previewSize,
          naturalSize.w,
          naturalSize.h,
          backgroundScale
        )
      : { x: 0, y: 0 };

  return { backgroundScale, backgroundPos };
};
