import { useMutation, useQuery } from '@tanstack/react-query';
import { DragEvent, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { userProfileMutations } from '../query-options/mutations/user-profile.mutations';
import { userProfileQueries } from '../query-options/queries/user-profile.queries';
import { TFile } from '../types';

function useUploadProfieImage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { handleSubmit, setValue } = useForm<TFile>();
  const uploadMutation = useMutation(userProfileMutations.uploadFoto());

  const { data, isPending } = useQuery(userProfileQueries.ProfileFoto());

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
    data,
    isPending,
  };
}

export default useUploadProfieImage;
