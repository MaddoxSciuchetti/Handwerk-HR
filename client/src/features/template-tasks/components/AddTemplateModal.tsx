import { Dialog, DialogContent } from '@/components/ui/dialog';
import useAddNewTask from '../hooks/useAddNewTask';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import TaskForm from './shared/TaskForm';

const AddTemplateModal = () => {
  const { tab, closeTask } = useTemplateModalContext();
  const { register, handleSubmit, control, errors, onSubmit } =
    useAddNewTask(tab);
  return (
    <>
      <Dialog open onOpenChange={(next) => { if (!next) closeTask(); }}>
      <DialogContent className="min-h-60 max-h-60 overflow-y-auto">
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
      </DialogContent>
      </Dialog>
    </>
  );
};

export default AddTemplateModal;
