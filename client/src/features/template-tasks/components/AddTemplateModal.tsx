import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import useAddNewTask from '../hooks/useAddNewTask';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import TaskForm from './shared/TaskForm';

const AddTemplateModal = () => {
  const { tab } = useTemplateModalContext();
  const { register, handleSubmit, control, errors, onSubmit } =
    useAddNewTask(tab);
  return (
    <>
      <SmallWrapper className="min-h-60 max-h-60">
        <TaskForm
          template_header={tab === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'}
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
