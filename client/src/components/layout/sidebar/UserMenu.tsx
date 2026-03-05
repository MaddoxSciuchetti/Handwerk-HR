import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { logout } from '@/apis/index.apis';
import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

const UserMenu = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery<string>({
    queryKey: [PROFILEPICTURE],
    queryFn: getProfilePhoto,
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
          <img
            className="h-full w-full"
            src={
              data === undefined
                ? 'https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg'
                : data
            }
            alt="profile image"
          />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-200">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate({ to: '/profile' })}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
