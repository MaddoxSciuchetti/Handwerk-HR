import FormFields from '@/components/form/FormFields';
import {
  AddWorker,
  addWorkerSchema,
} from '@/features/worker-lifecycle/schemas/zod.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Inputs } from '../../consts/form.consts';
import { workerLifecycleMutations } from '../../query-options/mutations/worker-lifycycle.mutations';
import { FormType } from '../../types/index.types';

interface WorkerFormProps {
  setSelectedOption: (value: FormType | null) => void;
  type: FormType;
  toggleModal: () => void;
  className?: string;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
}: WorkerFormProps) => {
  const {
    mutate: addWorkerMutation,
    isError,
    error,
  } = useMutation(workerLifecycleMutations.addWorker());

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

  const submitWorkerForm = (data: AddWorker) => {
    addWorkerMutation(data, {
      onSuccess: () => {
        toggleModal();
      },
    });
  };

  const useMemoizedInputs = useMemo(() => {
    const offboardingInputs =
      type === 'Offboarding'
        ? [
            {
              name: 'austrittsdatum' as const,
              placeholder: 'Austrittsdatum DD.MM.YYYY',
              required: type === 'Offboarding',
            },
          ]
        : [];
    return [...Inputs, ...offboardingInputs];
  }, [type]);

  return (
    <>
      <form
        onSubmit={handleSubmit(submitWorkerForm)}
        className=" gap-4  flex flex-col"
      >
        {isError && (
          <div className="mb-3 text-(--destructive)">
            {error?.message || 'An error occurred'}
          </div>
        )}
        <Button
          className="w-20 cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
          variant={'outline'}
          onClick={() => setSelectedOption(null)}
          type="button"
        >
          Zurück{' '}
        </Button>
        <h1 className="text-left">Eingabe {type}</h1>
        <div className="grid grid-cols-2 gap-3 pb-10 ">
          {useMemoizedInputs.map((input) => (
            <div key={input.name}>
              <FormFields
                errors={errors}
                register={register}
                name={input.name}
                placeholder={input.placeholder}
              />
            </div>
          ))}

          {/* <Input type="hidden" {...register('type')} value={type} /> */}
        </div>
        <Button
          variant={'outline'}
          type="submit"
          className="cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Hinzufügen
        </Button>
      </form>
    </>
  );
};
