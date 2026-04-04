import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { workerQueries } from '@/features/task-management/query-options/queries/worker.queries';
import { isV2IssueId } from '@/features/task-management/hooks/useTaskHistory';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../../../../components/ui/button';
import { formSchema } from '../../../../schemas/index.schema';
import { InsertHistoryData } from '../../../../types/index.types';
import { STATUS_MAP, type TaskStatus } from '../../../../utils/selectOptionTernary';

const LEGACY_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
  { value: 'erledigt', label: 'Erledigt' },
];

type StatusInformationProps = {
  workerId: string;
  id: string | number;
  editcomment: string;
  taskStatus: TaskStatus;
  statusId?: string;
  form_field_id: number;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

function StatusInformation({
  workerId,
  id,
  editcomment,
  taskStatus,
  statusId,
  form_field_id,
  handleSubmit,
}: StatusInformationProps) {
  useBodyScrollLock();
  const v2 = isV2IssueId(String(id));

  const { data: issueStatuses = [], isPending: issueStatusesLoading } = useQuery(
    {
      ...workerQueries.issueStatuses(workerId),
      enabled: v2 && !!workerId,
    }
  );

  const defaultSelectOption = v2
    ? (statusId ?? '')
    : (taskStatus || 'offen');

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
  } = useForm<InsertHistoryData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: String(id),
      form_field_id: String(form_field_id),
      editcomment,
      select_option: defaultSelectOption,
    },
  });

  const selectedValue = useWatch({
    control,
    name: 'select_option',
  }) as string;

  const issueOptions = issueStatuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const selectData = v2 ? issueOptions : LEGACY_STATUS_OPTIONS;

  const triggerClassName = v2
    ? 'border border-border bg-muted/50 text-foreground'
    : (STATUS_MAP[selectedValue as TaskStatus]?.className ??
      STATUS_MAP.offen.className);

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={rhfHandleSubmit(handleSubmit)}
      name="valuesform"
    >
      <Input type="hidden" {...register('id')} />
      <Input type="hidden" {...register('form_field_id')} />

      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Status
      </label>
      {v2 && issueStatusesLoading ? (
        <div className="text-sm text-muted-foreground">Status wird geladen…</div>
      ) : v2 && issueOptions.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Keine Issue-Status für diesen Handwerker konfiguriert.
        </div>
      ) : (
        <FormSelectOptions
          control={control}
          errors={errors}
          name="select_option"
          placeholder="Status"
          defaultValue={defaultSelectOption}
          triggerClassName={triggerClassName}
          data={selectData}
        />
      )}
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Kommentar
      </label>
      <Textarea
        {...register('editcomment')}
        id="editcomment"
        className="w-full rounded-xl"
      />
      <div className="flex w-full min-w-0 flex-row gap-2">
        <Button
          className="w-full flex-1 cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
          variant={'outline'}
          type="submit"
          disabled={v2 && (issueStatusesLoading || issueOptions.length === 0)}
        >
          Speichern
        </Button>
      </div>
    </form>
  );
}

export default StatusInformation;
