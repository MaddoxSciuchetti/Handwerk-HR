import { useState } from 'react';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { TeamsConnectionCard } from '@/features/microsoft-teams/TeamsConnectionCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SettingsPageHeader } from '../components/SettingsPageHeader';
import {
  descriptionSentencesKey,
  getDescriptionSentences,
  saveDescriptionSentence,
} from '../documents/descriptionSentences.api';
import {
  DESCRIPTION_SENTENCE_MAX,
  descriptionSentenceKey,
  normalizeDescriptionSentence,
} from '@shared/descriptionSentences';

export function GeneralSettings() {
  const [draft, setDraft] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sentences = useQuery({
    queryKey: descriptionSentencesKey,
    queryFn: getDescriptionSentences,
  });
  const save = useMutation({
    mutationFn: saveDescriptionSentence,
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: descriptionSentencesKey }),
    onSuccess: (saved) => {
      queryClient.setQueryData(descriptionSentencesKey, saved);
      setDraft('');
      toast.success('Beschreibung gespeichert');
    },
    onError: () => toast.error('Beschreibung konnte nicht gespeichert werden'),
  });
  const sentence = normalizeDescriptionSentence(draft);
  const duplicate = (sentences.data ?? []).some(
    (value) =>
      descriptionSentenceKey(value) === descriptionSentenceKey(sentence)
  );
  const canSave =
    sentences.isSuccess &&
    !save.isPending &&
    sentence.length > 0 &&
    sentence.length <= DESCRIPTION_SENTENCE_MAX &&
    !duplicate;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <SettingsPageHeader title="Allgemein" />
      <Card className="mt-5 w-full max-w-2xl shrink-0 border border-border shadow-none ring-0">
        <CardContent className="space-y-4">
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSave) save.mutate(sentence);
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-description"
                aria-label="Neue Beschreibung"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={DESCRIPTION_SENTENCE_MAX}
                placeholder="Beschreibung eingeben"
                disabled={save.isPending}
              />
              <Button type="submit" disabled={!canSave}>
                <Plus aria-hidden="true" />
                {save.isPending ? 'Wird gespeichert …' : 'Hinzufügen'}
              </Button>
            </div>
          </form>
          {sentences.isPending ? (
            <p className="text-sm text-muted-foreground" role="status">
              Beschreibungen werden geladen …
            </p>
          ) : sentences.isError ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-destructive">
                Beschreibungen konnten nicht geladen werden.
              </p>
              <Button variant="outline" onClick={() => sentences.refetch()}>
                Erneut versuchen
              </Button>
            </div>
          ) : (
            <ul
              aria-label="Gespeicherte Beschreibungen"
              tabIndex={0}
              className="max-h-30 overflow-y-auto overscroll-contain divide-y divide-border rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
              {sentences.data.map((value) => (
                <li
                  key={descriptionSentenceKey(value)}
                  className="flex min-h-10 items-center py-2 text-sm break-words [overflow-wrap:anywhere]"
                >
                  {value}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {user && (
        <div className="w-full max-w-2xl shrink-0">
          <TeamsConnectionCard user={user} />
        </div>
      )}
    </div>
  );
}
