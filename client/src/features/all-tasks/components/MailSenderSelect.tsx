import FormSelectOptions from '@/components/form/FormSelectOptions';
import { getMicrosoftMailAddresses } from '@/features/worker-task-management/api/engagementMail.api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import type { TaskSidebarForm } from '../types/index.types';

type MailSenderSelectProps = {
  control: Control<TaskSidebarForm>;
  errors: FieldErrors<TaskSidebarForm>;
  current: string;
};

export function MailSenderSelect({
  control,
  errors,
  current,
}: MailSenderSelectProps) {
  const addresses = useQuery({
    queryKey: ['bsb-mail-addresses'],
    queryFn: getMicrosoftMailAddresses,
  });
  const options = useMemo(() => {
    const listed = (addresses.data?.addresses ?? []).map((address) => ({
      value: address.email,
      label: address.label,
    }));
    if (current && !listed.some((option) => option.value === current)) {
      listed.unshift({ value: current, label: current });
    }
    return listed;
  }, [addresses.data, current]);

  return (
    <div className="flex flex-col gap-2">
      <FormSelectOptions
        name="mailSenderAddress"
        control={control}
        errors={errors}
        data={options}
        label="Absender"
        placeholder={
          addresses.isLoading ? 'Absender werden geladen…' : 'Absender wählen'
        }
      />
      {addresses.data?.error ? (
        <p className="text-sm text-muted-foreground">{addresses.data.error}</p>
      ) : null}
    </div>
  );
}
