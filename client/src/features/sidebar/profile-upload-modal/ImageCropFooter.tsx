import { Button } from '@/components/ui/button';

type ImageCropFooterProps = {
  handleSave: () => void;
};

const ImageCropFooter = ({ handleSave }: ImageCropFooterProps) => {
  return (
    <>
      <Button
        size="sm"
        className="mt-1 w-full cursor-pointer"
        onClick={handleSave}
      >
        Speichern
      </Button>
    </>
  );
};

export default ImageCropFooter;
