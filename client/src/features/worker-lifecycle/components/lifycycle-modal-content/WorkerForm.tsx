import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import useGetOrgUsers from '@/features/employee-overview/hooks/useGetEmployees';
import { LifecycleType } from '@/features/task-management/types/index.types';
import {
  CreateWorker,
  createWorkerSchema,
} from '@/features/worker-lifecycle/schemas/zod.schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Inputs } from '../../consts/form.consts';
import { workerLifecycleMutations } from '../../query-options/mutations/worker-lifycycle.mutations';

interface WorkerFormProps {
  setSelectedOption: (value: LifecycleType | null) => void;
  type: LifecycleType;
  toggleModal: () => void;
  className?: string;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
}: WorkerFormProps) => {
  const {
    mutateAsync: addWorkerMutation,
    isError,
    error,
    isPending,
  } = useMutation(workerLifecycleMutations.addWorker());

  const { OrgUsers } = useGetOrgUsers();

  const orgUsersSelectData = (OrgUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWorker>({
    resolver: zodResolver(createWorkerSchema),
    defaultValues: {
      engagementType: type,
    },
    criteriaMode: 'all',
  });

  const submitWorkerForm = async (data: CreateWorker) => {
    await addWorkerMutation(data);
    toast.success('Mitarbeiter erstellt und Benachrichtigungen versendet');
    toggleModal();
  };

  const useMemoizedInputs = useMemo(() => {
    const offboardingInputs =
      type === 'offboarding'
        ? [
            {
              name: 'exitDate' as const,
              placeholder: 'Austrittsdatum DD.MM.YYYY',
              required: type === 'offboarding',
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
          <div className="mb-3 text-[var(--destructive)]">
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
        <h1 className="text-left">
          Eingabe {type === 'offboarding' ? 'Offboarding' : 'Onboarding'}
        </h1>
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
        </div>
        <FormSelectOptions
          control={control}
          errors={errors}
          name="responsibleUserId"
          placeholder="Verantwortliche Person wählen"
          data={orgUsersSelectData}
        />
        <Button
          variant={'outline'}
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {isPending ? 'Wird erstellt...' : 'Hinzufügen'}
        </Button>
      </form>
    </>
  );
};
