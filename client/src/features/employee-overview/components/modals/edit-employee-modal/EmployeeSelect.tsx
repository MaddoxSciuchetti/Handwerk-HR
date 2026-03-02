import { AbsenceData } from '@/features/employee-overview/types/index.types';
import { ErrorMessage } from '@hookform/error-message';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Label } from '../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';

type EmployeeSelectProps = {
  name: string;
  control: Control<any>;
  options: { label: string; value: string }[] | undefined;
  errors: FieldErrors<AbsenceData>;
  label: string;
  placeholder?: string;
};

const EmployeeSelect = ({
  name,
  control,
  options,
  placeholder,
  label,
  errors,
}: EmployeeSelectProps) => {
  return (
    <>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            {' '}
            <SelectTrigger name={name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="border-none">
              <SelectGroup className="bg-white cursor-pointer">
                {options?.map((item) => (
                  <SelectItem
                    className="hover:bg-gray-200 cursor-pointer"
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
        name={'substitute'}
        render={({ message }) => (
          <p className="text-red-400 text-sm">{message}</p>
        )}
      />
    </>
  );
};

export default EmployeeSelect;
