import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useNavigate } from '@tanstack/react-router';
import { FormEvent, useState } from 'react';
import {
  DOCUMENT_MASTER_KIND_LABELS,
  DOCUMENT_MASTER_KINDS,
  type DocumentMasterKind,
} from './documentMaster.types';
import { useCreateDocumentMaster } from './useCreateDocumentMaster';

type AddDocumentMasterDialogProps = {
  onClose: () => void;
};

function messageFrom(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Das Dokument konnte nicht angelegt werden.';
}

function nameFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, '').trim();
}

export function AddDocumentMasterDialog({
  onClose,
}: AddDocumentMasterDialogProps) {
  const navigate = useNavigate();
  const createMaster = useCreateDocumentMaster();
  const [kind, setKind] = useState<DocumentMasterKind>('employment_contract');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!file || name.trim().length === 0) return;

    createMaster.mutate(
      { kind, name: name.trim(), file },
      {
        onSuccess: (created) => {
          onClose();
          navigate({
            to: '/settings/documents/$id',
            params: { id: created.id },
          });
        },
      }
    );
  };

  return (
    <ModalOverlay handleToggle={onClose} size="max-w-lg">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full flex-col gap-4 rounded-xl border border-border bg-(--modal-surface) p-6 pt-10 text-foreground shadow-lg"
      >
        <div>
          <h2 className="typo-h4 font-bold">Dokument hinzufügen</h2>
          <p className="typo-body-sm text-muted-foreground">
            Die Datei wird gelesen und als bearbeitbarer Text angelegt.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Art</legend>
          <div className="flex gap-2">
            {DOCUMENT_MASTER_KINDS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={kind === option ? 'default' : 'outline'}
                onClick={() => setKind(option)}
              >
                {DOCUMENT_MASTER_KIND_LABELS[option]}
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="document-file">Datei</Label>
          <Input
            id="document-file"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain"
            required
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              if (next && name.trim().length === 0) {
                setName(nameFromFile(next));
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="document-name">Name</Label>
          <Input
            id="document-name"
            value={name}
            required
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {createMaster.isError ? (
          <p className="text-sm text-destructive">
            {messageFrom(createMaster.error)}
          </p>
        ) : null}

        <Button type="submit" disabled={createMaster.isPending || !file}>
          {createMaster.isPending ? 'Wird gelesen…' : 'Anlegen'}
        </Button>
      </form>
    </ModalOverlay>
  );
}
