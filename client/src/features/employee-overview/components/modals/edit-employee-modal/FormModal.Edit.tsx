import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { absenceReason } from '@/features/employee-overview/consts/SelectInput';
import useEditEmployee from '@/features/employee-overview/hooks/useEditEmployee';
import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { useMemo } from 'react';
import FormFields from '../../../../../components/form/FormFields';

type FormModalEditProps = {
  id: string | undefined;
  fullname: string;
  EmployeeData: EmployeeDataArray | undefined;
  toggleEmployeeModal: () => void;
};

const FormModalEdit = ({
  id,
  fullname,
  EmployeeData,
  toggleEmployeeModal,
}: FormModalEditProps) => {
  const { register, handleSubmit, control, errors, onSubmit } =
    useEditEmployee(toggleEmployeeModal);

  const employeeOptions = useMemo(
    () =>
      EmployeeData?.map((emp) => ({
        label: `${emp.firstName} ${emp.lastName}`,
        value: `${emp.id}`,
      })) ?? [],
    [EmployeeData]
  );
  return (
    <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden pr-1">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full min-w-0 flex-col gap-4"
      >
        <Input type="hidden" value={id} {...register('userId')} />
        <h1 className="text-left w-full">
          Abwesenheit eintragen für: {fullname}
        </h1>
        <FormSelectOptions
          name="absenceType"
          control={control}
          data={absenceReason}
          placeholder={'Grund'}
          errors={errors}
          label={'Grund der Abwesenheit'}
        />
        <FormFields
          label={'Abwesenheitsbeginn'}
          type="date"
          register={register}
          name={'startDate'}
          errors={errors}
        />

        <FormFields
          label={'Abwesenheitsende'}
          type="date"
          register={register}
          name="endDate"
          errors={errors}
        />
        <FormSelectOptions
          name="substituteId"
          control={control}
          data={employeeOptions}
          placeholder={'Mitarbeiter'}
          errors={errors}
          label={'Soll vertreten werden von'}
        />

        <Button
          className="cursor-pointer rounded-full"
          variant="outline"
          type="submit"
        >
          Speichern
        </Button>
      </form>
    </div>
  );
};

export default FormModalEdit;
