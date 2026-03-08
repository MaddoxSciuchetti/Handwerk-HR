import { Dispatch, SetStateAction } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

import { ErrorMessage } from '@hookform/error-message';
import { addSchema, editSchema } from '../schemas/taskForm.schema';

import useSubmitForm from '../hooks/useSubmitForm';
import {
  AddDescriptionMutation,
  EditDescriptionMutation,
} from '../types/mutation.types';
import OwnerSelect from './OwnerSelect';

type TemplateFormProps = {
  editDescriptionMutation: EditDescriptionMutation;
  handleAddSubmitMutation: AddDescriptionMutation;
  selectedValue: string;
  description: string | null | undefined;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  template_type: 'OFFBOARDING' | 'ONBOARDING' | undefined;
  form_field_id: number | null | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
  toggleModal: () => void;
  setModalState: Dispatch<
    SetStateAction<{
      selectedItem: {
        form_field_id: number | null | undefined;
        description: string | null | undefined;
        owner: string | null | undefined;
      } | null;
    }>
  >;
};

const TemplateForm = ({
  editDescriptionMutation,
  handleAddSubmitMutation,
  selectedValue,
  description,
  setSelectedValue,
  template_type,
  form_field_id,
  mode,
  toggleModal,
  setModalState,
}: TemplateFormProps) => {
  const schema = mode === 'EDIT' ? editSchema : addSchema;

  const { register, handleSubmit, control, onSubmit, errors } = useSubmitForm(
    mode,
    schema,
    editDescriptionMutation,
    handleAddSubmitMutation,
    toggleModal,
    setModalState
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      name="valuesform"
      className="flex w-full flex-col items-start"
    >
      {mode === 'EDIT' ? (
        `${template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Aufgabe bearbeiten`
      ) : (
        <p>
          Füge Aufgabe fürs {''}
          {template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} hinzu
        </p>
      )}

      <input
        {...register('template_type')}
        type="hidden"
        name="template_type"
        value={template_type}
      />
      {mode === 'EDIT' && (
        <input
          {...register('form_field_id', { valueAsNumber: true })}
          type="hidden"
          id="form_field_id"
          name="form_field_id"
          value={form_field_id || ''}
        />
      )}
      <Textarea
        {...register('description')}
        defaultValue={description || ''}
        id="description"
        name="description"
        className="mt-5 mb-5 w-full max-w-full rounded-xl"
      />

      <ErrorMessage
        errors={errors}
        name={'description'}
        render={({ message }) => (
          <p className="text-red-400 text-sm mb-5">{message}</p>
        )}
      />
      <div className="flex w-full flex-col gap-2">
        <OwnerSelect
          control={control}
          errors={errors}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
        <Button
          type="submit"
          variant={'outline'}
          className="w-full cursor-pointer justify-start rounded-xl text-left hover:bg-gray-200"
        >
          {mode === 'EDIT' ? 'Speichern ' : 'Neue Beschreibung hinzufügen'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
