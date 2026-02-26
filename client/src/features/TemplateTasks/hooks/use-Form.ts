import { HandleAddSubmit, HandleEditSubmit } from '../types/taskForm.types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TAddDescription, TEditDesription } from '../types/mutation.types';
import { error } from 'node:console';

function useSubmitForm(
  mode: 'EDIT' | 'ADD' | undefined,
  schema: any,
  editDescriptionMutation: TEditDesription,
  handleAddSubmitMutation: TAddDescription
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
