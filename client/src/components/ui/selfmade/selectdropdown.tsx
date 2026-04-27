import { cn } from '@/lib/trycatch';
import { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type State = 'Default' | 'Open';
const DropdownStates: Record<State, string> = {
  Default: 'bg-transparent',
  Open: 'bg-transparent border-1 border-border-default',
};
type Size = 'sm' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'h-8',
  lg: 'h-9 w-60',
};

export type OptionsObjekt = {
  label: string;
  value: string;
  action?: () => void;
  subOptions?: OptionsObjekt[];
  icon?: LucideIcon;
};

type SelectDropdownProps<T extends string> = {
  state: State;
  size: Size;
  icon: LucideIcon;
  label?: string;
  options: OptionsObjekt[];
  setValue: (value: T) => void;
  value: string;
  onSubSelect?: (sub: OptionsObjekt, parent: OptionsObjekt) => void;
  /** Renders below options (e.g. compact toggle); receives `close` to dismiss the panel */
  panelFooter?: (ctx: { close: () => void }) => ReactNode;
};

export function SelectDropdown<T extends string>({
  state,
  size,
  icon: Icon,
  label,
  options,
  setValue,
  value,
  onSubSelect,
  panelFooter,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredValue(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const close = () => {
    setIsOpen(false);
    setHoveredValue(null);
  };

  const handleParentSelect = (option: OptionsObjekt) => {
    if (option.value === '__divider__') return;
    if (option.subOptions?.length) return;
    setValue(option.value as T);
    option.action?.();
    close();
  };

  const handleSubSelect = (sub: OptionsObjekt, parent: OptionsObjekt) => {
    onSubSelect?.(sub, parent);
    sub.action?.();
    close();
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex min-w-0 w-full max-w-full items-center rounded-lg border border-border px-3',
        DropdownStates[state],
        sizes[size]
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      <p className="typo-body-sm min-w-0 grow truncate text-foreground">
        {value || label}
      </p>
        <Icon
        className={cn(
          'h-6 w-6 text-muted-foreground transition-transform duration-200',
          isOpen ? 'rotate-90' : 'rotate-0'
        )}
      />
      {isOpen && (
        <div className="absolute top-full left-0 z-10 w-full min-w-0 max-w-full box-border rounded-xl border border-border bg-popover p-2 text-popover-foreground">
          {options.map((option) => {
            if (option.value === '__divider__') {
              return (
                <div
                  key={option.value}
                  className="my-1.5 border-t border-border"
                  aria-hidden
                />
              );
            }
            return (
              <DropdownOption
                key={option.value}
                option={option}
                isHovered={hoveredValue === option.value}
                onHover={() => setHoveredValue(option.value)}
                onSelect={() => handleParentSelect(option)}
                onSubSelect={(sub) => handleSubSelect(sub, option)}
              />
            );
          })}
          {panelFooter?.({ close })}
        </div>
      )}
    </div>
  );
}

type DropdownOptionProps = {
  option: OptionsObjekt;
  isHovered: boolean;
  onHover: () => void;
  onSelect: () => void;
  onSubSelect: (sub: OptionsObjekt) => void;
};

function DropdownOption({
  option,
  isHovered,
  onHover,
  onSelect,
  onSubSelect,
}: DropdownOptionProps) {
  const hasSubOptions = !!option.subOptions?.length;
  const showSubMenu = hasSubOptions && isHovered;
  const OptionIcon = option.icon;

  return (
    <div className="relative" onMouseEnter={onHover}>
      <div
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {OptionIcon ? (
          <OptionIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left typo-body-sm">
          {option.label}
        </span>
      </div>
      {showSubMenu && (
        <DropdownSubMenu
          subOptions={option.subOptions!}
          onSelect={onSubSelect}
        />
      )}
    </div>
  );
}

type DropdownSubMenuProps = {
  subOptions: OptionsObjekt[];
  onSelect: (sub: OptionsObjekt) => void;
};

function DropdownSubMenu({ subOptions, onSelect }: DropdownSubMenuProps) {
  return (
    <div
      className="absolute top-0 right-full z-20 mr-2 min-w-40 rounded-xl border border-border bg-popover p-2 text-popover-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      {subOptions.map((sub) => (
        <div
          key={sub.value}
          className="cursor-pointer rounded-md px-2 py-1 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sub);
          }}
        >
          {sub.label}
        </div>
      ))}
    </div>
  );
}
