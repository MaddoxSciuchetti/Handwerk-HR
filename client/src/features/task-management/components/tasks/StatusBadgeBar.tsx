import { STATUS_MAP, TaskStatus } from '../../utils/selectOptionTernary';
import StatusBadge from './StatusBadge';

type StatusBadgeBarProps = {
  is_substitute: boolean;
  substituteOwner: string;
  officialOwner: string;
  editcomment: string;
  select_option: TaskStatus;
};

const StatusBadgeBar = ({
  is_substitute,
  substituteOwner,
  officialOwner,
  editcomment,
  select_option,
}: StatusBadgeBarProps) => {
  const status = STATUS_MAP[select_option] ?? {
    label: 'Status',
    className: 'bg-(--status-error-bg) text-(--status-error-foreground)',
  };

  const editCommentValue = editcomment || '';

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          aria-label={`Status: ${status.label}`}
          title={status.label}
          className={`h-4 w-4 shrink-0 rounded-full ${status.className}`}
        />
        {is_substitute ? (
          <div className="flex flex-row gap-1">
            <StatusBadge
              badgeDescription={substituteOwner}
              tooltip={'Ersatz'}
              className="bg-(--status-warning-bg) text-(--status-warning-foreground)"
            />
            <StatusBadge
              badgeDescription={officialOwner}
              tooltip={'Verantwortlich'}
            />
          </div>
        ) : (
          <StatusBadge
            badgeDescription={officialOwner}
            tooltip={'Verantwortlich'}
            className={'bg-(--muted) text-(--muted-foreground)'}
          />
        )}
        <StatusBadge
          badgeDescription={'Letzter Kommentar'}
          tooltip={
            editCommentValue === '' ? 'Kein Kommentar' : editCommentValue
          }
        />
      </div>
    </>
  );
};

export default StatusBadgeBar;
