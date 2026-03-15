import type { CSSProperties } from 'react';

type Size = {
  w: number;
  h: number;
};

type Position = {
  x: number;
  y: number;
};

export const getModalStyle = (anchorRect?: DOMRect): CSSProperties =>
  anchorRect
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: anchorRect.left,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      };

export const getBackgroundImageStyle = ({
  pos,
  naturalSize,
  scale,
}: {
  pos: Position;
  naturalSize: Size;
  scale: number;
}): CSSProperties => ({
  left: pos.x,
  top: pos.y,
  width: naturalSize.w * scale,
  height: naturalSize.h * scale,
  filter: 'blur(8px) brightness(0.65)',
  transform: 'scale(1.03)',
});

export const getForegroundImageStyle = ({
  pos,
  naturalSize,
  scale,
}: {
  pos: Position;
  naturalSize: Size;
  scale: number;
}): CSSProperties => ({
  left: pos.x,
  top: pos.y,
  width: naturalSize.w * scale,
  height: naturalSize.h * scale,
});

export const cropMaskStyle: CSSProperties = {
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
};
