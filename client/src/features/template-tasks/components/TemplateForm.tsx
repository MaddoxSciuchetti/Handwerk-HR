import { Dispatch, SetStateAction } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

import { ErrorMessage } from '@hookform/error-message';
import { addSchema, editSchema } from '../schemas/taskForm.schema';

import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
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
  EmployeeData: EmployeeDataArray | undefined;
  template_type: 'OFFBOARDING' | 'ONBOARDING' | undefined;
  form_field_id: number | null | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const TemplateForm = ({
  editDescriptionMutation,
  handleAddSubmitMutation,
  selectedValue,
  description,
  setSelectedValue,
  EmployeeData,
  template_type,
  form_field_id,
  mode,
}: TemplateFormProps) => {
  const schema = mode === 'EDIT' ? editSchema : addSchema;

  const { register, handleSubmit, control, onSubmit, errors } = useSubmitForm(
    mode,
    schema,
    editDescriptionMutation,
    handleAddSubmitMutation
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      name="valuesform"
      className="flex flex-col items-start"
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
        className="w-xl mb-5 rounded-xl mt-5"
      />

      <ErrorMessage
        errors={errors}
        name={'description'}
        render={({ message }) => (
          <p className="text-red-400 text-sm mb-5">{message}</p>
        )}
      />
      <div className="flex flex-row gap-2">
        <OwnerSelect
          control={control}
          errors={errors}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
          EmployeeData={EmployeeData}
        />
        <Button
          type="submit"
          variant={'outline'}
          className="rounded-xl text-left justify-start cursor-pointer hover:bg-gray-200 w-71"
        >
          {mode === 'EDIT' ? 'Speichern ' : 'Neue Beschreibung hinzufügen'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
