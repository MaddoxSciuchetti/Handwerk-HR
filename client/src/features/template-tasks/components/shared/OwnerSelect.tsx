import { Control, FieldErrors, FieldValues } from 'react-hook-form';

import FormSelectOptions from '@/components/form/FormSelectOptions';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { useQuery } from '@tanstack/react-query';
import { HandleAddSubmit } from '../../types/taskForm.types';

type OwnerSelectProps<T extends FieldValues> = {
  control: Control<T, any, T>;
  errors: FieldErrors<HandleAddSubmit>;
  defaultvalue?: string;
};

const OwnerSelect = <T extends FieldValues>({
  errors,
  control,
  defaultvalue,
}: OwnerSelectProps<T>) => {
  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());

  return (
    <>
      <FormSelectOptions
        defaultValue={defaultvalue}
        name={'owner' as unknown as never}
        control={control}
        errors={errors}
        placeholder="Mitarbeiter"
        data={employees.map((e) => ({
          value: e.id,
          label: `${e.vorname} ${e.nachname}`,
        }))}
      />
    </>
  );
};

export default OwnerSelect;
