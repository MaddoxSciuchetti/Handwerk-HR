import { useGetWorkerHistory } from '../../hooks/useGetWorkerHistory';

import { cn } from '@/lib/trycatch';
import { STATUS_MAP } from '../../utils/selectOptionTernary';
type HistoryContentProps = {
  id_original: number;
};

const HistoryContent = ({ id_original }: HistoryContentProps) => {
  const { historyData } = useGetWorkerHistory(id_original);

  return (
    <>
      {/* {historyData?.length === 0 ? (
        <p className="mt-5">Es wurden noch keine Änderungen vorgenommen</p>
      ) : (
        (historyData || []).map((item) => {
          return (
            <>
              <div key={item.id} className="flex flex-col gap-2 mt-2">
                <div className=" flex flex-col">
                  <p className="text-left font-bold">
                    {new Date(item.timestamp || 0).toLocaleDateString()}
                  </p>
                  <div className="flex">
                    <p>Nutzer: {item.auth_user?.email}</p>
                    <div className="flex bg-white rounded-full w-5 h-5 overflow-hidden ml-2 items-center justify-center">
                      <img className="" src={data} />
                    </div>
                  </div>
                  Status: {''}
                  {STATUS_MAP[item.status ?? '']?.label ?? 'Kein Status'}
                  <p>Kommentar: {item.edit} </p>
                </div>
              </div>

              <div className="space-y-4"> */}

      {historyData?.length === 0 ? (
        <p className="mt-5 text-muted-foreground">
          Es wurden noch keine Änderungen vorgenommen
        </p>
      ) : (
        <div className="space-y-4">
          {(historyData || []).map((entry) => {
            const status = STATUS_MAP[entry.status ?? ''] ?? {
              label: 'Kein Status',
              className:
                'bg-(--status-error-bg) text-(--status-error-foreground)',
            };

            return (
              <div key={entry.id} className="relative">
                <div className="mb-1 flex items-center justify-between gap-3">
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
            );
          })}
        </div>
      )}
    </>
  );
};

export default HistoryContent;
