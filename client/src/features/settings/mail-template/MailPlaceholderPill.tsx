import { Button } from '@/components/ui/button';
import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { MAIL_PLACEHOLDER_DRAG, mailPillClassName } from './mailPlaceholders';

type MailPlaceholderPillProps = {
  token: string;
  onInsert: (token: string) => void;
  onRememberCaret: () => void;
};

export function MailPlaceholderPill({
  token,
  onInsert,
  onRememberCaret,
}: MailPlaceholderPillProps) {
  const startDrag = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(MAIL_PLACEHOLDER_DRAG, token);
    event.dataTransfer.setData('text/plain', `{{${token}}}`);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Button
      type="button"
      variant="ghost"
      draggable
      className={cn(
        mailPillClassName,
        'cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing'
      )}
      onDragStart={startDrag}
      onPointerDown={onRememberCaret}
      onClick={() => onInsert(token)}
    >
      {token}
    </Button>
  );
}
