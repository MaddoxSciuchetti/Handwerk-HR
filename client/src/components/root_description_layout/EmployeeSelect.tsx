import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Dispatch, SetStateAction } from 'react';
import { TEmployeeResponse } from '@/zod-schemas/schema';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { HandleAddSubmit } from './RootForm';
import { ErrorMessage } from '@hookform/error-message';

type EmployeeSelectProps = {
  control: Control<HandleAddSubmit, any, HandleAddSubmit>;
  selectedValue: string;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: TEmployeeResponse | undefined;
  errors: FieldErrors<HandleAddSubmit>;
};

const EmployeeSelect = ({
  errors,
  control,
  selectedValue,
  setSelectedValue,
  EmployeeData,
}: EmployeeSelectProps) => {
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

export default EmployeeSelect;
