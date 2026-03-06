import { sendFeatureRequest } from '@/apis/index.apis';
import { DragEvent, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FileDropzone } from '../../../features/task-management/components/modal/files/file_upload/dropzone';
import { FileList } from '../../../features/task-management/components/modal/files/file_upload/file-list';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

export type TFeatureForm = {
  importance: string;
  textarea: string;
  file?: File[];
};

function FeatureModal({ handleToggle }: { handleToggle: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TFeatureForm>();
  const onSubmit: SubmitHandler<TFeatureForm> = (data) => {
    sendFeatureRequest(data);
    toast.success('Erfolgreich abgeschickt');
    setTimeout(() => {
      handleToggle();
    }, 1000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setValue('file', [...uploadedFiles, ...newFiles]);

    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setFileProgresses((prev) => ({
          ...prev,
          [file.name]: Math.min(progress, 100),
        }));
      }, 300);
    });
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (filename: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== filename));
    setFileProgresses((prev) => {
      const newProgresses = { ...prev };
      delete newProgresses[filename];
      return newProgresses;
    });
  };

  return (
    <div className="fixed inset-0 flex max-h-100 min-h-180 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
      <div className="h-full w-full my-10 p-10">
        <h1 className=" text-lg mb-5">Feature request</h1>
        <div className="flex flex-col w-full ">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <Label className=" text-md">Wie wichtig ist es?</Label>
            <select
              className=" w-full"
              {...register('importance', { required: true })}
            >
              <option>Nice to have</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Kritisch</option>
            </select>

            <Textarea
              className=""
              {...register('textarea')}
              placeholder="Beschreibe das Problem oder das gewünschte Feature"
            ></Textarea>
            {errors.importance && <span>This field is required</span>}

            <p className="text-left">Optional</p>
            <CardContent className="w-full rounded-2xl">
              {/* <Form /> */}
              <div className="w-full mx-auto ">
                <FileDropzone
                  {...register('file')}
                  fileInputRef={fileInputRef}
                  handleBoxClick={handleBoxClick}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleFileSelect={handleFileSelect}
                />
                <FileList
                  uploadedFiles={uploadedFiles}
                  fileProgresses={fileProgresses}
                  removeFile={removeFile}
                />
              </div>
            </CardContent>

            <Button className="hover:text-black cursor-pointer" type="submit">
              Senden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FeatureModal;
