import { ErrorMessage } from '@hookform/error-message';
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  ISSUE_STATUS_OPTIONS,
} from '../../consts/issue-status.consts';
import { TaskStatusIcon } from './TaskStatusIcons';

type TaskStatusSelectProps<T extends FieldValues> = {
  control: Control<T>;
  errors: FieldErrors<T>;
  name?: Path<T>;
  label?: string;
};

export function TaskStatusSelect<T extends FieldValues>({
  control,
  errors,
  name = 'status' as Path<T>,
  label = 'Status',
}: TaskStatusSelectProps<T>) {
  return (
    <>
      <Label className="ds-label-base">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={(field.value as string | undefined) ?? ''}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              id={name}
              name={name}
              className="w-full rounded-xl"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border border-border bg-popover bg-(--popover) text-popover-foreground">
              <SelectGroup className="cursor-pointer">
                {ISSUE_STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    className="cursor-pointer"
                    id={`select-${option.value}`}
                    value={option.value}
                    key={option.value}
                  >
                    <span className="flex items-center gap-2">
                      <TaskStatusIcon status={option.value} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      <ErrorMessage
        errors={errors}
        name={name as unknown as never}
        render={({ message }) => (
          <p className={cn('text-left text-sm text-(--destructive)')}>
            {message}
          </p>
        )}
      />
    </>
  );
}
