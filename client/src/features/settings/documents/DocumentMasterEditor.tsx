import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DOCUMENT_MASTER_KIND_LABELS } from './documentMaster.types';
import { useDocumentMaster } from './useDocumentMaster';
import { useSaveDocumentMaster } from './useSaveDocumentMaster';

type DocumentMasterEditorProps = {
  id: string;
};

export function DocumentMasterEditor({ id }: DocumentMasterEditorProps) {
  const { data, isLoading, isError } = useDocumentMaster(id);
  const saveMaster = useSaveDocumentMaster(id);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setText(data.text);
  }, [data]);

  if (isLoading) {
    return <LoadingAlert />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <p className="text-sm text-destructive">
          Dokument konnte nicht geladen werden.
        </p>
        <Link to="/settings/documents" className="text-sm underline">
          Zurück zur Liste
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
      <SettingsPageHeader
        title={DOCUMENT_MASTER_KIND_LABELS[data.kind]}
        description="Text des Masters bearbeiten"
        action={
          <Link to="/settings/documents" className="text-sm underline">
            Zurück
          </Link>
        }
      />
      <form
        className="flex min-h-0 flex-1 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          saveMaster.mutate(
            { name: name.trim(), text },
            {
              onSuccess: () => toast.success('Dokument gespeichert'),
              onError: () => toast.error('Dokument konnte nicht gespeichert werden'),
            }
          );
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="master-name">Name</Label>
          <Input
            id="master-name"
            value={name}
            required
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <Label htmlFor="master-text">Text</Label>
          <Textarea
            id="master-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-80 flex-1"
          />
        </div>
        <Button type="submit" disabled={saveMaster.isPending} className="self-start">
          {saveMaster.isPending ? 'Speichert…' : 'Speichern'}
        </Button>
      </form>
    </div>
  );
}
