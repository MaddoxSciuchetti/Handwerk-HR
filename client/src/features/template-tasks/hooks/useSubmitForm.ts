import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  AddDescriptionMutation,
  EditDescriptionMutation,
} from '../types/mutation.types';
import { HandleAddSubmit, HandleEditSubmit } from '../types/taskForm.types';
import useTemplateModalContext from './useTemplateModalContext';

function useSubmitForm(
  mode: 'EDIT' | 'ADD' | undefined,
  schema: any,
  editDescriptionMutation: EditDescriptionMutation,
  handleAddSubmitMutation: AddDescriptionMutation
) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HandleAddSubmit | HandleEditSubmit>({
    resolver: zodResolver(schema),
    criteriaMode: 'all',
  });

  const { closeTask } = useTemplateModalContext();

  const onSubmit: SubmitHandler<HandleAddSubmit | HandleEditSubmit> = (
    data
  ) => {
    if (mode === 'EDIT') {
      editDescriptionMutation(data as HandleEditSubmit, {
        onSuccess: () => {
          closeTask();
        },
        onError: () => {
          toast.error('Etwas ist schief gelaufen');
        },
      });
    } else {
      handleAddSubmitMutation(data as HandleAddSubmit, {
        onSuccess: () => {
          toast.success('the field has been added');
        },
        onError: () => {
          toast.error('the field could not be added');
        },
      });
    }
  };

  return { register, handleSubmit, control, onSubmit, errors };
}

export default useSubmitForm;
