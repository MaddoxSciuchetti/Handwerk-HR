import useAuth from '@/features/user-profile/hooks/useAuth';
import { ChevronUpIcon } from 'lucide-react';
import { Avatar } from './avatar';
import { SelectDropdown } from './selectdropdown';

export function ProfileDropdown() {
  const { user } = useAuth();
  return (
    <div className="flex flex-row  rounded-md  items-center w-full gap-2">
      <Avatar variant="image" src={user?.presignedUrl} alt="Profile" />
      <SelectDropdown
        label={user?.vorname}
        state="Default"
        size="sm"
        icon={ChevronUpIcon}
      />
    </div>
  );
}
