import FormFields from '@/components/form/FormFields';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { Button } from '../../../../components/ui/button';
import { useAddWorker } from '../../hooks/useAddWorker';
import { useMemoizedInputs } from '../../hooks/useMemoizedInputs';

interface WorkerFormProps {
  setSelectedOption: (value: AddWorker['type'] | null) => void;
  type: AddWorker['type'];
  toggleModal: () => void;
  className?: string;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
}: WorkerFormProps) => {
  const {
    register,
    handleSubmit,
    submitWorkerForm,
    errors,
    isError,
    error,
    isPending,
  } = useAddWorker(type, toggleModal);

  const memoizedInputs = useMemoizedInputs(type);

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
          {memoizedInputs.map((input) => (
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
