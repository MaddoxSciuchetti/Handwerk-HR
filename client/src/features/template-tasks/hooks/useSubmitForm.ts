import { zodResolver } from '@hookform/resolvers/zod';
import { Dispatch, SetStateAction } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  AddDescriptionMutation,
  EditDescriptionMutation,
} from '../types/mutation.types';
import { HandleAddSubmit, HandleEditSubmit } from '../types/taskForm.types';

function useSubmitForm(
  mode: 'EDIT' | 'ADD' | undefined,
  schema: any,
  editDescriptionMutation: EditDescriptionMutation,
  handleAddSubmitMutation: AddDescriptionMutation,
  toggleModal: () => void,
  setModalState: Dispatch<
    SetStateAction<{
      selectedItem: {
        form_field_id: number | null | undefined;
        description: string | null | undefined;
        owner: string | null | undefined;
      } | null;
    }>
  >
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
      editDescriptionMutation(data as HandleEditSubmit, {
        onSuccess: () => {
          setModalState({ selectedItem: null });
          toggleModal();
        },
        onError: () => {
          toast.error('Etwas ist schief gelaufen');
        },
      });
    } else {
      handleAddSubmitMutation(data as HandleAddSubmit, {
        onSuccess: () => {
          toast.success('the field has been added');
          toggleModal();
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
