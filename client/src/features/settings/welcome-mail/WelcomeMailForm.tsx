import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { WelcomeMailGroupSelect } from './WelcomeMailGroupSelect';
import type { WelcomeMailPageData, WelcomeMailSettings } from './welcomeMail.api';
import { useSaveWelcomeMail } from './useWelcomeMail';

type WelcomeMailFormProps = {
  page: WelcomeMailPageData;
};

const emptyDraft: WelcomeMailSettings = {
  senderAddress: '',
  groupId: '',
  groupName: '',
  subject: '',
  body: '',
};

export function WelcomeMailForm({ page }: WelcomeMailFormProps) {
  const save = useSaveWelcomeMail();
  const [draft, setDraft] = useState<WelcomeMailSettings>(emptyDraft);

  useEffect(() => {
    setDraft(page.settings ?? emptyDraft);
  }, [page.settings]);

  const canSave =
    draft.senderAddress.trim().length > 0 &&
    draft.groupId.trim().length > 0 &&
    draft.subject.trim().length > 0 &&
    draft.body.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-4 px-3 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || save.isPending) return;
        save.mutate({
          senderAddress: draft.senderAddress.trim(),
          groupId: draft.groupId.trim(),
          groupName: draft.groupName.trim(),
          subject: draft.subject.trim(),
          body: draft.body.trim(),
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="welcome-sender">Absender</Label>
        <Input
          id="welcome-sender"
          type="email"
          autoComplete="off"
          value={draft.senderAddress}
          placeholder="admin@firma.de"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              senderAddress: event.target.value,
            }))
          }
        />
        <p className="text-sm text-muted-foreground">
          Die Mail geht über dieses Microsoft-Postfach raus.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="welcome-group">Team</Label>
        <WelcomeMailGroupSelect
          groups={page.groups}
          groupId={draft.groupId}
          groupName={draft.groupName}
          onChange={(group) =>
            setDraft((current) => ({
              ...current,
              groupId: group.id,
              groupName: group.displayName,
            }))
          }
        />
        {page.groupsError ? (
          <p className="text-sm text-destructive">{page.groupsError}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Alle Personen in diesem Microsoft-Team erhalten die Mail.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="welcome-subject">Betreff</Label>
        <Input
          id="welcome-subject"
          value={draft.subject}
          onChange={(event) =>
            setDraft((current) => ({ ...current, subject: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="welcome-body">Nachricht</Label>
        <Textarea
          id="welcome-body"
          className="min-h-40"
          value={draft.body}
          onChange={(event) =>
            setDraft((current) => ({ ...current, body: event.target.value }))
          }
        />
        <p className="text-sm text-muted-foreground">
          Platzhalter: {'{{Vorname}}'}, {'{{Nachname}}'}, {'{{Arbeitsmail}}'},{' '}
          {'{{Position}}'}, {'{{Eintritt}}'}
        </p>
      </div>
      {save.isError ? (
        <p className="text-sm text-destructive">
          Die Willkommensmail konnte nicht gespeichert werden.
        </p>
      ) : null}
      {save.isSuccess ? (
        <p className="text-sm text-foreground">Gespeichert.</p>
      ) : null}
      <div>
        <Button type="submit" disabled={!canSave || save.isPending}>
          Speichern
        </Button>
      </div>
    </form>
  );
}
