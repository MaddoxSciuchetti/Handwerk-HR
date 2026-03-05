import StatusBadge from './StatusBadge';

type StatusBadgeBarProps = {
  is_substitute: boolean;
  substituteOwner: string;
  officialOwner: string;
  status: { label: string; className: string };
  editcomment: string;
};

const StatusBadgeBar = ({
  is_substitute,
  substituteOwner,
  officialOwner,
  status,
  editcomment,
}: StatusBadgeBarProps) => {
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
            className={'bg-gray-200'}
          />
        )}
        <StatusBadge
          badgeDescription={status.label}
          tooltip="Status"
          className={status.className}
        />
        <StatusBadge
          badgeDescription={'Letzter Kommentar'}
          tooltip={editcomment === '' ? 'Kein Kommentar' : editcomment}
        />
      </div>
    </>
  );
};

export default StatusBadgeBar;
