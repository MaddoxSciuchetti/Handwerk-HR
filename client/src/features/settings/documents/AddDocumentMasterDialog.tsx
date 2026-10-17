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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from '@tanstack/react-router';
import { FormEvent, useState } from 'react';
import {
  DOCUMENT_MASTER_KIND_LABELS,
  DOCUMENT_MASTER_KINDS,
  TEMPLATE_DOCUMENT_KINDS,
  type DocumentMasterKind,
} from './documentMaster.types';
import { useCreateDocumentMaster } from './useCreateDocumentMaster';

type AddDocumentMasterDialogProps = {
  onClose: () => void;
  purpose?: 'contract' | 'template';
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

function draftsFromFiles(
  files: FileList,
  kind: DocumentMasterKind
): UploadDraft[] {
  return [...files].map((file, index) => ({
    key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    name: '',
    kind,
  }));
}

function DocumentKindSelect({
  id,
  label,
  value,
  kinds,
  onChange,
}: {
  id: string;
  label: string;
  value: DocumentMasterKind;
  kinds: readonly DocumentMasterKind[];
  onChange: (kind: DocumentMasterKind) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const selectedKind = kinds.find(
            (option) => option === next
          );
          if (selectedKind) onChange(selectedKind);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Dokumentart wählen" />
        </SelectTrigger>
        <SelectContent>
          {kinds.map((option) => (
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
  purpose,
}: AddDocumentMasterDialogProps) {
  const navigate = useNavigate();
  const createMaster = useCreateDocumentMaster();
  const kinds =
    purpose === 'template' ? TEMPLATE_DOCUMENT_KINDS : DOCUMENT_MASTER_KINDS;
  const initialKind: DocumentMasterKind =
    purpose === 'template' ? 'arbeitszeugnis' : 'employment_contract';
  const [kind, setKind] = useState<DocumentMasterKind>(initialKind);
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
          kind: purpose === 'contract' ? initialKind : draft.kind,
          name: draft.name.trim(),
          file: draft.file,
        }))
      : [
          {
            kind: purpose === 'contract' ? initialKind : kind,
            name: name.trim(),
            file: drafts[0].file,
          },
        ];

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
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="w-full max-w-lg border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full flex-col gap-4 rounded-xl border border-border bg-(--modal-surface) p-6 pt-10 text-foreground shadow-lg"
      >
        <div>
          <h2 className="typo-h4 font-bold">
            {purpose === 'contract'
              ? 'Arbeitsvertrag hinzufügen'
              : purpose === 'template'
                ? 'Vorlage hinzufügen'
                : 'Dokument hinzufügen'}
          </h2>
          <p className="typo-body-sm text-muted-foreground">
            {purpose === 'contract'
              ? 'Laden Sie einen oder mehrere Entwürfe des Arbeitsvertrags hoch.'
              : purpose === 'template'
                ? 'Diese Vorlagen können unter einem Engagement gewählt und mit dem Fragebogen abgeglichen werden.'
                : 'Sie können mehrere Dateien auf einmal hochladen und jeder eine Art geben. Jede Datei wird als bearbeitbare Vorlage geöffnet. Dort können Sie variable Felder einfügen.'}
          </p>
        </div>

        {multiple || purpose === 'contract' ? null : (
          <DocumentKindSelect
            id="document-kind"
            label="Art"
            value={kind}
            kinds={kinds}
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
              if (next && next.length > 0) setDrafts(draftsFromFiles(next, initialKind));
            }}
          />
        </div>

        {multiple ? (
          drafts.map((draft, index) => (
            <fieldset key={draft.key} className="flex flex-col gap-4">
              <legend className="typo-body-sm font-medium">
                {draft.file.name}
              </legend>
              {purpose === 'contract' ? null : (
                <DocumentKindSelect
                  id={`document-kind-${draft.key}`}
                  label={`Art ${index + 1}`}
                  value={draft.kind}
                  kinds={kinds}
                  onChange={(nextKind) =>
                    updateDraft(draft.key, { kind: nextKind })
                  }
                />
              )}
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
      </DialogContent>
    </Dialog>
  );
}
