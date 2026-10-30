import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { useNavigate } from '@tanstack/react-router';
import { Check, Upload, X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DocumentKindSelect } from './components/DocumentKindSelect';
import { SharePointFilePicker } from './components/SharePointFilePicker';
import type { SharePointFileHit } from './documentMasters.api';
import {
  DOCUMENT_MASTER_KINDS,
  TEMPLATE_DOCUMENT_KINDS,
  documentKindLabel,
  normalizeDocumentKind,
} from './documentMaster.types';
import { useCreateDocumentMaster } from './useCreateDocumentMaster';
import { useImportSharePointDocumentMaster } from './useImportSharePointDocumentMaster';

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

export function AddDocumentMasterDialog({
  onClose,
  isOpen = true,
  purpose,
  existingKinds = [],
}: AddDocumentMasterDialogProps) {
  const navigate = useNavigate();
  const createMaster = useCreateDocumentMaster();
  const importSharePoint = useImportSharePointDocumentMaster();
  const presetKinds =
    purpose === 'template' ? TEMPLATE_DOCUMENT_KINDS : DOCUMENT_MASTER_KINDS;
  const initialLabel =
    purpose === 'template' ? 'Arbeitszeugnis' : 'Arbeitsvertrag';
  const [createdKinds, setCreatedKinds] = useState<string[]>([]);
  const options = uniqueLabels([
    ...presetKinds.map((kind) => documentKindLabel(kind)),
    ...existingKinds.map((kind) => documentKindLabel(kind)),
    ...createdKinds,
  ]);
  const [kindLabel, setKindLabel] = useState(initialLabel);
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [sharePointFile, setSharePointFile] =
    useState<SharePointFileHit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const multiple = drafts.length > 1;
  const kindsReady = multiple
    ? drafts.every((draft) => normalizeDocumentKind(draft.kindLabel))
    : purpose === 'contract' || normalizeDocumentKind(kindLabel);
  const ready =
    Boolean(kindsReady) &&
    (multiple
      ? drafts.every((draft) => draft.name.trim().length > 0)
      : sharePointFile
        ? name.trim().length > 0
        : drafts.length === 1 && name.trim().length > 0);

  const rememberKind = (label: string) => {
    const next = label.trim();
    if (!next) return;
    setCreatedKinds((current) => uniqueLabels([...current, next]));
    return next;
  };

  const createKind = (label: string) => {
    const next = rememberKind(label);
    if (next) setKindLabel(next);
  };

  const selectFiles = (files: FileList | null) => {
    if (!files?.length) return;
    if ([...files].some((file) => !/\.(pdf|docx|txt)$/i.test(file.name))) {
      setError('Bitte PDF-, Word- (.docx) oder Textdateien (.txt) auswählen.');
      return;
    }
    setError(null);
    setSharePointFile(null);
    setDrafts(draftsFromFiles(files, initialLabel));
  };

  const selectSharePointFile = (file: SharePointFileHit | null) => {
    setError(null);
    setSharePointFile(file);
    if (file) {
      setDrafts([]);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^.]+$/, ''));
      }
    }
  };

  const updateDraft = (key: string, patch: Partial<UploadDraft>) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...patch } : draft
      )
    );
  };

  const createDraftKind = (key: string, label: string) => {
    const next = rememberKind(label);
    if (next) updateDraft(key, { kindLabel: next });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || pending) return;

    if (sharePointFile && !multiple) {
      const kind =
        purpose === 'contract'
          ? 'employment_contract'
          : normalizeDocumentKind(kindLabel);
      if (!kind) {
        setError('Bitte eine Art angeben.');
        return;
      }
      setPending(true);
      setError(null);
      try {
        const created = await importSharePoint.mutateAsync({
          kind,
          name: name.trim(),
          driveId: sharePointFile.driveId,
          itemId: sharePointFile.id,
        });
        onClose();
        navigate({
          to: '/settings/documents/$id',
          params: { id: created.id },
        });
      } catch (submitError) {
        setError(messageFrom(submitError));
      } finally {
        setPending(false);
      }
      return;
    }

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
    <SidebarAside className="p-2" isOpen={isOpen} onClose={onClose}>
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
              <DocumentKindSelect
                id="document-kind"
                label="Art"
                value={kindLabel}
                options={options}
                onChange={setKindLabel}
                onCreate={createKind}
              />
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="document-file">Datei</Label>
              <input
                ref={fileInput}
                id="document-file"
                type="file"
                className="sr-only"
                tabIndex={-1}
                multiple
                disabled={pending}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => {
                  selectFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!pending) setDragging(true);
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null
                    )
                  )
                    setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (!pending) selectFiles(event.dataTransfer.files);
                }}
                className={cn(
                  'flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-5 py-6 text-center transition-colors hover:border-foreground/50 focus-visible:border-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  dragging && 'border-foreground/50'
                )}
              >
                <Upload className="size-5 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">
                  Dateien hier ablegen oder auswählen
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, Word (.docx) oder Text (.txt)
                </span>
                {drafts.length > 0 ? (
                  <span
                    className="max-w-full break-all text-sm"
                    aria-live="polite"
                  >
                    {drafts.map((draft) => draft.file.name).join(', ')}
                  </span>
                ) : null}
              </button>
            </div>

            {multiple ? null : (
              <SharePointFilePicker
                disabled={pending}
                selected={sharePointFile}
                onSelect={selectSharePointFile}
              />
            )}

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
                      value={draft.kindLabel}
                      options={options}
                      onChange={(nextLabel) =>
                        updateDraft(draft.key, { kindLabel: nextLabel })
                      }
                      onCreate={(nextLabel) =>
                        createDraftKind(draft.key, nextLabel)
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
