import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  ISSUE_STATUS_OPTIONS,
  issueStatusLabel,
  type IssueStatusValue,
} from '../../consts/issue-status.consts';
import { useQuickUpdateTaskStatus } from '../../hooks/useQuickUpdateTaskStatus';
import { TaskStatusIcon } from './TaskStatusIcons';

function blockClickOutsideMenu() {
  const block = (event: Event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('[data-slot="dropdown-menu-item"], [role="menuitem"]')
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener('click', block, { capture: true, once: true });
  window.setTimeout(() => {
    document.removeEventListener('click', block, { capture: true });
  }, 400);
}

type TaskStatusPickerProps = {
  taskId: string;
  status: IssueStatusValue;
  className?: string;
};

export function TaskStatusPicker({
  taskId,
  status,
  className,
}: TaskStatusPickerProps) {
  const { mutate } = useQuickUpdateTaskStatus();
  const [open, setOpen] = useState(false);
  const chosen = useRef<IssueStatusValue | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openedWithPointer = useRef(false);

  const choose = (next: IssueStatusValue) => {
    blockClickOutsideMenu();
    if (chosen.current === next) {
      setOpen(false);
      return;
    }
    chosen.current = next;
    if (next !== status) mutate({ taskId, status: next });
    setOpen(false);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (next) chosen.current = null;
        setOpen(next);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Status: ${issueStatusLabel(status)}. Zum Ändern klicken.`}
          className={cn(
            'rounded-full bg-transparent shadow-none hover:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent dark:aria-expanded:bg-transparent',
            className
          )}
          onPointerDown={(event) => {
            openedWithPointer.current =
              event.pointerType === 'mouse' ||
              event.pointerType === 'pen' ||
              event.pointerType === 'touch';
          }}
          onKeyDown={() => {
            openedWithPointer.current = false;
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <TaskStatusIcon status={status} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-44"
        onClick={(e) => e.stopPropagation()}
        onCloseAutoFocus={(event) => {
          if (!openedWithPointer.current) return;
          event.preventDefault();
          triggerRef.current?.blur();
        }}
      >
        {ISSUE_STATUS_OPTIONS.map((option) => {
          const isSelected = option.value === status;

          return (
            <DropdownMenuItem
              key={option.value}
              aria-current={isSelected ? 'true' : undefined}
              className={cn('gap-2.5', isSelected && 'bg-accent/50')}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                choose(option.value);
              }}
              onSelect={() => {
                choose(option.value);
              }}
            >
              <TaskStatusIcon status={option.value} />
              <span className="flex-1">{option.label}</span>
              {isSelected ? (
                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
