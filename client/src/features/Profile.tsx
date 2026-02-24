import useAuth, { AUTH } from '@/hooks/use-Auth';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { getProfileFoto, uploadProfileFoto } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uuid } from 'zod';

export type TFile = {
  file: File[];
};

const Profile = () => {
  const { user, isLoading, isError } = useAuth();
  console.log('this should be the email', user?.email);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );

  const [imgVersion, setImgVersion] = useState(0);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TFile>();

  const uploadMutation = useMutation({
    mutationFn: uploadProfileFoto,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profilepic'] });
      console.log('invalidated and refetched');
    },
  });

  const onSubmit: SubmitHandler<TFile> = (data) => {
    uploadMutation.mutate(data);
  };

  const { data, isPending } = useQuery<string>({
    queryKey: ['profilepic'],
    queryFn: getProfileFoto,
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setValue('file', newFiles); // sneaked up error here review later

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
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

  if (isLoading) {
    return <Spinner className="size-8" />;
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">Error loading user</h1>
        <p className="text-red-500">Please try again later</p>
      </div>
    );
  }

  const { email, verified, createdAt } = user;

  return (
    <div className="flex flex-col items-center mt-16 space-y-4 ">
      <h1 className="text-3xl font-bold mb-4">Mein Konto</h1>
      {!verified && (
        <Alert
          variant="default"
          className="w-fit rounded-xl mb-3 border-yellow-200 bg-yellow-50"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Verifiziere deine email
          </AlertDescription>
        </Alert>
      )}
      <p className="text-black mb-2">
        Email: <span className="text-black">{email}</span>
      </p>

      <p>Klicke auf das foto um ein neues hochzuladen</p>
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
            handleSubmit(onSubmit)();
          }}
        />
      </form>
      <p className="text-black">
        Erstellt am{' '}
        <span className="text-black">
          {new Date(createdAt).toLocaleDateString('en-US')}
        </span>
      </p>
    </div>
  );
};

export default Profile;
