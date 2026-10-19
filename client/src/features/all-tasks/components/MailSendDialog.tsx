import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { getMailSendPreview } from '@/features/all-tasks/api/tasks.api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type MailSendDialogProps = {
  taskId: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (senderAddress: string) => void;
};

export function MailSendDialog({
  taskId,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: MailSendDialogProps) {
  const [senderAddress, setSenderAddress] = useState('');
  const preview = useQuery({
    queryKey: ['mail-send-preview', taskId],
    queryFn: () => getMailSendPreview(taskId),
    enabled: open,
  });
  const data = preview.data?.data;
  const recipients = data?.recipients ?? [];
  const canSend =
    Boolean(senderAddress) &&
    recipients.length > 0 &&
    !preview.isLoading &&
    !preview.isError &&
    !pending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSenderAddress('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>E-Mail senden</DialogTitle>
          <DialogDescription>
            Absender, Empfänger und Inhalt vor dem Versand prüfen.
          </DialogDescription>
        </DialogHeader>
        {preview.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            E-Mail wird geladen…
          </div>
        ) : null}
        {preview.isError ? (
          <p className="text-sm text-destructive">
            Die E-Mail konnte nicht geladen werden. Vorlage und Empfänger
            müssen gesetzt sein.
          </p>
        ) : null}
        {data ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <span className="text-muted-foreground">Vorlage </span>
              {data.templateName}
            </p>
            <p>
              <span className="text-muted-foreground">Betreff </span>
              {data.subject}
            </p>
            <div>
              <p className="text-muted-foreground">Nachricht</p>
              <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted px-3 py-2 font-sans">
                {data.body}
              </pre>
            </div>
            <div>
              <p className="text-muted-foreground">Empfänger</p>
              {recipients.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {recipients.map((recipient, index) => (
                    <li key={`${recipient.label}-${index}`}>{recipient.label}</li>
                  ))}
                </ul>
              ) : (
                <p>Für dieses Engagement sind keine Empfänger gewählt.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="mail-sender" className="text-muted-foreground">
                Absender
              </label>
              <Select value={senderAddress || undefined} onValueChange={setSenderAddress}>
                <SelectTrigger id="mail-sender" className="w-full">
                  <SelectValue placeholder="Absender wählen" />
                </SelectTrigger>
                <SelectContent>
                  {data.senders.map((sender) => (
                    <SelectItem key={sender.email} value={sender.email}>
                      {sender.name} · {sender.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {data.senders.length === 0 ? (
                <p className="text-destructive">
                  Kein angemeldetes Mitglied mit Arbeits-E-Mail gefunden.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={!canSend}
            onClick={() => onConfirm(senderAddress)}
          >
            {pending ? 'Wird ausgeführt…' : 'Senden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
