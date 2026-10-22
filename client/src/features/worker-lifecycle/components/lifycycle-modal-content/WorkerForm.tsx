import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { useAddWorker } from '../../hooks/useAddWorker';
import { useMemoizedInputs } from '../../hooks/useMemoizedInputs';
import { FastTrackOnboarding } from './FastTrackOnboarding';
import { TemplateSelect } from './TemplateSelect';

interface WorkerFormProps {
  setSelectedOption: (value: AddWorker['type'] | null) => void;
  type: AddWorker['type'];
  toggleModal: () => void;
  showInlineFormBackButton?: boolean;
  onQuestionnaire?: (draft: { engagementId: string }) => void;
}

export const WorkerForm = ({
  setSelectedOption,
  type,
  toggleModal,
  showInlineFormBackButton = true,
  onQuestionnaire,
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {showInlineFormBackButton && (
        <Button
          type="button"
          variant="outline"
          className="w-fit rounded-2xl"
          onClick={() => setSelectedOption(null)}
        >
          Zurück
        </Button>
      )}

      {type !== 'Onboarding' && (
        <h1 className="typo-body-lg font-semibold">Eingabe {type}</h1>
      )}

      {type === 'Onboarding' && (
        <>
          <FastTrackOnboarding
            onCreated={(draft) => {
              toggleModal();
              onQuestionnaire?.(draft);
            }}
          />
          <div
            className="my-3 flex shrink-0 items-center gap-4"
            role="separator"
          >
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              oder
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form
        onSubmit={handleSubmit(submitWorkerForm)}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        {isError && (
          <p className="text-(--destructive)">
            {error?.message || 'An error occurred'}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {memoizedInputs.map((input) => (
            <FormFields
              key={input.name}
                className="h-8 rounded-lg border-input bg-transparent"
              errors={errors}
              register={register}
              name={input.name}
              placeholder={input.placeholder}
            />
          ))}

          <TemplateSelect control={control} name="templateId" />
        </div>

        <footer className="mt-auto flex shrink-0 justify-end border-t border-border pt-4">
          <Button type="submit" className="rounded-2xl" disabled={isPending}>
            {isPending ? 'Wird erstellt...' : 'Hinzufügen'}
          </Button>
        </footer>
      </form>
    </div>
  );
};
