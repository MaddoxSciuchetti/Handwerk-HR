import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ContractBodyEditor } from './ContractBodyEditor';
import { DOCUMENT_MASTER_KIND_LABELS } from './documentMaster.types';
import type { DocumentSegment } from './documentSegments';
import { ContractPreview } from './ContractPreview';
import { InsertContractInput } from './InsertContractInput';
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
  const [segments, setSegments] = useState<DocumentSegment[]>([]);
  const [editing, setEditing] = useState(false);
  const editStartedAt = useRef(0);
  const isContract = data?.kind === 'employment_contract';

  useEffect(() => {
    if (!data || editing) return;
    setName(data.name);
    setText(data.text);
    setSegments(data.segments ?? []);
  }, [data, editing]);

  const save = () => {
    if (!data || performance.now() - editStartedAt.current < 400) return;
    saveMaster.mutate(
      isContract
        ? { name: name.trim(), segments }
        : { name: name.trim(), text },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Dokument gespeichert');
        },
        onError: () => toast.error('Dokument konnte nicht gespeichert werden'),
      }
    );
  };

  const startEditing = () => {
    editStartedAt.current = performance.now();
    setEditing(true);
  };

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
        action={
          <Link to="/settings/documents" className="text-sm underline">
            Zurück
          </Link>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {editing ? (
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
        ) : (
          <h2 className="text-lg font-semibold">{name}</h2>
        )}
        {editing && isContract ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <InsertContractInput />
            <ContractBodyEditor segments={segments} onChange={setSegments} />
          </div>
        ) : null}
        {editing && !isContract ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Label htmlFor="master-text">Text</Label>
            <Textarea
              id="master-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-80 flex-1"
            />
          </div>
        ) : null}
        {!editing && isContract ? (
          <ContractPreview segments={segments} />
        ) : null}
        {!editing && !isContract ? (
          <p className="min-h-80 flex-1 overflow-auto text-sm whitespace-pre-wrap">
            {text}
          </p>
        ) : null}
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                disabled={saveMaster.isPending}
                onClick={save}
              >
                {saveMaster.isPending ? 'Speichert…' : 'Speichern'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName(data.name);
                  setText(data.text);
                  setSegments(data.segments ?? []);
                  setEditing(false);
                }}
              >
                Abbrechen
              </Button>
            </>
          ) : (
            <Button type="button" onClick={startEditing}>
              Bearbeiten
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
