import {
  AddWorker,
  addWorkerSchema,
} from '@/features/worker-lifecycle/schemas/zod.schemas';
import { ErrorMessage } from '@hookform/error-message';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { FormType } from '../../types/index.types';

interface WorkerFormProps {
  setSelectedOption: (value: FormType | null) => void;
  type: FormType;
  success: (data: AddWorker) => void;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  success,
}: WorkerFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddWorker>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: {
      type: type,
    },
    criteriaMode: 'all',
  });

  const SubmitWorkerForm = (data: AddWorker) => {
    success(data);
  };

  const Inputs = [
    {
      name: 'vorname' as const,
      placeholder: 'Vorname',
      required: true,
    },
    {
      name: 'nachname' as const,
      placeholder: 'Nachname',
      required: false,
    },
    {
      name: 'email' as const,
      placeholder: 'email',
      required: false,
    },
    {
      name: 'geburtsdatum' as const,
      placeholder: 'Geburtsdatum DD.MM.YYYY',
      required: false,
    },
    {
      name: 'adresse' as const,
      placeholder: 'Adresse',
      required: false,
    },
    {
      name: 'eintrittsdatum' as const,
      placeholder: 'Eintrittsdatum DD.MM.YYYY',
      required: false,
    },
    {
      name: 'position' as const,
      placeholder: 'Position',
      required: false,
    },
  ];

  const ConditionalInputs = [
    ...Inputs,
    ...(type === 'Offboarding'
      ? [
          {
            name: 'austrittsdatum' as const,
            placeholder: 'Austrittsdatum DD.MM.YYYY',
            required: type === 'Offboarding' ? true : false,
          },
        ]
      : []),
  ];

  return (
    <>
      <form
        onSubmit={handleSubmit(SubmitWorkerForm)}
        className=" gap-4  flex flex-col"
      >
        <Button
          className="w-20 hover:bg-gray-300"
          variant={'outline'}
          onClick={() => setSelectedOption(null)}
        >
          Zurück{' '}
        </Button>
        <h1 className="text-left">
          Eingabe {type === 'Onboarding' ? 'Onboarding' : 'Offboarding'}{' '}
        </h1>
        <div className="grid grid-cols-2 gap-3 pb-10 ">
          {ConditionalInputs.map((input, index) => (
            <div key={index}>
              <Input
                placeholder={input.placeholder}
                type="text"
                {...register(input.name, {
                  required: input.required,
                })}
              />
              <ErrorMessage
                key={index}
                errors={errors}
                name={input.name}
                render={({ message }) => (
                  <p className="text-sm text-red-500">{message}</p>
                )}
              />
            </div>
          ))}

          <Input type="hidden" {...register('type')} value={type} />
        </div>
        <Button
          variant={'outline'}
          type="submit"
          className="hover:bg-gray-300 "
        >
          Hinzufügen
        </Button>
      </form>
    </>
  );
};
