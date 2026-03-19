import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import useEditDescription from '../hooks/useEditDescription';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import { editSchema } from '../schemas/taskForm.schema';
import { HandleEditSubmit } from '../types/taskForm.types';
import TaskForm from './shared/TaskForm';

type EditTemplateModalProps = {
  tab: 'ONBOARDING' | 'OFFBOARDING';
};
const EditTemplateModal = ({ tab }: EditTemplateModalProps) => {
  const { closeTask, modalState } = useTemplateModalContext();
  const { editDescriptionMutation } = useEditDescription();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HandleEditSubmit>({
    resolver: zodResolver(editSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<HandleEditSubmit> = (data) => {
    editDescriptionMutation(data);
    closeTask();
  };
  return (
    <SmallWrapper>
      <TaskForm
        template_header="Onboarding"
        templateHeaderAdjective="hinzufügen"
        buttonsaveText="New hinzufügen"
        register={register}
        submit={handleSubmit(onSubmit)}
        control={control}
        errors={errors}
        tab={tab}
        descriptionFormName="description"
        templateTypeName="template_type"
        formfieldName="form_field_id"
        formfieldValue={
          modalState.kind === 'open-edit' ? modalState.form_field_id : undefined
        }
        description={
          modalState.kind === 'open-edit' ? modalState.description : undefined
        }
      />
    </SmallWrapper>
  );

  // Fix: Show description in edit mode ()
  // make sure that the logic works
  // add everything into a context
};

export default EditTemplateModal;
