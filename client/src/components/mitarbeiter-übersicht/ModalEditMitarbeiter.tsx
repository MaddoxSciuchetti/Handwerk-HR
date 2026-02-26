import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteEmployeeHandler,
  DescriptionData,
  editEmployeeAbsence,
  fetchRawDescription,
} from '@/lib/api';
import { subISOWeekYears } from 'date-fns';
import z from 'zod';
import useEmployeeData from '@/hooks/use-employeeData';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Spinner } from '../ui/spinner';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { DateSchema } from '@/zod-schemas/schema';
import { useState } from 'react';
import { AbsenceData } from '@/types/api';

type ModalEditMitarbeiterProps = {
  fullname: string;
  toggleEmployeeModal: () => void;
  id: string | undefined;
};

const AbsenceSchema = z.object({
  id: z.string(),
  absence: z.string().optional(),
  absencetype: z
    .string()
    .min(1, { message: 'Art der Abwesenheit ist erforderlich' }),
  absencebegin: DateSchema,
  absenceEnd: DateSchema,
  substitute: z.string({ message: 'Bitte wähle von der Option' }),
});

function ModalEditMitarbeiter({
  fullname,
  toggleEmployeeModal,
  id,
}: ModalEditMitarbeiterProps) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<boolean>();
  const {
    EmployeeData,
    isLoading: isLoadingEmployee,
    isError: isErrorEmployee,
  } = useEmployeeData();

  const EmployeeAbsence = useMutation({
    mutationFn: editEmployeeAbsence,
    onSuccess: () => {
      setSuccess(true);
      toggleEmployeeModal();
      queryClient.invalidateQueries({
        queryKey: ['EmployeeDataSpecifics'],
      });
      console.log('sucessfully submitted');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AbsenceData>({
    resolver: zodResolver(AbsenceSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<AbsenceData> = (data) => {
    console.log('hello');
    console.log(data);
    EmployeeAbsence.mutate(data);
  };

  if (!id) return <div>There is no id</div>;
  if (isErrorEmployee) return <div>No error</div>;

  return (
    <>
      <div className="flex flex-col max-h-150 min-h-150 border border-amber-400 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-xl">
        {isLoadingEmployee ? (
          <Spinner className="size-8" />
        ) : (
          <div className="max-w-xl max-h-140 w-xl flex flex-col">
            <div className="flex w-85 mx-auto flex-col ">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 py-10"
              >
                <Input type="hidden" value={id} {...register('id')} />
                <h1>Abwesenheit eintragen für {fullname}</h1>
                <Label>Grund der Abwesenheit</Label>
                <select {...register('absencetype')}>
                  <option value="" disabled selected>
                    Grund
                  </option>
                  <option>Krank</option>
                  <option>Urlaub</option>
                  <option>Andere</option>
                </select>

                <ErrorMessage
                  errors={errors}
                  name={'absencetype'}
                  render={({ message }) => (
                    <p className="text-red-400 text-sm">{message}</p>
                  )}
                />
                <Label>Abwesenheitsbegin</Label>

                <Input
                  type="text"
                  id="firstname"
                  placeholder="DD.MM.YYYY"
                  {...register('absencebegin')}
                />

                <ErrorMessage
                  errors={errors}
                  name={'absencebegin'}
                  render={({ message }) => (
                    <p className="text-red-400 text-sm">{message}</p>
                  )}
                />

                <Label>Abwesenheitsende</Label>
                <Input
                  type="text"
                  id="firstname"
                  placeholder="DD.MM.YYYY"
                  {...register('absenceEnd')}
                />

                <ErrorMessage
                  errors={errors}
                  name={'absencebegin'}
                  render={({ message }) => (
                    <p className="text-red-400 text-sm">{message}</p>
                  )}
                />

                <Label>Soll vertreten werden von</Label>
                <Controller
                  name="substitute"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      {' '}
                      {/* field.value not Field.value */}
                      <SelectTrigger id="substitute" name="substitute">
                        <SelectValue placeholder="Vertretung" />
                      </SelectTrigger>
                      <SelectContent className="border-none">
                        <SelectGroup className="bg-white cursor-pointer">
                          {EmployeeData?.map((item) => (
                            <SelectItem
                              className="hover:bg-gray-200 cursor-pointer"
                              id={`select-${item.id}`}
                              value={item.id}
                              key={item.id}
                            >
                              {item.vorname} {item.nachname}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />

                <ErrorMessage
                  errors={errors}
                  name={'substitute'}
                  render={({ message }) => (
                    <p className="text-red-400 text-sm">{message}</p>
                  )}
                />

                {success ? (
                  <p className="text-green-400">Abwesenheit geädert</p>
                ) : (
                  ''
                )}

                <Button
                  className="cursor-pointer"
                  variant={'outline'}
                  type="submit"
                >
                  Speichern
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ModalEditMitarbeiter;
