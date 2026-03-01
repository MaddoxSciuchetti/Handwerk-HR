import ErrorAlert from '@/components/alerts/ErrorAlert';
import { SubmitEvent } from 'react';
import { api_Response, form_field } from '../types/index.type';
import WorkerForm from './WorkerForm';

type WorkerTasksProps = {
  displayData: form_field[];
  data: api_Response | undefined;
  openEditModal: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number
  ) => Promise<void>;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

const WorkerTasks = ({
  displayData,
  data,
  openEditModal,
  handleSubmit,
}: WorkerTasksProps) => {
  if (!data) return <ErrorAlert />;
  return (
    <>
      {displayData.map((field: form_field, index: number) => (
        <WorkerForm
          key={index}
          id_original={field.id}
          editcomment={field.edit}
          select_option={field.status}
          description={field.description}
          officialOwner={field.officialOwner}
          substituteOwner={field.substituteOwner}
          owner_id={field.owner_id}
          is_substitute={field.is_substitute}
          form_field_id={data.form.id}
          onEdit={(id, description, editcomment, select_option, form_field) =>
            openEditModal(
              id,
              description,
              editcomment,
              select_option,
              form_field
            )
          }
          handleSubmit={handleSubmit}
          // historyResult={historyResult}
        />
      ))}
    </>
  );
};

export default WorkerTasks;
