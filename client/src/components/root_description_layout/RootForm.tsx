import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Dispatch, SetStateAction } from 'react';
import { TEmployeeResponse } from '@/zod-schemas/schema';
import EmployeeSelect from './EmployeeSelect';
import { SubmitHandler, useForm } from 'react-hook-form';
import { UseMutateFunction } from '@tanstack/react-query';
import { EditDescriptionData } from '@/lib/api';
import { newField } from '@/types/api';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';

const baseSchema = z.object({
  description: z
    .string()
    .min(6, { message: 'Bitte füge eine Längere Beschreibung hinzu' }),
  template_type: z.enum(['ONBOARDING', 'OFFBOARDING']),
  owner: z.string({ message: 'Bitte wählen ein Mitarbeiter aus' }),
});

const addSchema = baseSchema;

const editSchema = baseSchema.extend({
  form_field_id: z.number(),
});

type RootFormProps = {
  editDescriptionMutation: UseMutateFunction<
    EditDescriptionData,
    Error,
    EditDescriptionData,
    unknown
  >;
  handleAddSubmitMutation: UseMutateFunction<
    newField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    },
    unknown
  >;
  selectedValue: string;
  description: string | null | undefined;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: TEmployeeResponse | undefined;
  template_type: 'OFFBOARDING' | 'ONBOARDING' | undefined;
  form_field_id: number | null | undefined;
  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

export type HandleAddSubmit = {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};
export type HandleEditSubmit = HandleAddSubmit & {
  form_field_id: number;
};

const RootForm = ({
  editDescriptionMutation,
  handleAddSubmitMutation,
  selectedValue,
  description,
  setSelectedValue,
  EmployeeData,
  template_type,
  form_field_id,
  mode,
}: RootFormProps) => {
  const schema = mode === 'EDIT' ? editSchema : addSchema;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<HandleAddSubmit | HandleEditSubmit>({
    resolver: zodResolver(schema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<HandleAddSubmit | HandleEditSubmit> = (
    data
  ) => {
    if (mode === 'EDIT') {
      editDescriptionMutation(data as HandleEditSubmit);
    } else {
      handleAddSubmitMutation(data as HandleAddSubmit);
    }
  };

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
        <EmployeeSelect
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

export default RootForm;
