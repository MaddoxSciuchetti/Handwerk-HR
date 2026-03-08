import { useQuery } from '@tanstack/react-query';
import { useGetWorkerHistory } from '../../hooks/useGetWorkerHistory';

import { userQueries } from '@/query-options/queries/shared.queries';
import { STATUS_MAP } from '../../utils/selectOptionTernary';

type HistoryContentProps = {
  id_original: number;
};

const HistoryContent = ({ id_original }: HistoryContentProps) => {
  const { historyData } = useGetWorkerHistory(id_original);
  const { data } = useQuery(userQueries.getFoto());

  return (
    <>
      {historyData?.length === 0 ? (
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
                    <img className="ml-1 w-5 h-5 " src={data} />
                  </div>
                  Status: {''}
                  {STATUS_MAP[item.status ?? '']?.label ?? 'Kein Status'}
                  <p>Kommentar: {item.edit} </p>
                </div>
              </div>
            </>
          );
        })
      )}
    </>
  );
};

export default HistoryContent;
