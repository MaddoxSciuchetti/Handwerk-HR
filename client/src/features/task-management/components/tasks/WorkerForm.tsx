import { Input } from '@/components/ui/input';
import { useGetWorkerHistory } from '@/features/task-management/hooks/use-getWorkerHistory';
import { useQuery } from '@tanstack/react-query';
import { SubmitEvent } from 'react';
import { workerQueries } from '../../query-options/query.options';
import { STATUS_MAP } from '../../utils/selectOptionTernary';
import TaskHistory from '../task-history/TaskHistory';
import StatusBadgeBar from './StatusBadgeBar';

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

  const status = STATUS_MAP[select_option] ?? {
    label: 'Status',
    className: 'bg-red-200',
  };

  return (
    <div className="justify-center items-center hover:scale-101 mt-10">
      <form
        className="flex flex-col  "
        onSubmit={handleSubmit}
        name="valuesform"
      >
        <Input type="hidden" id="id" name="id" value={id_original} />
        <Input type="hidden" name="select_option" value={select_option} />
        <Input
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
          <StatusBadgeBar
            is_substitute={is_substitute}
            substituteOwner={substituteOwner}
            officialOwner={officialOwner}
            status={status}
            editcomment={editcomment}
          />
          <TaskHistory historyData={historyData} data={data} />
        </div>
      </form>
    </div>
  );
}

export default WorkerForm;
