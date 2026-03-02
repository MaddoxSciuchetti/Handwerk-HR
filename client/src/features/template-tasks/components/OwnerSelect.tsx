import { Dispatch, SetStateAction } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { ErrorMessage } from '@hookform/error-message';
import { HandleAddSubmit } from '../types/taskForm.types';

type OwnerSelectProps = {
  control: Control<HandleAddSubmit, any, HandleAddSubmit>;
  selectedValue: string;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: EmployeeDataArray | undefined;
  errors: FieldErrors<HandleAddSubmit>;
};

const OwnerSelect = ({ errors, control, EmployeeData }: OwnerSelectProps) => {
  return (
    <>
      <div className="">
        <Controller
          name="owner"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="owner" name="owner" className="w-71">
                <SelectValue placeholder="Mitarbeiter" />
              </SelectTrigger>
              <SelectContent className="border-none">
                <SelectGroup className="bg-white cursor-pointer">
                  {EmployeeData?.map((item) => (
                    <SelectItem
                      className="hover:bg-gray-200 cursor-pointer"
                      id={`select-${item.id}`}
                      value={item.id}
                      key={item.id}
                    >
                      {item.vorname} {item.nachname}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <ErrorMessage
          errors={errors}
          name={'owner'}
          render={({ message }) => (
            <p className="text-red-400 text-left text-sm mt-5">{message}</p>
          )}
        />
      </div>
    </>
  );
};

export default OwnerSelect;
