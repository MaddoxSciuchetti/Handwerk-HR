import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ErrorMessage } from '@hookform/error-message';
import {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form';
import OwnerSelect from '../OwnerSelect';

type TaskFormProps<T extends FieldValues> = {
  template_header: string;
  templateHeaderAdjective: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  control: Control<T, any, T>;
  tab: 'ONBOARDING' | 'OFFBOARDING';
  submit: () => void;
  buttonsaveText: string;
  description?: string | undefined;
  descriptionFormName: Path<T>;
  templateTypeName: Path<T>;
  formfieldName?: Path<T>;
  formfieldValue?: number | null;
};

const TaskForm = <T extends FieldValues>({
  template_header,
  templateHeaderAdjective,
  buttonsaveText,
  register,
  errors,
  control,
  submit,
  description,
  tab,
  descriptionFormName,
  templateTypeName,
  formfieldName,
  formfieldValue,
}: TaskFormProps<T>) => {
  return (
    <form onSubmit={submit}>
      <p>{`${template_header} Aufgabe ${templateHeaderAdjective}`}</p>
      <p>{`Füge Aufgabe fürs ${template_header}`}</p>

      <input
        {...register(templateTypeName)}
        type="hidden"
        name="template_type"
        value={tab}
      />

      {formfieldName && (
        <input
          {...register(formfieldName, { valueAsNumber: true })}
          type="hidden"
          id="form_field_id"
          name="form_field_id"
          value={formfieldValue || ''}
        />
      )}

      <Textarea
        data-testid="description"
        {...register(descriptionFormName)}
        defaultValue={description || ''}
        id="description"
        name="description"
        className="mt-5 mb-5 w-full max-w-full rounded-xl"
      />
      <ErrorMessage
        errors={errors}
        name={'description' as unknown as never}
        render={({ message }) => (
          <p className="mb-5 text-sm text-destructive">{message}</p>
        )}
      />
      <OwnerSelect control={control} errors={errors} />
      <Button
        type="submit"
        variant={'outline'}
        className="flex-1 cursor-pointer justify-start rounded-xl text-left transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {buttonsaveText}
      </Button>
    </form>
  );
};

export default TaskForm;
