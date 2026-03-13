import { useMutation, useQuery } from '@tanstack/react-query';
import { DragEvent, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { userProfileMutations } from '../query-options/mutations/user-profile.mutations';
import { userProfileQueries } from '../query-options/queries/user-profile.queries';
import { TFile } from '../types';

function useUploadProfieImage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { handleSubmit, setValue } = useForm<TFile>();
  const uploadMutation = useMutation(userProfileMutations.uploadFoto());

  const { data, isPending } = useQuery(userProfileQueries.ProfileFoto());

  const onSubmit: SubmitHandler<TFile> = (data) => {
    uploadMutation.mutate(data);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFile(files[0]);
  };

  const handleCropSave = (croppedFile: File) => {
    setPendingFile(null);
    setUploadedFiles([croppedFile]);
    setValue('file', [croppedFile]);
    handleSubmit(onSubmit)();
  };

  const handleCropCancel = () => setPendingFile(null);

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
    handleCropSave,
    handleCropCancel,
    pendingFile,
    fileInputRef,
    uploadedFiles,
    data,
    isPending,
  };
}

export default useUploadProfieImage;
