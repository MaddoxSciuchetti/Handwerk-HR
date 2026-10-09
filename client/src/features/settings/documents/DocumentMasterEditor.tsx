import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
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
import { InsertContractInput } from './InsertContractInput';
import { useDocumentMaster } from './useDocumentMaster';
import { useSaveDocumentMaster } from './useSaveDocumentMaster';

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
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [revision, setRevision] = useState(1);
  const [document, setDocument] = useState<StyledDocument>(fromSegments([]));
  const [section, setSection] = useState<'content' | 'header' | 'footer'>(
    'content'
  );
  const fonts = useQuery({
    queryKey: ['document-font-status'],
    queryFn: () =>
      apiJson.get<{ ready: boolean; available: string[] }>(
        '/document-masters/font-status'
      ),
  });
  const [editing, setEditing] = useState(false);
  const editStartedAt = useRef(0);
  const openedForReturn = useRef(false);
  const returnKind = returnContract
    ? peekContractSendReturn()?.kind
    : undefined;
  const isContract = data?.kind === 'employment_contract';
  const usesSegments =
    data?.kind === 'employment_contract' || data?.kind === 'arbeitszeugnis';

  useEffect(() => {
    if (!data || editing) return;
    // Hydrate editable form state from the async query only while not editing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(data.name);
    setRevision(data.revision);
    setDocument(data.document ?? fromSegments(data.segments ?? []));
  }, [data, editing]);

  useEffect(() => {
    if (!returnContract || !data || openedForReturn.current) return;
    openedForReturn.current = true;
    editStartedAt.current = performance.now();
    // Auto-open editing once when returning from an engagement review.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditing(true);
  }, [returnContract, data]);

  const save = (approved = false) => {
    if (!data || performance.now() - editStartedAt.current < 400) return;
    saveMaster.mutate(
      { name: name.trim(), document, revision, approved },
      {
        onSuccess: () => {
          setEditing(false);
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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
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
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {data.approvedAt
            ? 'Vorlage freigegeben. Änderungen benötigen eine neue Freigabe.'
            : 'Bitte Import und Formatierung anhand des Originals prüfen und freigeben.'}
        </p>
        {fonts.data && !fonts.data.ready ? (
          <p className="text-sm text-destructive">
            Die vollständigen Calibri-Schriftdateien fehlen noch. PDF-Versand
            ist bis zur Einrichtung gesperrt.
          </p>
        ) : null}
        {data.importWarnings?.map((warning) => (
          <p key={warning} className="text-sm text-muted-foreground">
            {warning}
          </p>
        ))}
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
          <div className="flex min-h-0 flex-1 gap-4">
            {data.sourceUrl && data.sourceMime === 'application/pdf' ? (
              <iframe
                title="Originaldokument"
                src={data.sourceUrl}
                className="hidden min-h-96 w-1/2 rounded border lg:block"
              />
            ) : data.sourceUrl ? (
              <a href={data.sourceUrl} target="_blank" rel="noreferrer">
                Original öffnen
              </a>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex gap-2">
                {(['content', 'header', 'footer'] as const).map((s, i) => (
                  <Button
                    key={s}
                    type="button"
                    variant={section === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSection(s)}
                  >
                    {['Dokument', 'Kopfzeile', 'Fußzeile'][i]}
                  </Button>
                ))}
              </div>
              {editing ? (
                <>
                  <InsertContractInput />
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(
                      [
                        'width',
                        'height',
                        'marginTop',
                        'marginBottom',
                        'marginLeft',
                        'marginRight',
                      ] as const
                    ).map((key, i) => (
                      <label key={key}>
                        {
                          [
                            'Breite',
                            'Höhe',
                            'Rand oben',
                            'Rand unten',
                            'Rand links',
                            'Rand rechts',
                          ][i]
                        }{' '}
                        (mm)
                        <input
                          aria-label={key}
                          type="number"
                          min={0}
                          max={700}
                          className="ml-1 w-16 rounded border p-1"
                          value={document.page[key]}
                          onChange={(e) =>
                            setDocument((d) => ({
                              ...d,
                              page: {
                                ...d.page,
                                [key]: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                </>
              ) : null}
              <StyledDocumentEditor
                key={section}
                document={document}
                section={section}
                master
                readOnly={!editing}
                onChange={setDocument}
              />
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                disabled={saveMaster.isPending}
                onClick={() => save(false)}
              >
                {saveMaster.isPending ? 'Speichert…' : 'Speichern'}
              </Button>
              <Button
                type="button"
                disabled={saveMaster.isPending}
                onClick={() => save(true)}
              >
                Speichern und Vorlage freigeben
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName(data.name);
                  setDocument(
                    data.document ?? fromSegments(data.segments ?? [])
                  );
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
