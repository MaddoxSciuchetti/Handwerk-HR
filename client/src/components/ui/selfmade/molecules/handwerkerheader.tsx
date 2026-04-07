import { ChevronUpIcon } from 'lucide-react';
import { SelectDropdown } from '../selectdropdown';
import { ToggleSwitch } from '../toggleButton';

export function HandwerkerHeader() {
  return (
    <div className="flex items-center py-6 gap-2 items-center  ">
      <div className="flex flex-grow">
        <p className="items-center">Handwerker</p>
      </div>
      <div className="flex items-center gap-2">
        <SelectDropdown state="Open" size="lg" icon={ChevronUpIcon} />
        <ToggleSwitch />
      </div>
    </div>
  );
}
