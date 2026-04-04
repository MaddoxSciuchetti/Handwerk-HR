import { sendFeatureRequest } from '@/apis/index.apis';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileDropzone } from '@/features/task-management/components/files/file_upload/Dropzone';
import { FileList } from '@/features/task-management/components/files/file_upload/FileList';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragEvent, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { importanceOptions } from '../consts/sidebar.consts';
import { featureSchema, TFeatureForm } from '../schemas/sidebar.schemas';

function FeatureModal({ handleToggle }: { handleToggle: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TFeatureForm>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      importance: importanceOptions.items[0].value,
      textarea: '',
    },
  });
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
    setUploadedFiles((prev) => {
      const nextFiles = [...prev, ...newFiles];
      setValue('file', nextFiles);
      return nextFiles;
    });

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
    setUploadedFiles((prev) => {
      const nextFiles = prev.filter((file) => file.name !== filename);
      setValue('file', nextFiles);
      return nextFiles;
    });
    setFileProgresses((prev) => {
      const newProgresses = { ...prev };
      delete newProgresses[filename];
      return newProgresses;
    });
  };

  return (
    <SmallWrapper className="h-auto min-h-0 max-h-[85vh] overflow-y-auto">
      <div className="w-full">
        <h1 className=" text-lg mb-5"> Was würdest du ändern? </h1>
        <div className="flex flex-col w-full ">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <FormSelectOptions
              control={control}
              errors={errors}
              name="importance"
              label="Wichtigkeitsgrad"
              placeholder="Wichtigkeitsgrad"
              defaultValue={importanceOptions.items[0].value}
              data={importanceOptions.items.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />

            <Textarea
              className=""
              {...register('textarea')}
              placeholder="Erzähle uns von deinem Feedback oder deiner Idee"
            ></Textarea>
            {errors.textarea?.message && (
              <p className="text-left text-sm text-[var(--destructive)]">
                {errors.textarea.message}
              </p>
            )}

            <p className="text-left">Optional</p>
            <CardContent className="w-full rounded-2xl">
              {/* <Form /> */}
              <div className="w-full mx-auto">
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

            <Button className="cursor-pointer" type="submit">
              Senden
            </Button>
          </form>
        </div>
      </div>
    </SmallWrapper>
  );
}

export default FeatureModal;
