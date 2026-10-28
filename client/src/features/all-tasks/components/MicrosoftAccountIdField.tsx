import FormFields from '@/components/form/FormFields';
import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { TaskSidebarForm } from '../types/index.types';

export function MicrosoftAccountIdField({
  sequence,
  storedMicrosoftAccountId,
  register,
  errors,
}: {
  sequence: string | undefined;
  storedMicrosoftAccountId?: string | null;
  register: UseFormRegister<TaskSidebarForm>;
  errors: FieldErrors<TaskSidebarForm>;
}) {
  const id = useId();
  if (
    sequence !== 'microsoft_deactivate_account' ||
    storedMicrosoftAccountId?.trim()
  )
    return null;
  return (
    <div className="flex flex-col gap-2">
      <FormFields
        id={id}
        errors={errors}
        register={register}
        name="microsoftAccountId"
        label="Microsoft-Konto-ID (erforderlich)"
        aria-required="true"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        className="h-8"
      />
    </div>
  );
}
