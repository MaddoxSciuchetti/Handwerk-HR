import { useTaskHistory } from '../../../../hooks/useTaskHistory';

import { cn } from '@/lib/trycatch';
import { StatusIcon } from '../../../../consts/status.consts';
import { STATUS_MAP } from '../../../../utils/selectOptionTernary';
type HistoryContentProps = {
  workerId: string;
  id_original: string | number;
  omitCreationAudit?: boolean;
};

const HistoryContent = ({
  workerId,
  id_original,
  omitCreationAudit,
}: HistoryContentProps) => {
  const { historyData } = useTaskHistory(workerId, id_original, {
    omitCreationAudit,
  });

  return (
    <div className="pb-4">
      {historyData?.length === 0 ? (
        <p className="mt-5 text-muted-foreground">
          Es wurden noch keine Änderungen vorgenommen
        </p>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]" />

          <div className="space-y-4">
            {historyData?.map((entry) => {
              const status = STATUS_MAP[entry.status ?? ''] ?? {
                label: 'Kein Status',
                className:
                  'bg-[var(--status-error-bg)] text-[var(--status-error-foreground)]',
              };

              return (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-6 top-0.5">
                    <StatusIcon status={entry.status ?? 'offen'} />
                  </div>

                  <div className="bg-[var(--dropdown-surface)] rounded-lg p-3">
                    <div className="mb-2 flex items-center gap-2">
                      {entry.auth_user?.cloud_url && (
                        <img
                          src={entry.auth_user.cloud_url}
                          alt={entry.auth_user.email}
                          className="h-8 w-8 rounded-xl object-cover"
                        />
                      )}
                      <span className="text-sm text-foreground">
                        {entry.auth_user?.email ?? 'Unbekannt'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(entry.timestamp || 0).toLocaleDateString()}
                      </span>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    {entry.edit && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        &quot;{entry.edit}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryContent;
