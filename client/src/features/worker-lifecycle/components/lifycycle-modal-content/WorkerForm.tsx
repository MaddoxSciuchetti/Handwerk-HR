import FormFields from '@/components/form/FormFields';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { Button } from '../../../../components/ui/button';
import { useAddWorker } from '../../hooks/useAddWorker';
import { useMemoizedInputs } from '../../hooks/useMemoizedInputs';
import { TemplateSelect } from './TemplateSelect';

interface WorkerFormProps {
  setSelectedOption: (value: AddWorker['type'] | null) => void;
  type: AddWorker['type'];
  toggleModal: () => void;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
}: WorkerFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    submitWorkerForm,
    errors,
    isError,
    error,
    isPending,
  } = useAddWorker(type, toggleModal);

  const memoizedInputs = useMemoizedInputs(type);

  return (
    <form
      onSubmit={handleSubmit(submitWorkerForm)}
      className="flex flex-col gap-4"
    >
      <Button
        type="button"
        variant="outline"
        className="w-fit cursor-pointer rounded-xl"
        onClick={() => setSelectedOption(null)}
      >
        Zurück
      </Button>

      <h1 className="typo-body-lg font-semibold">Eingabe {type}</h1>

      {isError && (
        <p className="text-(--destructive)">
          {error?.message || 'An error occurred'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {memoizedInputs.map((input) => (
          <FormFields
            key={input.name}
            errors={errors}
            register={register}
            name={input.name}
            placeholder={input.placeholder}
          />
        ))}

        <TemplateSelect control={control} name="templateId" />
      </div>

      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="w-full cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {isPending ? 'Wird erstellt...' : 'Hinzufügen'}
      </Button>
    </form>
  );
};
