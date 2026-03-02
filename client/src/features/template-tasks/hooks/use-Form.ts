import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  AddDescriptionMutation,
  EditDescriptionMutation,
} from '../types/mutation.types';
import { HandleAddSubmit, HandleEditSubmit } from '../types/taskForm.types';

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

  const onSubmit: SubmitHandler<HandleAddSubmit | HandleEditSubmit> = (
    data
  ) => {
    if (mode === 'EDIT') {
      editDescriptionMutation(data as HandleEditSubmit);
    } else {
      handleAddSubmitMutation(data as HandleAddSubmit);
    }
  };

  return { register, handleSubmit, control, onSubmit, errors };
}

export default useSubmitForm;
