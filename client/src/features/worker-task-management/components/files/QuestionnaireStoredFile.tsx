import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PERSONNEL_DOCUMENTS } from '@/features/worker-task-management/consts/query-key.consts';
import {
  fileQuestionnaireDocuments,
  renameQuestionnaireFile,
} from '@/features/worker-task-management/api/questionnaireFiles.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type QuestionnaireStoredFileProps = {
  workerId: string;
  engagementId: string;
  questionKey: string;
  file: { name: string; url: string; filed: boolean };
};

export function QuestionnaireStoredFile({
  workerId,
  engagementId,
  questionKey,
  file,
}: QuestionnaireStoredFileProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(file.name);
  useEffect(() => {
    setName(file.name);
  }, [file.name]);
  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['completed-questionnaire', workerId, engagementId],
    });
    await queryClient.invalidateQueries({
      queryKey: [PERSONNEL_DOCUMENTS, workerId],
    });
  };
  const rename = useMutation({
    mutationFn: (next: string) =>
      renameQuestionnaireFile(workerId, engagementId, questionKey, next),
    onSuccess: async (result) => {
      setName(result.data.name);
      await refresh();
    },
    onError: () => toast.error('Der Dateiname konnte nicht gespeichert werden.'),
  });
  const store = useMutation({
    mutationFn: () =>
      fileQuestionnaireDocuments(workerId, engagementId, questionKey),
    onSuccess: async () => {
      toast.success('Datei abgelegt');
      await refresh();
    },
    onError: () => toast.error('Die Datei konnte nicht abgelegt werden.'),
  });
  const save = () => {
    const next = name.trim();
    if (!next || next === file.name) {
      setName(file.name);
      return;
    }
    rename.mutate(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label="Dateiname"
        value={name}
        maxLength={180}
        className="h-8 min-w-40 flex-1"
        onChange={(event) => setName(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
      <a href={file.url} target="_blank" rel="noreferrer" className="text-sm underline">
        Öffnen
      </a>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={file.filed || store.isPending}
        onClick={() => store.mutate()}
      >
        {file.filed ? 'Abgelegt' : 'Ablegen'}
      </Button>
    </div>
  );
}
