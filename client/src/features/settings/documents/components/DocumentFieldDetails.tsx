import { cloneElement, useState, type MouseEvent, type ReactElement } from 'react';
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
  children: ReactElement<{ onMouseDownCapture?: (event: MouseEvent) => void }>;
};

export function DocumentFieldDetails({
  fieldKey,
  label,
  children,
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
      </PopoverContent>
    </Popover>
  );
}
