import { Input } from '@/components/ui/input';
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
  console.log(data, 'data object');
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
              src={
                data === undefined
                  ? 'https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg'
                  : data
              }
              className="w-full h-full"
              alt="Upload your Profile"
            />
          )}
        </div>
        <Input
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
