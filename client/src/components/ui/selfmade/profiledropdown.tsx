import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, Settings } from 'lucide-react';
import { ProfileThemeToggle } from './profileThemeToggle';

const getDisplayLabel = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user) return '';
  const firstAndLast = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return user.displayName || firstAndLast || user.email || '';
};

const getInitials = (label: string) =>
  label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function ProfileDropdown({
  setIsSettingOpen,
  subscriptionLocked,
}: {
  setIsSettingOpen: (isSettingOpen: boolean) => void;
  subscriptionLocked: boolean;
}) {
  const { user } = useAuth();
  const { theme, setTheme } = useThemeProvider();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { data: profilePhoto } = useQuery({
    ...userProfileQueries.ProfileFoto(),
    retry: false,
  });
  const navigate = useNavigate();
  const displayLabel = getDisplayLabel(user);

  const openSettings = () => {
    setIsSettingOpen(true);
    navigate({
      to: subscriptionLocked ? '/settings/payments' : '/settings/profile',
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex w-full min-w-0 items-center gap-2 bg-transparent p-0 text-left outline-none',
                    'hover:bg-transparent focus-visible:outline-none focus-visible:ring-0',
                    'data-[state=open]:bg-transparent',
                    isCollapsed && 'size-8 justify-center'
                  )}
                >
                  <Avatar className="size-8 shrink-0 rounded-full">
                    <AvatarImage
                      src={profilePhoto}
                      alt={displayLabel}
                      className="rounded-full"
                    />
                    <AvatarFallback className="rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {getInitials(displayLabel || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed ? (
                    <>
                      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{displayLabel}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                    </>
                  ) : null}
                </button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="right" hidden={!isCollapsed}>
              {displayLabel || 'Profile'}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={8}
            avoidCollisions={false}
          >
            <DropdownMenuItem onClick={openSettings}>
              <Settings />
              Einstellungen
            </DropdownMenuItem>
            <div className="px-2 py-1.5">
              <ProfileThemeToggle
                theme={theme}
                setTheme={setTheme}
                onDone={() => {}}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
