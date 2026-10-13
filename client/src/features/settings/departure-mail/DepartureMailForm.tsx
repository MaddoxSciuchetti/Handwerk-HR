import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MailMessageField } from '@/features/settings/mail-template/MailMessageField';
import { departureMailPlaceholders } from '@/features/settings/mail-template/mailPlaceholders';
import { WelcomeMailGroupSelect } from '@/features/settings/welcome-mail/WelcomeMailGroupSelect';
import type {
  WelcomeMailPageData,
  WelcomeMailSettings,
} from '@/features/settings/welcome-mail/welcomeMail.api';
import { useState } from 'react';
import { useSaveDepartureMail } from './useDepartureMail';

type DepartureMailFormProps = {
  page: WelcomeMailPageData;
};

const emptyDraft: WelcomeMailSettings = {
  senderAddress: '',
  groupId: '',
  groupName: '',
  subject: '',
  body: '',
};

export function DepartureMailForm({ page }: DepartureMailFormProps) {
  const save = useSaveDepartureMail();
  const [draft, setDraft] = useState<WelcomeMailSettings>(
    page.settings ?? emptyDraft,
  );

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
        <Label htmlFor="departure-sender">Absender</Label>
        <Input
          id="departure-sender"
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
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="departure-group">Team</Label>
        <WelcomeMailGroupSelect
          triggerId="departure-group"
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
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="departure-subject">Betreff</Label>
        <Input
          id="departure-subject"
          value={draft.subject}
          onChange={(event) =>
            setDraft((current) => ({ ...current, subject: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label id="departure-body-label" htmlFor="departure-body">
          Nachricht
        </Label>
        <MailMessageField
          id="departure-body"
          labelledBy="departure-body-label"
          value={draft.body}
          placeholders={departureMailPlaceholders}
          onChange={(body) => setDraft((current) => ({ ...current, body }))}
        />
      </div>
      {save.isError ? (
        <p className="text-sm text-destructive">
          Die Entlassungsmail konnte nicht gespeichert werden.
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
