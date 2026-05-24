import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  ISSUE_STATUS_OPTIONS,
  issueStatusLabel,
  type IssueStatusValue,
} from '../../consts/issue-status.consts';
import { useQuickUpdateTaskStatus } from '../../hooks/useQuickUpdateTaskStatus';
import { TaskStatusIcon } from './TaskStatusIcons';

type TaskStatusPickerProps = {
  taskId: string;
  status: IssueStatusValue;
  workerId?: string;
  className?: string;
};

export function TaskStatusPicker({
  taskId,
  status,
  workerId,
  className,
}: TaskStatusPickerProps) {
  const { mutate } = useQuickUpdateTaskStatus(workerId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Status: ${issueStatusLabel(status)}. Zum Ändern klicken.`}
          className={cn('rounded-full hover:bg-muted/80', className)}
          onClick={(e) => e.stopPropagation()}
        >
          <TaskStatusIcon status={status} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-44"
        onClick={(e) => e.stopPropagation()}
      >
        {ISSUE_STATUS_OPTIONS.map((option) => {
          const isSelected = option.value === status;

          return (
            <DropdownMenuItem
              key={option.value}
              aria-current={isSelected ? 'true' : undefined}
              className={cn('gap-2.5', isSelected && 'bg-accent/50')}
              onSelect={() => {
                if (!isSelected) {
                  mutate({ taskId, status: option.value });
                }
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
