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
  ENGAGEMENT_PROGRESS_OPTIONS,
  engagementProgressLabel,
  type EngagementProgressValue,
} from '../../consts/engagement-progress.consts';
import { useQuickUpdateEngagementProgress } from '../../hooks/useQuickUpdateEngagementProgress';
import type { WorkerRecord } from '../../types/index.types';
import { getWorkerHealth } from '../../utils/workerHealth.utils';
import { EngagementProgressIcon } from './EngagementProgressIcons';

type EngagementProgressPickerProps = {
  worker: WorkerRecord;
  workerId: string;
  engagementId: string;
  status: EngagementProgressValue;
  className?: string;
};

export function EngagementProgressPicker({
  worker,
  workerId,
  engagementId,
  status,
  className,
}: EngagementProgressPickerProps) {
  const { mutate } = useQuickUpdateEngagementProgress();
  const health = getWorkerHealth(worker);
  const healthLabel =
    health.percentage !== null ? `${health.percentage}%` : '—';
  const phaseCompleted = worker.engagements.find(
    (engagement) => engagement.id === engagementId
  )?.taskPhaseCompleted;
  const displayStatus =
    status === 'cancelled' || phaseCompleted === undefined
      ? status
      : phaseCompleted
        ? 'completed'
        : status === 'completed'
          ? 'in_progress'
          : status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`Status: ${engagementProgressLabel(displayStatus)}. ${health.percentage ?? 0}% der Aufgaben erledigt. Zum Ändern klicken.`}
          className={cn(
            'h-7 gap-1.5 rounded-full border border-border bg-muted px-2.5 text-xs font-medium shadow-none hover:bg-muted focus-visible:border-border focus-visible:ring-0 aria-expanded:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <EngagementProgressIcon
            status={displayStatus}
            className="size-4 shrink-0"
          />
          <span className="tabular-nums text-foreground">{healthLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-44"
        onClick={(e) => e.stopPropagation()}
      >
        {ENGAGEMENT_PROGRESS_OPTIONS.map((option) => {
          const isSelected = option.value === displayStatus;

          return (
            <DropdownMenuItem
              key={option.value}
              aria-current={isSelected ? 'true' : undefined}
              className={cn('gap-2.5', isSelected && 'bg-accent/50')}
              onSelect={() => {
                if (!isSelected) {
                  mutate({
                    workerId,
                    engagementId,
                    status: option.value,
                  });
                }
              }}
            >
              <EngagementProgressIcon status={option.value} />
              <span className="flex-1">{option.label}</span>
              {isSelected ? (
                <Check
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
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
