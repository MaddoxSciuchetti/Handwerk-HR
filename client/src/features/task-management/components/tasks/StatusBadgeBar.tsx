import { useEffect, useState } from 'react';
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
    className: 'bg-red-200',
  };

  const [editcommentValue, setEditComment] = useState<string>(
    editcomment || ''
  );

  useEffect(() => {
    setEditComment(editcomment || '');
  }, [editcomment]);

  return (
    <>
      <div className="flex gap-2 ">
        {is_substitute ? (
          <div className="flex flex-row gap-1">
            <StatusBadge
              badgeDescription={substituteOwner}
              tooltip={'Ersatz'}
              className="bg-orange-200"
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
          tooltip={editcommentValue === '' ? 'Kein Kommentar' : editcomment}
        />
      </div>
    </>
  );
};

export default StatusBadgeBar;
