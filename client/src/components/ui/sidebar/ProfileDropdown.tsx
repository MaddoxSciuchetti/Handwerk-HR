import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { logout } from '@/features/auth/api/auth.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, LogOut, Moon, Settings, Sun } from 'lucide-react';

const themeItemClassName =
  'h-7 min-h-7 min-w-0 flex-1 basis-0 rounded-full border-0 bg-transparent px-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground data-[state=on]:shadow-sm';

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
  const queryClient = useQueryClient();
  const displayLabel = getDisplayLabel(user);
  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });

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
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={displayLabel || 'Profile'}
                  className="h-8 w-full min-w-0 cursor-pointer justify-start gap-2 overflow-hidden bg-transparent p-0 text-left font-normal ring-1 ring-border hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-border data-[state=open]:bg-transparent dark:hover:bg-transparent"
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
                  <div
                    className="flex min-w-0 flex-1 items-center gap-2 transition-opacity duration-150 motion-reduce:transition-none group-data-[collapsible=icon]:opacity-0"
                    aria-hidden={isCollapsed}
                  >
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {displayLabel}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </div>
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="right" hidden={!isCollapsed}>
              {displayLabel || 'Profile'}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className={isCollapsed ? 'min-w-56 rounded-lg' : 'min-w-0 rounded-lg'}
            side="bottom"
            align="start"
            sideOffset={8}
            avoidCollisions={false}
          >
            <DropdownMenuItem onClick={openSettings}>
              <Settings />
              Einstellungen
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isSigningOut}
              onClick={() => signOut()}
            >
              <LogOut />
              Abmelden
            </DropdownMenuItem>
            <div
              className="px-2 py-1.5"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ToggleGroup
                type="single"
                value={theme}
                spacing={1}
                aria-label="Erscheinungsbild"
                className="mt-1.5 w-full min-w-0 rounded-full bg-muted p-px"
                onValueChange={(next) => {
                  if (next === 'light' || next === 'dark') setTheme(next);
                }}
              >
                <ToggleGroupItem
                  value="light"
                  aria-label="Helles Design"
                  className={themeItemClassName}
                >
                  <Sun
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dark"
                  aria-label="Dunkles Design"
                  className={themeItemClassName}
                >
                  <Moon
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
