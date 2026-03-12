import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dispatch, SetStateAction } from 'react';
import { STATUS_MAP, TaskStatus } from '../../utils/selectOptionTernary';

type SelectOwnerProps = {
  setSelectedValue: Dispatch<SetStateAction<TaskStatus>>;
  selectedValue: TaskStatus;
  select_option: TaskStatus;
};

const SelectOwner = ({
  setSelectedValue,
  selectedValue,
  select_option,
}: SelectOwnerProps) => {
  return (
    <div className="min-w-0 flex-1">
      <Select
        value={selectedValue}
        onValueChange={(value) => setSelectedValue(value as TaskStatus)}
      >
        <SelectTrigger
          id="status"
          name="select_option"
          value={select_option}
          className={`w-full min-w-0 rounded-xl px-3 py-1 text-sm ${STATUS_MAP[selectedValue]?.className ?? 'bg-(--status-error-bg) text-(--status-error-foreground)'}`}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="border border-border bg-(--dropdown-surface) text-popover-foreground">
          <SelectGroup className="cursor-pointer">
            <SelectItem className="cursor-pointer" id="select1" value="offen">
              Offen
            </SelectItem>
            <SelectItem
              className="cursor-pointer"
              id="select2"
              value="in_bearbeitung"
            >
              In Bearbeitung
            </SelectItem>
            <SelectItem
              className="cursor-pointer"
              id="select3"
              value="erledigt"
            >
              Erledigt
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectOwner;
