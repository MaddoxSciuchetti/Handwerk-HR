import {
  cloneElement,
  useState,
  type MouseEvent,
  type ReactElement,
} from 'react';
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
  children: ReactElement<{ onMouseDownCapture?: (event: MouseEvent) => void }>;
};

export function DocumentFieldDetails({
  fieldKey,
  label,
  children,
  useToday,
  onUseTodayChange,
}: DocumentFieldDetailsProps) {
  const [open, setOpen] = useState(false);
  const field = cloneElement(children, {
    onMouseDownCapture: (event: MouseEvent) => {
      event.preventDefault();
      setOpen((current) => !current);
      children.props.onMouseDownCapture?.(event);
    },
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{field}</PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-64"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <PopoverHeader>
          <PopoverTitle>Gespeicherter Wert</PopoverTitle>
          {label ? <PopoverDescription>{label}</PopoverDescription> : null}
        </PopoverHeader>
        <p className="font-mono text-sm break-all">{fieldKey}</p>
        {onUseTodayChange ? (
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={useToday}
                onChange={(event) => onUseTodayChange(event.target.checked)}
              />
              Immer aktuelles Datum verwenden
            </label>
            <p className="text-xs text-muted-foreground">
              Wird bei Verwendung des Dokuments automatisch ausgefüllt.
            </p>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
