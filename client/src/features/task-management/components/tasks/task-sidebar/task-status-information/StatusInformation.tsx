import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../../../../components/ui/button';
import { formSchema } from '../../../../schemas/index.schema';
import { InsertHistoryData } from '../../../../types/index.types';
import { STATUS_MAP, TaskStatus } from '../../../../utils/selectOptionTernary';

type StatusInformationProps = {
  id: number;
  editcomment: string;
  select_option: TaskStatus;
  form_field_id: number;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

function StatusInformation({
  id,
  editcomment,
  select_option,
  form_field_id,
  handleSubmit,
}: StatusInformationProps) {
  useBodyScrollLock();
  const defaultStatus: TaskStatus = select_option || 'offen';

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
      select_option: defaultStatus,
    },
  });

  const selectedStatus = useWatch({
    control,
    name: 'select_option',
  }) as TaskStatus;
  const statusClassName =
    STATUS_MAP[selectedStatus]?.className ??
    'bg-(--status-error-bg) text-(--status-error-foreground)';

  return (
    <form
      className="flex flex-col gap-5 w-full"
      onSubmit={rhfHandleSubmit(handleSubmit)}
      name="valuesform"
    >
      <Input type="hidden" {...register('id')} />
      <Input type="hidden" {...register('form_field_id')} />

      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Status
      </label>
      <FormSelectOptions
        control={control}
        errors={errors}
        name="select_option"
        placeholder="Status"
        defaultValue={defaultStatus}
        triggerClassName={statusClassName}
        data={[
          { value: 'offen', label: 'Offen' },
          { value: 'in_bearbeitung', label: 'In Bearbeitung' },
          { value: 'erledigt', label: 'Erledigt' },
        ]}
      />
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
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
        >
          Speichern
        </Button>
      </div>
    </form>
  );
}

export default StatusInformation;
