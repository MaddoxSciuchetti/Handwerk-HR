import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type MessageDraft = {
  subject: string | null;
  body: string;
};

type AutomationMessageViewProps = {
  title: string;
  message: MessageDraft;
  disabled?: boolean;
  onSave: (message: MessageDraft) => void;
};

export function AutomationMessageView({
  title,
  message,
  disabled = false,
  onSave,
}: AutomationMessageViewProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const savedBody = useRef(message.body);
  const messageRef = useRef(message);
  const onSaveRef = useRef(onSave);
  messageRef.current = message;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!open || body === savedBody.current) return;
    setSaving(true);
    const timeout = window.setTimeout(() => {
      onSaveRef.current({ ...messageRef.current, body });
      savedBody.current = body;
      setSaving(false);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [body, open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={`View Nachricht für ${title}`}
        className="h-8 w-full justify-end px-2 text-xs font-normal"
        onClick={() => setOpen(true)}
      >
        View Nachricht
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setBody(message.body);
            savedBody.current = message.body;
            setSaving(false);
          }
          setOpen(next);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Nachricht</DialogTitle>
          <div className="relative">
            <Textarea
              aria-label="Nachricht"
              value={body}
              disabled={disabled}
              rows={14}
              className="min-h-72 resize-none rounded-xl border-0 p-4 text-sm shadow-none focus-visible:ring-0 md:text-sm"
              onChange={(event) => setBody(event.target.value)}
            />
            {saving && (
              <Spinner
                className="absolute right-3 bottom-3 size-4"
                aria-label="Speichern"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
