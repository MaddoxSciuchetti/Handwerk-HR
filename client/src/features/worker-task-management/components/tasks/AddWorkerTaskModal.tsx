import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import TaskForm from '@/features/template-tasks/components/shared/TaskForm';
import { addSchema } from '@/features/template-tasks/schemas/taskForm.schema';
import { HandleAddSubmit } from '@/features/template-tasks/types/taskForm.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { workerMutations } from '../../query-options/mutations/worker.mutations';

type AddWorkerTaskModalProps = {
  workerId: string;
  onClose: () => void;
};

const AddWorkerTaskModal = ({ workerId, onClose }: AddWorkerTaskModalProps) => {
  const { mutate: createWorkerTaskMutation } = useMutation(
    workerMutations.createWorkerTask(workerId)
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HandleAddSubmit>({
    resolver: zodResolver(addSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<HandleAddSubmit> = (data) => {
    createWorkerTaskMutation(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <SmallWrapper className="min-h-60 max-h-60">
      <TaskForm
        templateHeaderAdjective="hinzufügen"
        buttonsaveText="New hinzufügen"
        register={register}
        submit={handleSubmit(onSubmit)}
        control={control}
        errors={errors}
        descriptionFormName="description"
        templateTypeName="template_type"
      />
    </SmallWrapper>
  );
};

export default AddWorkerTaskModal;
