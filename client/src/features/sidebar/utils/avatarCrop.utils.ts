import type { MutableRefObject, RefObject } from 'react';

type Position = {
  x: number;
  y: number;
};

type NaturalSize = {
  w: number;
  h: number;
};

type DragStart = {
  mouseX: number;
  mouseY: number;
  posX: number;
  posY: number;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getCoverScale = (previewSize: number, width: number, height: number) =>
  Math.max(previewSize / width, previewSize / height);

export const getCenteredPosition = (
  previewSize: number,
  width: number,
  height: number,
  scale: number,
): Position => ({
  x: (previewSize - width * scale) / 2,
  y: (previewSize - height * scale) / 2,
});

export const onImgLoad = ({
  imgRef,
  previewSize,
  setNaturalSize,
  setImageScale,
  setImagePos,
}: {
  imgRef: RefObject<HTMLImageElement | null>;
  previewSize: number;
  setNaturalSize: (size: NaturalSize) => void;
  setImageScale: (scale: number) => void;
  setImagePos: (pos: Position) => void;
}) => {
  const img = imgRef.current;
  if (!img) return;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  setNaturalSize({ w: nw, h: nh });

  const scaleForCover = getCoverScale(previewSize, nw, nh);
  setImageScale(scaleForCover);
  setImagePos(getCenteredPosition(previewSize, nw, nh, scaleForCover));
};

export const startDrag = ({
  clientX,
  clientY,
  imagePos,
  setDragging,
  dragStart,
}: {
  clientX: number;
  clientY: number;
  imagePos: Position;
  setDragging: (value: boolean) => void;
  dragStart: MutableRefObject<DragStart>;
}) => {
  setDragging(true);
  dragStart.current = {
    mouseX: clientX,
    mouseY: clientY,
    posX: imagePos.x,
    posY: imagePos.y,
  };
};

export const moveDrag = ({
  clientX,
  clientY,
  dragging,
  naturalSize,
  imageScale,
  dragStart,
  cropLeft,
  cropTop,
  cropSize,
  setImagePos,
}: {
  clientX: number;
  clientY: number;
  dragging: boolean;
  naturalSize: NaturalSize;
  imageScale: number;
  dragStart: MutableRefObject<DragStart>;
  cropLeft: number;
  cropTop: number;
  cropSize: number;
  setImagePos: (pos: Position) => void;
}) => {
  if (!dragging) return;

  const displayW = naturalSize.w * imageScale;
  const displayH = naturalSize.h * imageScale;

  setImagePos({
    x: clamp(
      dragStart.current.posX + clientX - dragStart.current.mouseX,
      cropLeft + cropSize - displayW,
      cropLeft,
    ),
    y: clamp(
      dragStart.current.posY + clientY - dragStart.current.mouseY,
      cropTop + cropSize - displayH,
      cropTop,
    ),
  });
};
