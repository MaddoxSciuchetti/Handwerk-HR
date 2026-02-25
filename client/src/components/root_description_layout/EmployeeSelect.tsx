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

type EmployeeSelectProps = {
  selectedValue: string;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  EmployeeData: TEmployeeResponse | undefined;
};

const EmployeeSelect = ({
  selectedValue,
  setSelectedValue,
  EmployeeData,
}: EmployeeSelectProps) => {
  return (
    <Select value={selectedValue} onValueChange={setSelectedValue}>
      <SelectTrigger
        id="owner"
        name="owner"
        value={selectedValue}
        className="w-71"
      >
        <SelectValue placeholder="Auswählen" />
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
  );
};

export default EmployeeSelect;
