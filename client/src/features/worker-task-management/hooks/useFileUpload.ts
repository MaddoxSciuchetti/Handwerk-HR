import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { workerMutations } from '../query-options/mutations/worker.mutations';

function useFileUpload(workerId: string, setModal: (val: boolean) => void) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );
  const {
    mutate: uploadfiles,
    isPending: isLoading,
    error,
  } = useMutation(workerMutations.createFile(workerId));

  const handleFileSubmit = async () => {
    if (uploadedFiles.length > 0) {
      uploadfiles(uploadedFiles, {
        onSuccess: () => {
          setModal(false);
          setUploadedFiles([]);
          setFileProgresses({});
        },
      });
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
