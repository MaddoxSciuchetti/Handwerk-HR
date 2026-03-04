import 'react';

import { useGetWorkerHistory } from '@/features/task-management/hooks/use-getWorkerHistory';
import { useQuery } from '@tanstack/react-query';
import { SubmitEvent } from 'react';
import { workerQueries } from '../../query-options/query.options';
import TaskHistory from '../task-history/TaskHistory';
import StatusBadge from './StatusBadge';

interface FormProps {
  id_original: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  editcomment: string;
  select_option: string;
  form_field_id: number;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  onEdit: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number
  ) => void;
  is_substitute: boolean;
}

function WorkerForm({
  id_original,
  description,
  officialOwner,
  substituteOwner,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
  onEdit,
  is_substitute,
}: FormProps) {
  const { historyData } = useGetWorkerHistory(id_original);
  const { data } = useQuery(workerQueries.getFoto());

  // const [selectedValue, setSelectedValue] = useState<string>(
  //   select_option || ''
  // );
  // const [editcommentValue, setEditComment] = useState<string>(
  //   editcomment || ''
  // );

  // useEffect(() => {
  //   // setSelectedValue(select_option || '');
  //   // setEditComment(editcomment || '');
  // }, [select_option, editcomment]);

  return (
    <div className="justify-center items-center hover:scale-101 mt-10">
      <form
        className="flex flex-col  "
        onSubmit={handleSubmit}
        name="valuesform"
      >
        <input type="hidden" id="id" name="id" value={id_original} />
        <input type="hidden" name="select_option" value={select_option} />
        <input
          type="hidden"
          id="form_field_id"
          name="form_field_id"
          value={form_field_id}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-row mt-2">
            <p className="w-full underline">{description}</p>
            <img
              className="cursor-pointer"
              src="/assets/editReact.svg"
              alt="text"
              onClick={() =>
                onEdit(
                  id_original,
                  description,
                  editcomment,
                  select_option,
                  form_field_id
                )
              }
            />
          </div>

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
              />
            )}

            <div>
              <StatusBadge
                badgeDescription={
                  select_option === 'erledigt'
                    ? 'Erledigt'
                    : select_option === 'in_bearbeitung'
                      ? 'In Bearbeitung'
                      : select_option === 'offen'
                        ? 'Offen'
                        : 'Status'
                }
                tooltip="Status"
                className={
                  select_option === 'erledigt'
                    ? 'rounded-2xl bg-green-200 px-3 py-1 text-sm'
                    : select_option === 'offen'
                      ? 'rounded-2xl bg-red-200 px-3 py-1 text-sm'
                      : select_option === 'in_bearbeitung'
                        ? 'rounded-2xl bg-yellow-200 px-3 py-1 text-sm'
                        : ' rounded-2xl bg-red-200 px-3 py-1 text-sm'
                }
              />
            </div>
            <StatusBadge
              badgeDescription={'Letzer Kommentar'}
              tooltip={editcomment === '' ? 'Kein Kommentar' : editcomment}
            />
          </div>

          <TaskHistory historyData={historyData} data={data} />
        </div>
      </form>
    </div>
  );
}

export default WorkerForm;
