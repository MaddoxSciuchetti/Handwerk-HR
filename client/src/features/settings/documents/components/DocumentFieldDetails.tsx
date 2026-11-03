import {
  cloneElement,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover';

type DocumentFieldDetailsProps = {
  fieldKey: string;
  label: string;
  useToday?: boolean;
  onUseTodayChange?: (checked: boolean) => void;
  onLabelChange?: (label: string) => void;
  onKeyChange?: (key: string) => void;
  onRemove?: () => void;
  children: ReactElement<{ onMouseDownCapture?: (event: MouseEvent) => void }>;
};

function sanitizeFieldKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 120);
}

export function DocumentFieldDetails({
  fieldKey,
  label,
  children,
  useToday,
  onUseTodayChange,
  onLabelChange,
  onKeyChange,
  onRemove,
}: DocumentFieldDetailsProps) {
  const [open, setOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftKey, setDraftKey] = useState(fieldKey);
  const editable = Boolean(onLabelChange || onKeyChange || onRemove);

  const [draftSync, setDraftSync] = useState({ open, label, fieldKey });
  if (
    open &&
    (draftSync.open !== open ||
      draftSync.label !== label ||
      draftSync.fieldKey !== fieldKey)
  ) {
    setDraftSync({ open, label, fieldKey });
    setDraftLabel(label);
    setDraftKey(fieldKey);
  } else if (
    draftSync.open !== open ||
    draftSync.label !== label ||
    draftSync.fieldKey !== fieldKey
  ) {
    setDraftSync({ open, label, fieldKey });
  }

  const field = cloneElement(children, {
    onMouseDownCapture: (event: MouseEvent) => {
      event.preventDefault();
      setOpen((current) => {
        const nextOpen = !current;
        if (nextOpen) {
          setDraftLabel(label);
          setDraftKey(fieldKey);
        }
        return nextOpen;
      });
      children.props.onMouseDownCapture?.(event);
    },
  });

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    const nextLabel = draftLabel.trim();
    const nextKey = sanitizeFieldKey(draftKey);
    if (onLabelChange && nextLabel && nextLabel !== label)
      onLabelChange(nextLabel);
    if (onKeyChange && nextKey && nextKey !== fieldKey) onKeyChange(nextKey);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{field}</PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-72"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <PopoverHeader>
          <PopoverTitle>
            {editable ? 'Feld bearbeiten' : 'Gespeicherter Wert'}
          </PopoverTitle>
          {!editable && label ? (
            <PopoverDescription>{label}</PopoverDescription>
          ) : null}
        </PopoverHeader>
        {editable ? (
          <form className="flex flex-col gap-3" onSubmit={save}>
            {onLabelChange ? (
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Bezeichnung
                <Input
                  aria-label="Feldbezeichnung"
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  className="h-8 text-sm text-foreground"
                  maxLength={400}
                />
              </label>
            ) : null}
            {onKeyChange ? (
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Schlüssel
                <Input
                  aria-label="Feldschlüssel"
                  value={draftKey}
                  onChange={(event) =>
                    setDraftKey(sanitizeFieldKey(event.target.value))
                  }
                  className="h-8 font-mono text-sm text-foreground"
                  maxLength={120}
                />
                <span>
                  Gleicher Schlüssel = gemeinsamer Wert. Ein neuer Schlüssel
                  macht dieses Feld unabhängig.
                </span>
              </label>
            ) : (
              <p className="font-mono text-sm break-all">{fieldKey}</p>
            )}
            {onUseTodayChange ? (
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={useToday}
                    onChange={(event) =>
                      onUseTodayChange(event.target.checked)
                    }
                  />
                  Immer aktuelles Datum verwenden
                </label>
                <p className="text-xs text-muted-foreground">
                  Wird bei Verwendung des Dokuments automatisch ausgefüllt.
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {onLabelChange || onKeyChange ? (
                <Button type="submit" size="sm">
                  Übernehmen
                </Button>
              ) : null}
              {onRemove ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setOpen(false);
                    onRemove();
                  }}
                >
                  Feld entfernen
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <>
            <p className="font-mono text-sm break-all">{fieldKey}</p>
            {onUseTodayChange ? (
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={useToday}
                    onChange={(event) =>
                      onUseTodayChange(event.target.checked)
                    }
                  />
                  Immer aktuelles Datum verwenden
                </label>
                <p className="text-xs text-muted-foreground">
                  Wird bei Verwendung des Dokuments automatisch ausgefüllt.
                </p>
              </div>
            ) : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
