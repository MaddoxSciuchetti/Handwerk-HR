import { NewDescriptionField } from '@/types/api.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { templateMutations } from '../query-options/mutations/template.mutations';
import { addSchema } from '../schemas/taskForm.schema';
import { HandleAddSubmit } from '../types/taskForm.types';
import useTemplateModalContext from './useTemplateModalContext';

function useAddNewTask(tab: 'ONBOARDING' | 'OFFBOARDING') {
  const { closeTask } = useTemplateModalContext();

  const { mutate: handleAddSubmitMutation } = useMutation<
    NewDescriptionField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    }
  >(templateMutations.create());

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HandleAddSubmit>({
    defaultValues: {
      template_type: tab,
    },
    resolver: zodResolver(addSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<HandleAddSubmit> = (data) => {
    handleAddSubmitMutation(data as HandleAddSubmit, {
      onSuccess: () => {
        console.log('hello');
        closeTask();
        toast.success('the field has been added');
      },
      onError: (error) => {
        console.log(error);
        toast.success('the field could not be added');
      },
    });
  };
  return {
    register,
    handleSubmit,
    onSubmit,
    control,
    errors,
  };
}

export default useAddNewTask;
