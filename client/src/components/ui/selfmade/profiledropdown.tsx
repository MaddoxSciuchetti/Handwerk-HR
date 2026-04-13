import useAuth from '@/features/user-profile/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { ChevronUpIcon } from 'lucide-react';
import { Avatar } from './avatar';
import { SelectDropdown } from './selectdropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';

export function ProfileDropdown({
  setIsSettingOpen,
  collapsed = false,
}: {
  setIsSettingOpen: (isSettingOpen: boolean) => void;
  collapsed?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const openSettings = () => {
    setIsSettingOpen(true);
    navigate({ to: '/settings/company' });
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={openSettings}
            className="flex w-full justify-center"
          >
            <Avatar variant="image" src={user?.presignedUrl} alt="Profile" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="bg-interactive-primary-bg px-2 py-1 text-xs text-white"
        >
          Profile
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-row  rounded-md  items-center w-full gap-2">
      <Avatar variant="image" src={user?.presignedUrl} alt="Profile" />
      <SelectDropdown
        label={user?.vorname}
        state="Default"
        size="sm"
        icon={ChevronUpIcon}
        options={[
          {
            label: 'settings',
            value: 'settings',
            action: openSettings,
          },
        ]}
        setValue={() => {}}
        value={''}
      />
    </div>
  );
}
