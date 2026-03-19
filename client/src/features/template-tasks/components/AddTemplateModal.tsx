import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import useAddNewTask from '../hooks/useAddNewTask';
import TaskForm from './shared/TaskForm';

type AddTemplateModalProps = {
  tab: 'ONBOARDING' | 'OFFBOARDING';
};

const AddTemplateModal = ({ tab }: AddTemplateModalProps) => {
  const { register, handleSubmit, control, errors, onSubmit } = useAddNewTask();

  return (
    <>
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
        />
      </SmallWrapper>
    </>
  );
};

export default AddTemplateModal;
