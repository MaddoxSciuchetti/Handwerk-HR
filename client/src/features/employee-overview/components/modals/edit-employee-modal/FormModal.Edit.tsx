import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { absenceReason } from '@/features/employee-overview/consts/SelectInput';
import useEditEmployee from '@/features/employee-overview/hooks/use-editEmployee';
import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { useMemo } from 'react';
import FormFields from '../../../../../components/form/FormFields';
import EmployeeSelect from './EmployeeSelect';

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
  const { success, register, handleSubmit, control, errors, onSubmit } =
    useEditEmployee(toggleEmployeeModal);

  const employeeOptions = useMemo(
    () =>
      EmployeeData?.map((emp) => ({
        label: `${emp.vorname}${emp.nachname}`,
        value: `${emp.id}`,
      })) ?? [],
    [EmployeeData]
  );
  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 py-10"
      >
        <Input type="hidden" value={id} {...register('id')} />
        <h1>Abwesenheit eintragen für {fullname}</h1>
        <EmployeeSelect
          name="absencetype"
          control={control}
          options={absenceReason}
          placeholder="Grund"
          label={'Grund der Abwesenheit'}
          errors={errors}
        />
        <FormFields
          label={'Abwesenheitsbeginn'}
          placeholder={'DD.MM.YYYY'}
          register={register}
          name={'absencebegin'}
          errors={errors}
        />

        <FormFields
          label={'Abwesenheitsende'}
          placeholder={'DD.MM.YYYY'}
          register={register}
          name="absenceEnd"
          errors={errors}
        />
        <EmployeeSelect
          name={'substitute'}
          control={control}
          options={employeeOptions}
          placeholder={'Mitarbeiter'}
          label={'Soll vertreten werden von'}
          errors={errors}
        />
        {success ? <p className="text-green-400">Abwesenheit geädert</p> : ''}

        <Button className="cursor-pointer" variant={'outline'} type="submit">
          Speichern
        </Button>
      </form>
    </>
  );
};

export default FormModalEdit;
