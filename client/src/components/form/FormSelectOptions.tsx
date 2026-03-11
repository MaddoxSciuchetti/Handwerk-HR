import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';

import { ErrorMessage } from '@hookform/error-message';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type FormSelectOptionsProps<T extends FieldValues> = {
  control: Control<T>;
  errors: FieldErrors<T>;
  data: { value: string; label: string }[];
  name: Path<T>;
  placeholder: string;
  label?: string;
};

const FormSelectOptions = <T extends FieldValues>({
  control,
  data,
  errors,
  name,
  placeholder,
  label,
}: FormSelectOptionsProps<T>) => {
  return (
    <>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} name={name} className="w-full rounded-xl">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="border border-border bg-popover bg-(--popover) text-popover-foreground">
              <SelectGroup className="cursor-pointer">
                {data?.map((item) => (
                  <SelectItem
                    className="cursor-pointer"
                    id={`select-${item.value}`}
                    value={item.value}
                    key={item.value}
                  >
                    {item.label}
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
          <p className=" text-left text-sm text-(--destructive)">{message}</p>
        )}
      />
    </>
  );
};

export default FormSelectOptions;
