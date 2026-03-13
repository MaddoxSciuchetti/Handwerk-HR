import { GripHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  cropMaskStyle,
  getBackgroundImageStyle,
  getForegroundImageStyle,
} from '../../styles/avatarCrop.styles';
import {
  moveDrag as moveDragFn,
  onImgLoad as onImgLoadFn,
  startDrag as startDragFn,
} from '../../utils/avatarCrop.utils';

type ImageCropProps = {
  imagePos: { x: number; y: number };
  naturalSize: { w: number; h: number };
  imageScale: number;
  cropLeft: number;
  cropTop: number;
  CROP_SIZE: number;
  imgSrc: string;
  backgroundPos: { x: number; y: number };
  backgroundScale: number;
  onImgLoad: typeof onImgLoadFn;
  startDrag: typeof startDragFn;
  moveDrag: typeof moveDragFn;
  setImagePos: (pos: { x: number; y: number }) => void;
  PREVIEW_SIZE: number;
  setNaturalSize: (size: { w: number; h: number }) => void;
  setImageScale: (scale: number) => void;
};

const ImageCrop = ({
  imagePos,
  naturalSize,
  imageScale,
  cropLeft,
  cropTop,
  CROP_SIZE,
  imgSrc,
  backgroundPos,
  backgroundScale,
  onImgLoad,
  startDrag,
  moveDrag,
  setImagePos,
  PREVIEW_SIZE,
  setNaturalSize,
  setImageScale,
}: ImageCropProps) => {
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  return (
    <div
      className={`relative h-55 w-55 overflow-hidden rounded-xl border border-border bg-black ${
        dragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={(e) => {
        e.preventDefault();
        startDrag({
          clientX: e.clientX,
          clientY: e.clientY,
          imagePos,
          setDragging,
          dragStart,
        });
      }}
      onMouseMove={(e) =>
        moveDrag({
          clientX: e.clientX,
          clientY: e.clientY,
          dragging,
          naturalSize,
          imageScale,
          dragStart,
          cropLeft,
          cropTop,
          cropSize: CROP_SIZE,
          setImagePos,
        })
      }
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        startDrag({
          clientX: t.clientX,
          clientY: t.clientY,
          imagePos,
          setDragging,
          dragStart,
        });
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        moveDrag({
          clientX: t.clientX,
          clientY: t.clientY,
          dragging,
          naturalSize,
          imageScale,
          dragStart,
          cropLeft,
          cropTop,
          cropSize: CROP_SIZE,
          setImagePos,
        });
      }}
      onTouchEnd={() => setDragging(false)}
    >
      {naturalSize.w > 0 && (
        <img
          src={imgSrc}
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={getBackgroundImageStyle({
            pos: backgroundPos,
            naturalSize,
            scale: backgroundScale,
          })}
          alt=""
        />
      )}

      <img
        ref={imgRef}
        src={imgSrc}
        onLoad={() =>
          onImgLoad({
            imgRef,
            previewSize: PREVIEW_SIZE,
            setNaturalSize,
            setImageScale,
            setImagePos,
          })
        }
        draggable={false}
        className="pointer-events-none absolute z-10 select-none"
        style={getForegroundImageStyle({
          pos: imagePos,
          naturalSize,
          scale: imageScale,
        })}
        alt=""
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="absolute left-7.5 top-7.5 h-40 w-40 rounded-xl border-2 border-white/80"
          style={cropMaskStyle}
        />
        {!dragging && (
          <div className="absolute left-7.5 top-7.5 flex h-40 w-40 items-center justify-center text-white/70">
            <GripHorizontal className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCrop;
