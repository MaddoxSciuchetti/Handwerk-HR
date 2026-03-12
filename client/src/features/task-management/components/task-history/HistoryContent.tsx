import { useGetWorkerHistory } from '../../hooks/useGetWorkerHistory';

import { cn } from '@/lib/trycatch';
import { StatusIcon } from '../../consts/status.consts';
import { STATUS_MAP } from '../../utils/selectOptionTernary';
type HistoryContentProps = {
  id_original: number;
};

const HistoryContent = ({ id_original }: HistoryContentProps) => {
  const { historyData } = useGetWorkerHistory(id_original);

  if (historyData?.length === 0)
    return (
      <p className="mt-5 text-muted-foreground">
        Es wurden noch keine Änderungen vorgenommen
      </p>
    );

  return (
    <>
      <div className="px-4 pb-4">
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-(--border)" />

          <div className="space-y-4">
            {historyData?.map((entry) => {
              console.log(entry.status);
              const status = STATUS_MAP[entry.status ?? ''] ?? {
                label: 'Kein Status',
                className:
                  'bg-(--status-error-bg) text-(--status-error-foreground)',
              };

              return (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-6 top-0.5">
                    <StatusIcon status={entry.status ?? 'offen'} />
                  </div>

                  <div className="bg-(--dropdown-surface) rounded-lg p-3">
                    <div className="flex itemsd-center justify-between mb-1">
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
                    <p className="text-sm text-foreground">
                      Nutzer: {entry.auth_user?.email ?? 'Unbekannt'}
                    </p>
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
      </div>
    </>
  );
};

export default HistoryContent;
