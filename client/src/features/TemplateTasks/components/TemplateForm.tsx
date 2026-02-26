import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Dispatch, SetStateAction } from 'react';
import { TEmployeeResponse } from '@/zod-schemas/schema';

import { ErrorMessage } from '@hookform/error-message';
import { addSchema, editSchema } from '../schemas/taskForm.schema';

import { TAddDescription, TEditDesription } from '../types/mutation.types';
import useSubmitForm from '../hooks/use-Form';
import OwnerSelect from './OwnerSelect';

type TemplateFormProps = {
  editDescriptionMutation: TEditDesription;
  handleAddSubmitMutation: TAddDescription;
  selectedValue: string;
  description: string | null | undefined;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: TEmployeeResponse | undefined;
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
      {mode === 'EDIT'
        ? `${template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Aufgabe bearbeiten`
        : `Füge Aufgabe fürs ${template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} hinzu`}

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
        className="w-xl mb-5"
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
          className="  text-left justify-start cursor-pointer hover:bg-gray-200 w-71"
        >
          {mode === 'EDIT' ? 'Speichern ' : 'Neue Beschreibung hinzufügen'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
