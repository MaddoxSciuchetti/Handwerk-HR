import ErrorAlert from '@/components/alerts/ErrorAlert';
import type {
  DescriptionField,
  DescriptionFieldResponse,
} from '@/types/api.types';
import type { SubmitEvent } from 'react';
import WorkerForm from './WorkerForm';

interface WorkerTasksProps {
  displayData: DescriptionField[];
  data: DescriptionFieldResponse | undefined;
  openEditModal: (
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number
  ) => Promise<void>;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
}

const WorkerTasks = ({
  displayData,
  data,
  openEditModal,
  handleSubmit,
}: WorkerTasksProps) => {
  if (!data) return <ErrorAlert />;
  return (
    <>
      {displayData.map((field: DescriptionField, index: number) => (
        <WorkerForm
          key={index}
          id_original={field.id}
          editcomment={field.edit}
          select_option={field.status}
          description={field.description}
          officialOwner={field.officialOwner}
          substituteOwner={field.substituteOwner}
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
        />
      ))}
    </>
  );
};

export default WorkerTasks;
