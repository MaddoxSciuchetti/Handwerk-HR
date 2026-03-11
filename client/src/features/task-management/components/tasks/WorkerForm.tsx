import { SubmitEvent } from 'react';
import TaskHistory from '../task-history/TaskHistory';
import StatusBadgeBar from './StatusBadgeBar';
import WorkerFormHeader from './WorkerFormHeader';

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
  onEdit,
  is_substitute,
}: FormProps) {
  return (
    <div className="justify-center items-center w-full mt-10">
      <div className="flex flex-col gap-5">
        <WorkerFormHeader
          description={description}
          onEdit={() =>
            onEdit(
              id_original,
              description,
              editcomment,
              select_option,
              form_field_id
            )
          }
        />
        <StatusBadgeBar
          is_substitute={is_substitute}
          substituteOwner={substituteOwner}
          officialOwner={officialOwner}
          select_option={select_option}
          editcomment={editcomment}
        />
        <TaskHistory id_original={id_original} />
      </div>
    </div>
  );
}

export default WorkerForm;
