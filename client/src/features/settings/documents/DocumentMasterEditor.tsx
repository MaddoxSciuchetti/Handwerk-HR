import { DocumentPrintPreview } from './DocumentPrintPreview';
import { DocumentMasterEditorSkeleton } from './components/DocumentEditorSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { peekContractSendReturn } from '@/features/worker-task-management/contractSendReturn';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { StyledDocumentEditor } from './StyledDocumentEditor';
import { fromSegments, type StyledDocument } from './styledDocument';
import { documentKindUsesEditor } from './documentMaster.types';
import type { DocumentMasterDetail } from './documentMaster.types';
import { DocumentMasterActions } from './components/DocumentMasterActions';
import { PrimaryContractStatus } from './components/PrimaryContractStatus';
import { DocumentEditorCorner } from './components/DocumentEditorCorner';
import { useDocumentMaster } from './useDocumentMaster';
import { useSaveDocumentMaster } from './useSaveDocumentMaster';
import { useSetPrimaryDocumentMaster } from './useSetPrimaryDocumentMaster';

type DocumentMasterEditorProps = {
  id: string;
  returnContract?: boolean;
};

export function DocumentMasterEditor({
  id,
  returnContract = false,
}: DocumentMasterEditorProps) {
  const { data, isLoading, isError } = useDocumentMaster(id);
  const saveMaster = useSaveDocumentMaster(id);
  const renameMaster = useSaveDocumentMaster(id);
  const pendingRename = useRef<Promise<DocumentMasterDetail> | null>(null);
  const setPrimary = useSetPrimaryDocumentMaster();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [revision, setRevision] = useState(1);
  const [document, setDocument] = useState<StyledDocument>(fromSegments([]));
  const [syncedMaster, setSyncedMaster] = useState<DocumentMasterDetail | null>(
    null
  );
  const [manualEditing, setManualEditing] = useState(false);
  const [returnEditing, setReturnEditing] = useState(false);
  const editing = manualEditing || returnEditing;
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<StyledDocument | null>(null);
  const [expanded, setExpanded] = useState(false);
  const editStartedAt = useRef(0);
  // Keep the form on the latest saved master until the user starts editing.
  if (data && !manualEditing && !returnEditing && data !== syncedMaster) {
    setSyncedMaster(data);
    setName(data.name);
    setRevision(data.revision);
    setDocument(data.document ?? fromSegments(data.segments ?? []));
    // Open imported masters as real editable text; PDF pages remain a preview.
    if (!syncedMaster) setManualEditing(true);
    if (returnContract) setReturnEditing(true);
  }
  useEffect(() => {
    if (editing && editStartedAt.current === 0)
      editStartedAt.current = performance.now();
  }, [editing]);
  const returnKind = returnContract
    ? peekContractSendReturn()?.kind
    : undefined;
  const isContract = data?.kind === 'employment_contract';
  const usesSegments = data ? documentKindUsesEditor(data.kind) : false;

  const saveName = () => {
    const nextName = name.trim();
    if (!data || renameMaster.isPending || nextName === data.name) return;
    if (!nextName) {
      setName(data.name);
      return;
    }
    setName(nextName);
    // Rename using the saved content so unsaved document edits stay local.
    const request = renameMaster.mutateAsync({
      name: nextName,
      document: data.document ?? fromSegments(data.segments ?? []),
      revision,
      approved: Boolean(data.approvedAt),
    });
    pendingRename.current = request;
    void request.then(
      (saved) => {
        setRevision(saved.revision);
        toast.success('Name gespeichert');
      },
      () => toast.error('Name konnte nicht gespeichert werden')
    ).finally(() => {
      if (pendingRename.current === request) pendingRename.current = null;
    });
  };

  const save = async () => {
    if (!data || performance.now() - editStartedAt.current < 400) return;
    let saveRevision = revision;
    if (pendingRename.current) {
      try {
        saveRevision = (await pendingRename.current).revision;
      } catch {
        return;
      }
    }
    saveMaster.mutate(
      { name: name.trim(), document, revision: saveRevision, approved: true },
      {
        onSuccess: (saved) => {
          // Saving is not leaving the editor: keep the same DOM, selection,
          // toolbar and scroll container. Only advance the concurrency revision.
          setRevision(saved.revision);
          toast.success('Dokument gespeichert');
        },
        onError: () => toast.error('Dokument konnte nicht gespeichert werden'),
      }
    );
  };

  const returnToContract = () => {
    const pending = peekContractSendReturn();
    if (!pending) {
      void navigate({ to: '/settings/documents' });
      return;
    }
    if (pending.returnTo === 'tasks') {
      void navigate({ to: '/tasks' });
      return;
    }
    void navigate({
      to: '/user/$Id',
      params: { Id: pending.workerId },
      search: {
        workerName: pending.workerName,
        prevPage: pending.prevPage,
      },
    });
  };



  if (isLoading) {
    return <DocumentMasterEditorSkeleton />;
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
    <div
      className={
        expanded
          ? 'fixed inset-2 z-50 flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 text-card-foreground shadow-xl'
          : 'mx-auto flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 text-card-foreground'
      }
    >
      <Dialog open={previewDocument !== null} onOpenChange={(open) => { if (!open) setPreviewDocument(null); }}>
        <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col overflow-hidden bg-card sm:max-w-[95vw]">
          <DialogTitle>PDF-Vorschau</DialogTitle>
          <DialogDescription className="sr-only">Vorschau des aktuellen Vertrags als PDF.</DialogDescription>
          {previewDocument ? <DocumentPrintPreview id={id} revision={revision} document={previewDocument} /> : null}
        </DialogContent>
      </Dialog>
      <div className="shrink-0">
        {returnContract ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={returnKind === 'arbeitszeugnis' ? 'Zurück zum Arbeitszeugnis' : 'Zurück zum Vertrag'}
            onClick={returnToContract}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings/documents" aria-label="Zurück">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {editing ? (
            <div className="flex w-full max-w-sm min-w-0 items-center gap-3">
              <Label htmlFor="master-name" className="shrink-0">Name</Label>
              <Input
                id="master-name"
                className="min-w-0 flex-1"
                value={name}
                required
                maxLength={200}
                disabled={renameMaster.isPending || saveMaster.isPending}
                onChange={(event) => setName(event.target.value)}
                onBlur={saveName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
          ) : (
            <h2 className="text-lg font-semibold">{name}</h2>
          )}
          {isContract ? (
            <PrimaryContractStatus
              isPrimary={data.isPrimary}
              pending={setPrimary.isPending}
              onSelect={() =>
                setPrimary.mutate(data.id, {
                  onError: () =>
                    toast.error(
                      'Die Versandvorlage konnte nicht gespeichert werden'
                    ),
                })
              }
            />
          ) : null}
          <DocumentMasterActions
            pending={saveMaster.isPending || !name.trim()}
            onSave={save}
            onPreview={() => setPreviewDocument(document)}
          />
        </div>
        {returnContract && isContract ? (
          <p className="text-sm text-muted-foreground">
            Ergänzen Sie die fehlende Eingabe, speichern Sie den Mustervertrag
            und kehren Sie zum Vertrag zurück. Dort ziehen Sie die Angabe in das
            neue Feld.
          </p>
        ) : null}
        {returnContract && returnKind === 'arbeitszeugnis' ? (
          <p className="text-sm text-muted-foreground">
            Benennen Sie den Platzhalter so, dass er einer Mitarbeiterangabe
            entspricht, speichern Sie das Muster und kehren Sie zum
            Arbeitszeugnis zurück.
          </p>
        ) : null}
        {usesSegments ? (
          <div
            className={
              expanded
                ? 'flex min-h-0 min-w-0 flex-1 gap-4'
                : 'flex min-h-[60vh] min-w-0 flex-1 gap-4'
            }
          >
            {showOriginal &&
            data.sourceUrl &&
            data.sourceMime === 'application/pdf' ? (
              <iframe
                title="Originaldokument"
                src={data.sourceUrl}
                className="min-h-96 w-2/5 shrink-0 rounded border"
              />
            ) : null}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              {editing ? (
                <StyledDocumentEditor
                  document={document}
                  section="content"
                  master
                  pageView
                  onChange={setDocument}
                  expanded={expanded}
                  onToggleExpanded={() => setExpanded((open) => !open)}
                  showOriginalToggle={
                    Boolean(data.sourceUrl) &&
                    data.sourceMime === 'application/pdf'
                  }
                  showOriginal={showOriginal}
                  onToggleOriginal={() => setShowOriginal((show) => !show)}
                />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
                  <div className="flex justify-end bg-card px-2 py-2">
                    <DocumentEditorCorner
                      expanded={expanded}
                      onToggleExpanded={() => setExpanded((open) => !open)}
                      showOriginalToggle={
                        Boolean(data.sourceUrl) &&
                        data.sourceMime === 'application/pdf'
                      }
                      showOriginal={showOriginal}
                      onToggleOriginal={() => setShowOriginal((show) => !show)}
                    />
                  </div>
                  <DocumentPrintPreview id={id} revision={revision} />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
