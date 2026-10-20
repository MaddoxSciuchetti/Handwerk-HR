import FormFields from '@/components/form/FormFields';
import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { TaskSidebarForm } from '../types/index.types';

export function MicrosoftAccountIdField({
  sequence,
  register,
  errors,
}: {
  sequence: string | undefined;
  register: UseFormRegister<TaskSidebarForm>;
  errors: FieldErrors<TaskSidebarForm>;
}) {
  const id = useId();
  if (sequence !== 'microsoft_deactivate_account') return null;
  return (
    <div className="flex flex-col gap-2">
      <FormFields
        id={id}
        errors={errors}
        register={register}
        name="microsoftAccountId"
        label="Microsoft-Konto-ID (optional)"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        aria-describedby={`${id}-hint`}
        className="h-8"
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        Leer lassen, um die beim Handwerker hinterlegte Microsoft-ID zu
        verwenden. Eine eingegebene ID vor der Ausführung speichern.
      </p>
    </div>
  );
}
