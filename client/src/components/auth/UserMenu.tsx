import { getProfileFoto, logout } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import useAuth from '@/hooks/use-Auth';

const UserMenu = () => {
  const { user, isLoading, isError } = useAuth();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery<string>({
    queryKey: ['profilepic'],
    queryFn: getProfileFoto,
  });

  const navigate = useNavigate();
  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer w-10 h-10">
          <img className="h-full w-full" src={data} alt="profile image" />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-200">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate({ to: '/profile' })}
        >
          Profile
        </DropdownMenuItem>
        {/* <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/settings" })}
                >
                    Einstellungen
                </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
