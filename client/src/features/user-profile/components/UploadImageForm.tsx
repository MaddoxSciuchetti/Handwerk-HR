import { DragEvent, RefObject } from 'react';
import { uuid } from 'zod';

type UploadImageFormProps = {
  handleBoxClick: () => void;
  handleDragOver: (e: DragEvent<Element>) => void;
  handleDrop: (e: DragEvent<Element>) => void;
  isPending: boolean;
  data: string | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (files: FileList | null) => void;
};

const UploadImageForm = ({
  handleBoxClick,
  handleDragOver,
  handleDrop,
  isPending,
  data,
  fileInputRef,
  handleFileSelect,
}: UploadImageFormProps) => {
  return (
    <>
      <form>
        <div
          className="cursor-pointer w-20 h-20 rounded-full  overflow-hidden"
          onClick={handleBoxClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isPending ? (
            'not there'
          ) : (
            <img
              key={`${data}+${uuid()}`}
              src={data}
              className="w-full h-full"
              alt="image"
            />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            handleFileSelect(e.target.files);
          }}
        />
      </form>
    </>
  );
};

export default UploadImageForm;
