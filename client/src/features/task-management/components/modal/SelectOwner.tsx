import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dispatch, SetStateAction } from 'react';
import { STATUS_MAP } from '../../utils/selectOptionTernary';

type SelectOwnerProps = {
  setSelectedValue: Dispatch<SetStateAction<string>>;
  selectedValue: string;
  select_option: string;
};

const SelectOwner = ({
  setSelectedValue,
  selectedValue,
  select_option,
}: SelectOwnerProps) => {
  return (
    <>
      <Select value={selectedValue} onValueChange={setSelectedValue}>
        <SelectTrigger
          id="status"
          name="select_option"
          value={select_option}
          className={`px-3 py-1 text-sm w-71 rounded-xl ${STATUS_MAP[selectedValue]?.className ?? 'bg-red-200'}`}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="border-none ">
          <SelectGroup className="bg-white cursor-pointer">
            <SelectItem
              className="hover:bg-gray-200 cursor-pointer"
              id="select1"
              value="offen"
            >
              Offen
            </SelectItem>
            <SelectItem
              className="hover:bg-gray-200 cursor-pointer"
              id="select2"
              value="in_bearbeitung"
            >
              In Bearbeitung
            </SelectItem>
            <SelectItem
              className="hover:bg-gray-200 cursor-pointer"
              id="select3"
              value="erledigt"
            >
              Erledigt
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectOwner;
