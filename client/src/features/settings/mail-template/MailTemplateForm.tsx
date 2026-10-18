import { MicrosoftSimulationNotice } from '@/features/settings/integrations/MicrosoftSimulationNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WelcomeMailGroupSelect } from '@/features/settings/welcome-mail/WelcomeMailGroupSelect';
import type {
  WelcomeMailPageData,
  WelcomeMailSettings,
} from '@/features/settings/welcome-mail/welcomeMail.api';
import { useEffect, useState } from 'react';
import { MailMessageField } from './MailMessageField';
import { customMailPlaceholders } from './mailPlaceholders';
import { useSaveMailTemplate } from './useMailTemplates';

type MailTemplateFormProps = {
  templateId: string;
  page: WelcomeMailPageData;
};

const emptyDraft: WelcomeMailSettings = {
  senderAddress: '',
  groupId: '',
  groupName: '',
  subject: '',
  body: '',
};

export function MailTemplateForm({ templateId, page }: MailTemplateFormProps) {
  const save = useSaveMailTemplate(templateId);
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
        <Label htmlFor="mail-template-sender">Absender</Label>
        <Input
          id="mail-template-sender"
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
        <Label htmlFor="mail-template-group">Team</Label>
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
        {page.simulated && <MicrosoftSimulationNotice />}
        {page.groupsError ? (
          <p className="text-sm text-destructive">{page.groupsError}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mail-template-subject">Betreff</Label>
        <Input
          id="mail-template-subject"
          value={draft.subject}
          onChange={(event) =>
            setDraft((current) => ({ ...current, subject: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label id="mail-template-body-label" htmlFor="mail-template-body">
          Nachricht
        </Label>
        <MailMessageField
          id="mail-template-body"
          labelledBy="mail-template-body-label"
          value={draft.body}
          placeholders={customMailPlaceholders}
          onChange={(body) => setDraft((current) => ({ ...current, body }))}
        />
      </div>
      {save.isError ? (
        <p className="text-sm text-destructive">
          Die E-Mail konnte nicht gespeichert werden.
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
