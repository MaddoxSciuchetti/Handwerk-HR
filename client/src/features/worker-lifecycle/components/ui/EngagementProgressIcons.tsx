import {
  TaskStatusCancelledIcon,
  TaskStatusDoneIcon,
  TaskStatusInProgressIcon,
  TaskStatusOpenIcon,
} from '@/features/all-tasks/components/ui/TaskStatusIcons';
import type { IssueStatusValue } from '@/features/all-tasks/consts/issue-status.consts';
import type { ComponentType, SVGProps } from 'react';
import type { EngagementProgressValue } from '../../consts/engagement-progress.consts';

type IconProps = SVGProps<SVGSVGElement>;

const ENGAGEMENT_TO_ISSUE_ICON: Record<
  EngagementProgressValue,
  IssueStatusValue
> = {
  pending: 'open',
  in_progress: 'in_progress',
  completed: 'done',
  cancelled: 'cancelled',
};

const ENGAGEMENT_ICON_MAP = {
  pending: TaskStatusOpenIcon,
  in_progress: TaskStatusInProgressIcon,
  completed: TaskStatusDoneIcon,
  cancelled: TaskStatusCancelledIcon,
} as const satisfies Record<
  EngagementProgressValue,
  ComponentType<IconProps>
>;

export function EngagementProgressIcon({
  status,
  className,
  ...props
}: IconProps & { status: EngagementProgressValue }) {
  const Icon = ENGAGEMENT_ICON_MAP[status];
  return <Icon className={className} {...props} />;
}

export function engagementProgressToIssueStatus(
  status: EngagementProgressValue
): IssueStatusValue {
  return ENGAGEMENT_TO_ISSUE_ICON[status];
}
