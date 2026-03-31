import LoadingAlert from '@/components/alerts/LoadingAlert';
import TrashWithModal from '@/components/DropDownWithModal';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { templateV2Mutations } from '../query-options/mutations/templateV2.mutations';
import { templateV2Queries } from '../query-options/queries/templateV2.queries';

type TemplateDetailPageProps = {
  templateId: string;
};

const TemplateDetailPage = ({ templateId }: TemplateDetailPageProps) => {
  const { data, isPending, isError } = useQuery(
    templateV2Queries.detail(templateId)
  );
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { mutate: createItem, isPending: isCreating } = useMutation(
    templateV2Mutations.createItem(templateId)
  );
  const { mutate: deleteItem } = useMutation(
    templateV2Mutations.deleteItem(templateId)
  );

  const templateItems = data?.items ?? [];
  const templateItemsByOrder = [...templateItems].sort(
    (left, right) => left.orderIndex - right.orderIndex
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    createItem(
      {
        title: trimmedTitle,
        description: description.trim() || undefined,
        orderIndex: templateItems.length,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setAddOpen(false);
        },
      }
    );
  };

  if (isPending) return <LoadingAlert />;
  if (isError || !data) {
    return (
      <div className="mx-auto flex w-5xl flex-col gap-4 p-6 md:max-w-8xl">
        <p className="text-sm text-destructive">Vorlage konnte nicht geladen werden.</p>
        <Button variant="outline" asChild>
          <Link to="/org-settings" search={{ currentTab: 'templates' }}>
            Zurück
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Vorlage bearbeiten"
      className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/org-settings" search={{ currentTab: 'templates' }}>
              ← Zurück zu Vorlagen
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-foreground">{data.name}</h1>
          {data.description ? (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {data.description}
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          Punkt hinzufügen
        </Button>
      </div>

      <div className="rounded-lg border">
        <ul className="divide-y divide-border">
          {templateItemsByOrder.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Noch keine Punkte. Fügen Sie Pseudo-Aufgaben hinzu, die später auf
              Mitarbeitende angewendet werden.
            </li>
          ) : (
            templateItemsByOrder.map((templateItem) => (
              <li
                key={templateItem.id}
                className="group flex items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--secondary)]/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {templateItem.title}
                  </p>
                  {templateItem.description ? (
                    <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {templateItem.description}
                    </p>
                  ) : null}
                </div>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <TrashWithModal
                    description="Punkt aus Vorlage löschen"
                    onConfirm={() => deleteItem(templateItem.id)}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {addOpen && (
        <ModalOverlay handleToggle={() => setAddOpen(false)}>
          <SmallWrapper>
            <form
              onSubmit={handleAddItem}
              className="flex w-full flex-col gap-3 text-left"
            >
              <h2 className="text-lg font-semibold">Neuer Punkt</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-title">Titel</Label>
                <Input
                  id="item-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kurze Aufgabenbeschreibung"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-desc">Beschreibung (optional)</Label>
                <Textarea
                  id="item-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20 resize-y"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isCreating || !title.trim()}>
                  {isCreating ? 'Speichern…' : 'Hinzufügen'}
                </Button>
              </div>
            </form>
          </SmallWrapper>
        </ModalOverlay>
      )}
    </div>
  );
};

export default TemplateDetailPage;
