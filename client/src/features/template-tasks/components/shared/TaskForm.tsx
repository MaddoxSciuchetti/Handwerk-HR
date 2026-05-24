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
import OwnerSelect from './OwnerSelect';

type TaskFormProps<T extends FieldValues> = {
  templateHeaderAdjective: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  control: Control<T, T, T>;
  submit: () => void;
  buttonsaveText: string;
  description?: string | undefined;
  defaultOwner?: string;
  descriptionFormName: Path<T>;
  templateTypeName: Path<T>;
  formfieldName?: Path<T>;
  formfieldValue?: number | null;
};

const TaskForm = <T extends FieldValues>({
  templateHeaderAdjective,
  buttonsaveText,
  register,
  errors,
  control,
  submit,
  description,
  defaultOwner,
  descriptionFormName,
}: TaskFormProps<T>) => {
  return (
    <form onSubmit={submit} className="flex w-full flex-col items-start ">
      <Textarea
        data-testid="description"
        {...register(descriptionFormName)}
        defaultValue={description || ''}
        id="description"
        name="description"
        className="mt-5 mb-5 w-full max-w-md rounded-xl"
      />
      <ErrorMessage
        errors={errors}
        name={'description' as unknown as never}
        render={({ message }) => (
          <p className="mb-5 text-sm text-destructive">{message}</p>
        )}
      />
      <div className="flex w-full min-w-0 flex-row items-start gap-2">
        <div className="min-w-0 flex-1">
          <OwnerSelect
            control={control}
            errors={errors}
            defaultvalue={defaultOwner}
          />
        </div>
        <Button
          type="submit"
          variant={'outline'}
          className="flex-1 cursor-pointer justify-start rounded-xl text-left transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {buttonsaveText}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
