import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { useNavigate } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  DOCUMENT_MASTER_KINDS,
  TEMPLATE_DOCUMENT_KINDS,
  documentKindLabel,
  normalizeDocumentKind,
} from './documentMaster.types';
import { useCreateDocumentMaster } from './useCreateDocumentMaster';

type AddDocumentMasterDialogProps = {
  onClose: () => void;
  isOpen?: boolean;
  purpose?: 'contract' | 'template';
  existingKinds?: string[];
};

type UploadDraft = {
  key: string;
  file: File;
  name: string;
  kindLabel: string;
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

function uniqueLabels(labels: string[]) {
  const seen = new Set<string>();
  return labels.filter((label) => {
    const key = label.toLocaleLowerCase('de');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function draftsFromFiles(files: FileList, kindLabel: string): UploadDraft[] {
  return [...files].map((file, index) => ({
    key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    name: '',
    kindLabel,
  }));
}

function DocumentKindField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (kindLabel: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLocaleLowerCase('de');
  const exactMatch = options.some(
    (option) => option.toLocaleLowerCase('de') === query
  );
  const matches =
    query.length === 0 || exactMatch
      ? options
      : options.filter((option) =>
          option.toLocaleLowerCase('de').includes(query)
        );
  const canAdd =
    value.trim().length > 0 &&
    !options.some(
      (option) => option.toLocaleLowerCase('de') === query
    );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-options`}
        value={value}
        maxLength={80}
        placeholder="Art wählen oder eingeben"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
      />
      {open ? (
        <div
          id={`${id}-options`}
          role="listbox"
          className="flex max-h-48 flex-col overflow-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option.toLocaleLowerCase('de') === query}
              className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
          {canAdd ? (
            <button
              type="button"
              role="option"
              aria-selected={false}
              className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(value.trim());
                setOpen(false);
              }}
            >
              {`„${value.trim()}“ hinzufügen`}
            </button>
          ) : null}
          {matches.length === 0 && !canAdd ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Art eingeben
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AddDocumentMasterDialog({
  onClose,
  isOpen = true,
  purpose,
  existingKinds = [],
}: AddDocumentMasterDialogProps) {
  const navigate = useNavigate();
  const createMaster = useCreateDocumentMaster();
  const presetKinds =
    purpose === 'template' ? TEMPLATE_DOCUMENT_KINDS : DOCUMENT_MASTER_KINDS;
  const initialLabel =
    purpose === 'template' ? 'Arbeitszeugnis' : 'Arbeitsvertrag';
  const options = uniqueLabels([
    ...presetKinds.map((kind) => documentKindLabel(kind)),
    ...existingKinds.map((kind) => documentKindLabel(kind)),
  ]);
  const [kindLabel, setKindLabel] = useState(initialLabel);
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const multiple = drafts.length > 1;
  const kindsReady = multiple
    ? drafts.every((draft) => normalizeDocumentKind(draft.kindLabel))
    : purpose === 'contract' || normalizeDocumentKind(kindLabel);
  const ready =
    Boolean(kindsReady) &&
    (multiple
      ? drafts.every((draft) => draft.name.trim().length > 0)
      : drafts.length === 1 && name.trim().length > 0);

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
          kind:
            purpose === 'contract'
              ? 'employment_contract'
              : normalizeDocumentKind(draft.kindLabel),
          name: draft.name.trim(),
          file: draft.file,
        }))
      : [
          {
            kind:
              purpose === 'contract'
                ? 'employment_contract'
                : normalizeDocumentKind(kindLabel),
            name: name.trim(),
            file: drafts[0].file,
          },
        ];
    if (uploads.some((upload) => !upload.kind)) {
      setError('Bitte eine Art angeben.');
      return;
    }

    setPending(true);
    setError(null);
    const created = [];
    try {
      for (const upload of uploads) {
        created.push(
          await createMaster.mutateAsync({
            kind: upload.kind ?? '',
            name: upload.name,
            file: upload.file,
          })
        );
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
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">
            {purpose === 'contract'
              ? 'Arbeitsvertrag hinzufügen'
              : purpose === 'template'
                ? 'Vorlage hinzufügen'
                : 'Dokument hinzufügen'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Schließen"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <SidebarContent className="flex flex-col gap-4 p-6">
            {multiple || purpose === 'contract' ? null : (
              <DocumentKindField
                id="document-kind"
                label="Art"
                value={kindLabel}
                options={options}
                onChange={setKindLabel}
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
                  if (next && next.length > 0) {
                    setDrafts(draftsFromFiles(next, initialLabel));
                  }
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
                    <DocumentKindField
                      id={`document-kind-${draft.key}`}
                      label={`Art ${index + 1}`}
                      value={draft.kindLabel}
                      options={options}
                      onChange={(nextLabel) =>
                        updateDraft(draft.key, { kindLabel: nextLabel })
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
          </SidebarContent>
          <SidebarFooter className="p-6">
            <Button
              type="submit"
              className="rounded-full"
              disabled={pending || !ready}
            >
              <Check className="h-4 w-4" aria-hidden />
              {pending ? 'Wird gelesen…' : 'Anlegen'}
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
