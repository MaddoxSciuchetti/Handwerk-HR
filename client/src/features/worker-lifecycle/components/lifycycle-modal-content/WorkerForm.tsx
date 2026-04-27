import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/selfmade/button';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { useAddWorker } from '../../hooks/useAddWorker';
import { useMemoizedInputs } from '../../hooks/useMemoizedInputs';
import { TemplateSelect } from './TemplateSelect';

interface WorkerFormProps {
  setSelectedOption: (value: AddWorker['type'] | null) => void;
  type: AddWorker['type'];
  toggleModal: () => void;
  showInlineFormBackButton?: boolean;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
  showInlineFormBackButton = true,
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
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      {showInlineFormBackButton && (
        <Button
          type="button"
          className="w-fit border border-border bg-card text-foreground shadow-none hover:bg-muted/60"
          onClick={() => setSelectedOption(null)}
        >
          Zurück
        </Button>
      )}

      <h1 className="typo-body-lg font-semibold">Eingabe {type}</h1>

      {isError && (
        <p className="text-(--destructive)">
          {error?.message || 'An error occurred'}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
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

      <footer className="mt-auto flex shrink-0 justify-end border-t border-border pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="shrink-0 border-0 bg-interactive-primary-bg text-sm text-interactive-primary-text hover:bg-interactive-primary-hover"
        >
          {isPending ? 'Wird erstellt...' : 'Hinzufügen'}
        </Button>
      </footer>
    </form>
  );
};
