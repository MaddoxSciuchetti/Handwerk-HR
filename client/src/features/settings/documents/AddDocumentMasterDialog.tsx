import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type UploadDraft = {
  key: string;
  file: File;
  name: string;
  kind: DocumentMasterKind;
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

function draftsFromFiles(files: FileList): UploadDraft[] {
  return [...files].map((file, index) => ({
    key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    name: '',
    kind: 'employment_contract',
  }));
}

function DocumentKindSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: DocumentMasterKind;
  onChange: (kind: DocumentMasterKind) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const selectedKind = DOCUMENT_MASTER_KINDS.find(
            (option) => option === next
          );
          if (selectedKind) onChange(selectedKind);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Dokumentart wählen" />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_MASTER_KINDS.map((option) => (
            <SelectItem key={option} value={option}>
              {DOCUMENT_MASTER_KIND_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AddDocumentMasterDialog({
  onClose,
}: AddDocumentMasterDialogProps) {
  const navigate = useNavigate();
  const createMaster = useCreateDocumentMaster();
  const [kind, setKind] = useState<DocumentMasterKind>('employment_contract');
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const multiple = drafts.length > 1;
  const ready = multiple
    ? drafts.every((draft) => draft.name.trim().length > 0)
    : drafts.length === 1 && name.trim().length > 0;

  const updateDraft = (key: string, patch: Partial<UploadDraft>) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...patch } : draft
      )
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || pending) return;

    const uploads = multiple
      ? drafts.map((draft) => ({
          kind: draft.kind,
          name: draft.name.trim(),
          file: draft.file,
        }))
      : [{ kind, name: name.trim(), file: drafts[0].file }];

    setPending(true);
    setError(null);
    const created = [];
    try {
      for (const upload of uploads) {
        created.push(await createMaster.mutateAsync(upload));
      }
      onClose();
      if (created.length === 1) {
        navigate({
          to: '/settings/documents/$id',
          params: { id: created[0].id },
        });
      }
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setPending(false);
    }
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
            Sie können mehrere Dateien auf einmal hochladen und jeder eine Art
            geben. Jede Datei wird als bearbeitbare Vorlage geöffnet. Dort
            können Sie variable Felder einfügen.
          </p>
        </div>

        {multiple ? null : (
          <DocumentKindSelect
            id="document-kind"
            label="Art"
            value={kind}
            onChange={setKind}
          />
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="document-file">Datei</Label>
          <Input
            id="document-file"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            required={drafts.length === 0}
            onChange={(event) => {
              const next = event.target.files;
              if (next && next.length > 0) setDrafts(draftsFromFiles(next));
            }}
          />
        </div>

        {multiple ? (
          drafts.map((draft, index) => (
            <fieldset key={draft.key} className="flex flex-col gap-4">
              <legend className="typo-body-sm font-medium">
                {draft.file.name}
              </legend>
              <DocumentKindSelect
                id={`document-kind-${draft.key}`}
                label={`Art ${index + 1}`}
                value={draft.kind}
                onChange={(nextKind) =>
                  updateDraft(draft.key, { kind: nextKind })
                }
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor={`document-name-${draft.key}`}>
                  Name {index + 1}
                </Label>
                <Input
                  id={`document-name-${draft.key}`}
                  value={draft.name}
                  required
                  maxLength={200}
                  placeholder="Name der Vorlage eingeben"
                  onChange={(event) =>
                    updateDraft(draft.key, { name: event.target.value })
                  }
                />
              </div>
            </fieldset>
          ))
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="document-name">Name</Label>
            <Input
              id="document-name"
              value={name}
              required
              maxLength={200}
              placeholder="Name der Vorlage eingeben"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={pending || !ready}>
          {pending ? 'Wird gelesen…' : 'Anlegen'}
        </Button>
      </form>
    </ModalOverlay>
  );
}
