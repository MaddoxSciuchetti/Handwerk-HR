import { createWorkerFile } from '@/apis/index.apis';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { HistoryData } from '../consts/query-key.consts';

function useFileUpload(id: number, setModal: (val: boolean) => void) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );
  const queryClient = useQueryClient();
  const {
    mutate: uploadfiles,
    data: FileResponse,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (files: File[]) => createWorkerFile(files, id),
    onSuccess: () => {
      console.log('Upload successful, invalidting');
      queryClient.invalidateQueries({
        queryKey: [HistoryData, id],
      });

      setModal(false);
      setUploadedFiles([]);
      setFileProgresses({});
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleFileSubmit = async () => {
    if (uploadedFiles.length > 0) {
      uploadfiles(uploadedFiles);
    }
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    fileProgresses,
    setFileProgresses,
    error,
    isLoading,
    handleFileSubmit,
  };
}

export default useFileUpload;
