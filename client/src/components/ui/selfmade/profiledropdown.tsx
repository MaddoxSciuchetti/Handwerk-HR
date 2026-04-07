import { ChevronUpIcon } from 'lucide-react';
import { Avatar } from './avatar';
import { SelectDropdown } from './selectdropdown';

export function ProfileDropdown() {
  return (
    <div className="flex flex-row  rounded-md  items-center w-full gap-2">
      <Avatar variant="image" src="/assets/bsb.png" alt="Profile" />
      <SelectDropdown state="Default" size="sm" icon={ChevronUpIcon} />
    </div>
  );
}
