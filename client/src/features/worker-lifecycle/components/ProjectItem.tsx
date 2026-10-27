import { TableCell, TableRow } from '@/components/ui/table';
import { RowSelectButton } from '@/features/all-tasks/components/ui/RowSelectButton';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import { EngagementType, WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';
import { getWorkerIssueCount } from '../utils/workerHealth.utils';
import { EngagementProgressPicker } from './ui/EngagementProgressPicker';
import EngagementTypeSwitch from './EngagementTypeSwitch';
import {
  ResponsibleUserPicker,
  type ResponsibleUserOption,
} from './ResponsibleUserPicker';

export type WorkerSelection = {
  engagementNumber: string;
  engagementTitle: string;
  engagementId: string;
  type: EngagementType;
};

type ProjectItemSharedProps = {
  worker: WorkerRecord;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
};

type ProjectItemProps = ProjectItemSharedProps &
  (
    | {
        variant?: 'lifecycle';
        isSelected: boolean;
        setLargeEditMode: Dispatch<SetStateAction<boolean>>;
        setEditModeData: Dispatch<SetStateAction<WorkerSelection[]>>;
        onTypeChange: (type: EngagementType) => void;
        isChangingType: boolean;
        responsibleUsers: ResponsibleUserOption[];
        onResponsibleChange: (userId: string) => void;
        isChangingResponsible: boolean;
      }
    | {
        variant: 'team';
        marked?: boolean;
      }
  );

function ProjectItem(props: ProjectItemProps) {
  const { worker, gotopage } = props;
  const isTeam = props.variant === 'team';
  const form_type = getFirstFormType(worker);
  const fullname = `${worker.firstName} ${worker.lastName}`;

  const toggleSelection = (e: MouseEvent) => {
    if (props.variant === 'team') return;
    e.stopPropagation();
    e.preventDefault();
    props.setLargeEditMode(true);
    props.setEditModeData((prev) =>
      prev.some((item) => item.engagementNumber === worker.id)
        ? prev.filter((item) => item.engagementNumber !== worker.id)
        : [
            ...prev,
            {
              engagementNumber: worker.id,
              engagementTitle: fullname,
              engagementId: worker.engagements[0].id,
              type: worker.engagements[0].type,
            },
          ]
    );
  };

  const issueCount = getWorkerIssueCount(worker);

  return (
    <TableRow
      className="group relative cursor-pointer border-0 hover:bg-transparent"
      onClick={(event) => {
        const target = event.target;
        if (
          !(target instanceof Element) ||
          !event.currentTarget.contains(target) ||
          target.closest(
            'button, a, input, select, textarea, [role="button"], [role="checkbox"], [role="combobox"], [data-row-select]'
          )
        ) {
          return;
        }
        gotopage(worker.id, form_type, fullname);
      }}
    >
      <TableCell
        className={cn(
          'relative font-medium transition-colors group-hover:bg-muted/50',
          isTeam
            ? 'rounded-xl px-6 group-hover:rounded-xl'
            : 'pl-10 pr-2 group-hover:rounded-l-xl',
          !isTeam && props.isSelected && 'rounded-l-xl bg-muted/50'
        )}
      >
        {isTeam ? null : (
          <RowSelectButton
            isSelected={props.isSelected}
            onClick={toggleSelection}
          />
        )}
        <span
          className={cn('inline-flex items-center gap-2', !isTeam && 'pl-2')}
        >
          {worker.firstName}
          {isTeam && props.marked ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              Nächstes Jubiläum
            </span>
          ) : null}
        </span>
      </TableCell>
      {isTeam ? null : (
        <>
          <TableCell
            className={cn(
              'transition-colors group-hover:bg-muted/50',
              props.isSelected && 'bg-muted/50'
            )}
          >
            <EngagementTypeSwitch
              value={worker.engagements[0].type}
              workerName={fullname.trim()}
              disabled={props.isChangingType}
              onSwitch={props.onTypeChange}
            />
          </TableCell>
          <TableCell
            className={cn(
              'transition-colors group-hover:bg-muted/50',
              props.isSelected && 'bg-muted/50'
            )}
          >
            <ResponsibleUserPicker
              value={worker.engagements[0].responsibleUser}
              options={props.responsibleUsers}
              workerName={fullname.trim()}
              disabled={props.isChangingResponsible}
              onChange={props.onResponsibleChange}
            />
          </TableCell>
          <TableCell
            className={cn(
              'text-sm tabular-nums text-muted-foreground transition-colors group-hover:bg-muted/50',
              props.isSelected && 'bg-muted/50'
            )}
          >
            {worker.engagements[0].type === 'transfer' ? '—' : issueCount}
          </TableCell>
          <TableCell
            className={cn(
              'transition-colors group-hover:rounded-r-xl group-hover:bg-muted/50',
              props.isSelected && 'rounded-r-xl bg-muted/50'
            )}
          >
            {worker.engagements[0].type === 'transfer' ? (
              '—'
            ) : (
              <EngagementProgressPicker
                worker={worker}
                workerId={worker.id}
                engagementId={worker.engagements[0].id}
                status={worker.engagements[0].status}
              />
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

export default ProjectItem;
