import { Dialog, DialogContent } from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import useEditDescription from '../hooks/useEditDescription';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import { editSchema } from '../schemas/taskForm.schema';
import { HandleEditSubmit } from '../types/taskForm.types';
import TaskForm from './shared/TaskForm';

type EditTemplateModalProps = {};
const EditTemplateModal = ({}: EditTemplateModalProps) => {
  const { closeTask, modalState, tab } = useTemplateModalContext();
  const { editDescriptionMutation } = useEditDescription();
  const isModalStateEdit = modalState.kind === 'open-edit';
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HandleEditSubmit>({
    defaultValues: {
      form_field_id: isModalStateEdit ? modalState.form_field_id : undefined,
      template_type: isModalStateEdit ? tab : undefined,
    },
    resolver: zodResolver(editSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<HandleEditSubmit> = (data) => {
    editDescriptionMutation(data);
    closeTask();
  };
  return (
    <Dialog open onOpenChange={(next) => { if (!next) closeTask(); }}>
    <DialogContent className="min-h-60 max-h-60 overflow-y-auto">
      <TaskForm
        template_header={tab === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'}
        templateHeaderAdjective="editieren"
        buttonsaveText="Speichern"
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
        defaultOwner={modalState.kind === 'open-edit' ? modalState.owner : ''}
      />
    </DialogContent>
    </Dialog>
  );
};

export default EditTemplateModal;
