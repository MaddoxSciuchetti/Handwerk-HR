import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Dispatch, SetStateAction, SubmitEvent } from 'react';
import { TEmployeeResponse } from '@/zod-schemas/schema';
import EmployeeSelect from './EmployeeSelect';

type RootFormProps = {
  handleAddSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  selectedValue: string;
  description: string | null | undefined;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: TEmployeeResponse | undefined;
  template_type: 'OFFBOARDING' | 'ONBOARDING' | undefined;
  form_field_id: number | null | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const RootForm = ({
  handleAddSubmit,
  handleSubmit,
  selectedValue,
  description,
  setSelectedValue,
  EmployeeData,
  template_type,
  form_field_id,
  mode,
}: RootFormProps) => {
  return (
    <form
      onSubmit={mode === 'EDIT' ? handleSubmit : handleAddSubmit}
      name="valuesform"
      className="flex flex-col items-start"
    >
      {mode === 'EDIT'
        ? `${template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Aufgabe bearbeiten`
        : `Füge Aufgabe fürs ${template_type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} hinzu`}
      <input type="hidden" name="owner" value={selectedValue || ''} />
      <input type="hidden" name="template_type" value={template_type} />
      {mode === 'EDIT' && (
        <input
          type="hidden"
          id="form_field_id"
          name="form_field_id"
          value={form_field_id || ''}
        />
      )}
      <Textarea
        defaultValue={description || ''}
        id="description"
        name="description"
        className="w-xl mb-5"
      />
      <div className="flex flex-row gap-2">
        <EmployeeSelect
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

export default RootForm;
