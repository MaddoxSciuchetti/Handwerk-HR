import { sendFeatureRequest } from '@/apis/index.apis';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileDropzone } from '@/features/worker-task-management/components/files/file_upload/Dropzone';
import { FileList } from '@/features/worker-task-management/components/files/file_upload/FileList';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragEvent, useRef, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
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
    <Card className="max-h-[85vh] w-full max-w-md overflow-y-auto shadow-lg">
      <CardHeader>
        <h2 className="font-heading text-base leading-snug font-medium">
          Was würdest du ändern?
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="importance">Wichtigkeitsgrad</FieldLabel>
              <Controller
                name="importance"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="importance" className="w-full">
                      <SelectValue placeholder="Wichtigkeitsgrad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {importanceOptions.items.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.importance]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="textarea">Feedback</FieldLabel>
              <Textarea
                id="textarea"
                {...register('textarea')}
                placeholder="Erzähle uns von deinem Feedback oder deiner Idee"
                rows={4}
              />
              <FieldError errors={[errors.textarea]} />
            </Field>

            <Field>
              <FieldLabel className="text-muted-foreground">Optional</FieldLabel>
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
            </Field>

            <Button type="submit" className="w-full">
              Senden
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export default FeatureModal;
