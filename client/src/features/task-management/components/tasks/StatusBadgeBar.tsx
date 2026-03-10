import { STATUS_MAP } from '../../utils/selectOptionTernary';
import StatusBadge from './StatusBadge';

type StatusBadgeBarProps = {
  is_substitute: boolean;
  substituteOwner: string;
  officialOwner: string;
  editcomment: string;
  select_option: string;
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
      <div className="flex gap-2 ">
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
            className={'bg-muted text-muted-foreground'}
          />
        )}
        <StatusBadge
          badgeDescription={status.label}
          tooltip="Status"
          className={status.className}
        />
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
