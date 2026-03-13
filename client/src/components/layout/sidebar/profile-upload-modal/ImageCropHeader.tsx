import { X } from 'lucide-react';

type ImageCropHeaderProps = {
  onCancel: () => void;
};

const ImageCropHeader = ({ onCancel }: ImageCropHeaderProps) => {
  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Ausschnitt anpassen
        </span>
        <button
          onClick={onCancel}
          className="ml-4 cursor-pointer rounded-md p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="Abbrechen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
};

export default ImageCropHeader;
