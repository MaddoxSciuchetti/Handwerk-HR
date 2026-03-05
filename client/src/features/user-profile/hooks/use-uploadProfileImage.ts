import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DragEvent, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { getProfilePhoto, uploadProfileFoto } from '../api/index.api';
import { TFile } from '../types';

function useUploadProfieImage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TFile>();
  const uploadMutation = useMutation({
    mutationFn: uploadProfileFoto,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [PROFILEPICTURE] });
    },
  });

  const { data, isPending } = useQuery<string>({
    queryKey: [PROFILEPICTURE],
    queryFn: getProfilePhoto,
  });

  const onSubmit: SubmitHandler<TFile> = (data) => {
    uploadMutation.mutate(data);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    console.log(files);
    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setValue('file', newFiles);
    handleSubmit(onSubmit)();
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

  return {
    handleBoxClick,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    fileInputRef,
    uploadedFiles,
    fileProgresses,
    data,
    isPending,
  };
}

export default useUploadProfieImage;
