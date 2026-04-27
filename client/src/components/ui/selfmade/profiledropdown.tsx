import useAuth from '@/features/user-profile/hooks/useAuth';
import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronUpIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { Avatar } from './avatar';
import { SelectDropdown } from './selectdropdown';

const getDisplayLabel = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return '';
  const firstAndLast = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return user.displayName || firstAndLast || user.email || '';
};

export function ProfileDropdown({
  setIsSettingOpen,
  collapsed = false,
}: {
  setIsSettingOpen: (isSettingOpen: boolean) => void;
  collapsed?: boolean;
}) {
  const { user } = useAuth();
  const { data: profilePhoto } = useQuery({
    ...userProfileQueries.ProfileFoto(),
    retry: false,
  });
  const navigate = useNavigate();

  const openSettings = () => {
    setIsSettingOpen(true);
    navigate({ to: '/settings/profile' });
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
            <Avatar variant="image" src={profilePhoto} alt="Profile" />
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
      <Avatar variant="image" src={profilePhoto} alt="Profile" />
      <SelectDropdown
        label={getDisplayLabel(user)}
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
