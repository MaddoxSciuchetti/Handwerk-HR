import { DocumentPrintPreview } from './DocumentPrintPreview';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { peekContractSendReturn } from '@/features/worker-task-management/contractSendReturn';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { StyledDocumentEditor } from './StyledDocumentEditor';
import { fromSegments, type StyledDocument } from './styledDocument';
import { apiJson } from '@/config/apiClient';
import { useQuery } from '@tanstack/react-query';
import { DOCUMENT_MASTER_KIND_LABELS } from './documentMaster.types';
import type { DocumentMasterDetail } from './documentMaster.types';
import { DocumentMasterActions } from './components/DocumentMasterActions';
import { PrimaryContractStatus } from './components/PrimaryContractStatus';
import { DocumentEditorCorner } from './components/DocumentEditorCorner';
import {
  DocumentFontNotice,
  type DocumentFontStatus,
} from './DocumentFontNotice';
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
  const setPrimary = useSetPrimaryDocumentMaster();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [revision, setRevision] = useState(1);
  const [document, setDocument] = useState<StyledDocument>(fromSegments([]));
  const [syncedMaster, setSyncedMaster] = useState<DocumentMasterDetail | null>(
    null
  );
  const fonts = useQuery({
    queryKey: ['document-font-status'],
    queryFn: () =>
      apiJson.get<DocumentFontStatus>('/document-masters/font-status'),
  });
  const [manualEditing, setManualEditing] = useState(false);
  const [returnEditing, setReturnEditing] = useState(false);
  const [cancelledReturnEdit, setCancelledReturnEdit] = useState(false);
  const editing = manualEditing || returnEditing;
  const [showOriginal, setShowOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const editStartedAt = useRef(0);
  // Keep the form on the latest saved master until the user starts editing.
  if (data && !manualEditing && !returnEditing && data !== syncedMaster) {
    setSyncedMaster(data);
    setName(data.name);
    setRevision(data.revision);
    setDocument(data.document ?? fromSegments(data.segments ?? []));
    if (returnContract && !cancelledReturnEdit) setReturnEditing(true);
  }
  useEffect(() => {
    if (returnEditing && editStartedAt.current === 0)
      editStartedAt.current = performance.now();
  }, [returnEditing]);
  const returnKind = returnContract
    ? peekContractSendReturn()?.kind
    : undefined;
  const isContract = data?.kind === 'employment_contract';
  const usesSegments =
    data?.kind === 'employment_contract' || data?.kind === 'arbeitszeugnis';

  const save = (approved = false) => {
    if (!data || performance.now() - editStartedAt.current < 400) return;
    saveMaster.mutate(
      { name: name.trim(), document, revision, approved },
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

  const startEditing = () => {
    editStartedAt.current = performance.now();
    setManualEditing(true);
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
    <div
      className={
        expanded
          ? 'fixed inset-2 z-50 flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 text-card-foreground shadow-xl'
          : 'mx-auto flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 text-card-foreground'
      }
    >
      <SettingsPageHeader
        title={DOCUMENT_MASTER_KIND_LABELS[data.kind]}
        action={
          returnContract ? (
            <button
              type="button"
              className="text-sm underline"
              onClick={returnToContract}
            >
              {returnKind === 'arbeitszeugnis'
                ? 'Zurück zum Arbeitszeugnis'
                : 'Zurück zum Vertrag'}
            </button>
          ) : (
            <Link to="/settings/documents" className="text-sm underline">
              Zurück
            </Link>
          )
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <details className="shrink-0 text-sm text-muted-foreground">
          <summary className="cursor-pointer">
            Importprüfung und Schriftstatus
          </summary>
          <p className="text-sm text-muted-foreground">
            {data.approvedAt
              ? 'Vorlage freigegeben. Änderungen benötigen eine neue Freigabe.'
              : 'Bitte Import und Formatierung anhand des Originals prüfen und freigeben.'}
          </p>
          {data.importWarnings?.map((warning) => (
            <p key={warning} className="text-sm text-muted-foreground">
              {warning}
            </p>
          ))}
        </details>
        <DocumentFontNotice status={fonts.data} />
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
            ) : data.sourceUrl && data.sourceMime !== 'application/pdf' ? (
              <a href={data.sourceUrl} target="_blank" rel="noreferrer">
                Original öffnen
              </a>
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
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
                  <div className="flex justify-end border-b bg-muted/40 px-2 py-2">
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
        <DocumentMasterActions
          editing={editing}
          pending={saveMaster.isPending}
          onSave={save}
          onCancel={() => {
            setName(data.name);
            setDocument(data.document ?? fromSegments(data.segments ?? []));
            setManualEditing(false);
            setReturnEditing(false);
            setCancelledReturnEdit(true);
          }}
          onEdit={startEditing}
        />
      </div>
    </div>
  );
}
