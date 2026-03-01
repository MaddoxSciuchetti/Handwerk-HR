import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useEditEmployee from '@/features/employee-overview/hooks/use-editEmployee';
import { TEmployeeResponse } from '@/features/employee-overview/schemas/schema';
import EmployeeSelect from './EmployeeSelect';
import { absenceReason } from '@/features/employee-overview/consts/SelectInput';
import { useMemo } from 'react';
import FormFields from '../../../../../components/form/FormFields';

type ModalFormProps = {
  id: string | undefined;
  fullname: string;
  EmployeeData: TEmployeeResponse | undefined;
  toggleEmployeeModal: () => void;
};

const ModalFormEdit = ({
  id,
  fullname,
  EmployeeData,
  toggleEmployeeModal,
}: ModalFormProps) => {
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

export default ModalFormEdit;
