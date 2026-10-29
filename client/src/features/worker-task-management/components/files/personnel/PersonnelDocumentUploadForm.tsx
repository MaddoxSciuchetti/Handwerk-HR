import { createWorkerFile } from '@/apis/index.apis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { HISTORYDATA } from '../../../consts/query-key.consts';
import { PersonnelFileDropzone } from './PersonnelFileDropzone';

type PersonnelDocumentUploadFormProps = {
  workerId: string;
  setModal: (open: boolean) => void;
};

export function PersonnelDocumentUploadForm({
  workerId,
  setModal,
}: PersonnelDocumentUploadFormProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const upload = useMutation({
    mutationFn: (document: File) => createWorkerFile([document], workerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HISTORYDATA, workerId] });
      setModal(false);
    },
    onError: () => toast.error('Dokument konnte nicht hochgeladen werden.'),
  });

  const submit = () => {
    const title = name.trim();
    if (!title || !file || upload.isPending) return;
    // Keep the file extension when the user supplies only a document title.
    const extension = file.name.match(/\.[^.]+$/)?.[0] ?? '';
    const filename =
      extension && !title.toLowerCase().endsWith(extension.toLowerCase())
        ? `${title}${extension}`
        : title;
    upload.mutate(
      new File([file], filename, {
        type: file.type,
        lastModified: file.lastModified,
      })
    );
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="personnel-document-name">Dokumentname</Label>
        <Input
          id="personnel-document-name"
          placeholder="Dokumentname eingeben"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={240}
          disabled={upload.isPending}
        />
      </div>
      <PersonnelFileDropzone file={file} onFile={setFile} />
      <Button
        type="button"
        className="bg-black text-white hover:bg-black/90"
        disabled={!name.trim() || !file || upload.isPending}
        onClick={submit}
      >
        {upload.isPending ? 'Hochladen...' : 'Hochladen'}
      </Button>
    </div>
  );
}
