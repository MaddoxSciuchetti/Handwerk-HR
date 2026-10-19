import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { MailMessageField } from './MailMessageField';
import { customMailPlaceholders } from './mailPlaceholders';
import type { MailTemplateContent } from './mailTemplate.api';
import { useSaveMailTemplate } from './useMailTemplates';

type MailTemplateFormProps = {
  templateId: string;
  page: { settings: MailTemplateContent | null };
};

const emptyDraft: MailTemplateContent = {
  subject: '',
  body: '',
};

export function MailTemplateForm({ templateId, page }: MailTemplateFormProps) {
  const save = useSaveMailTemplate(templateId);
  const [draft, setDraft] = useState<MailTemplateContent>(emptyDraft);

  useEffect(() => {
    setDraft(page.settings ?? emptyDraft);
  }, [page.settings]);

  const canSave =
    draft.subject.trim().length > 0 && draft.body.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-4 px-3 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || save.isPending) return;
        save.mutate({
          subject: draft.subject.trim(),
          body: draft.body.trim(),
        });
      }}
    >
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
