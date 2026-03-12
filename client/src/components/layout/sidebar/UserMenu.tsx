import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { logout } from '@/apis/index.apis';
import { Input } from '@/components/ui/input';
import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { userProfileMutations } from '@/features/user-profile/query-options/mutations/user-profile.mutations';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Moon, Sun, Upload } from 'lucide-react';
import { useRef } from 'react';

const UserMenu = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggle } = useThemeProvider();

  const { data } = useQuery<string>({
    queryKey: [PROFILEPICTURE],
    queryFn: getProfilePhoto,
  });

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });

  const uploadPhotoMutation = useMutation(userProfileMutations.uploadFoto());

  const handleUploadPhotoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadPhotoMutation.mutate({ file: Array.from(files) });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer h-10 w-10 rounded-xl  bg-background">
          <AvatarImage
            className="h-full w-full rounded-xl"
            src={data}
            alt="profile image"
          />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-40 rounded-xl border border-border bg-(--dropdown-surface) p-1.5 text-popover-foreground shadow-md [&>[data-slot=dropdown-menu-item]:last-child]:mt-1.5 [&>[data-slot=dropdown-menu-item]:last-child]:border-t [&>[data-slot=dropdown-menu-item]:last-child]:border-border [&>[data-slot=dropdown-menu-item]:last-child]:pt-2"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm font-medium focus:bg-accent focus:text-accent-foreground "
          onClick={() => fileInputRef.current?.click()}
        >
          Profile Foto
          <Upload className="ml-2 h-4 w-4 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm font-medium focus:bg-accent focus:text-accent-foreground "
          onClick={toggle}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          {theme === 'dark' ? (
            <Sun className="ml-2 h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="ml-2 h-4 w-4 text-muted-foreground" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm font-medium focus:bg-accent focus:text-accent-foreground "
          onClick={() => signOut()}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleUploadPhotoSelect(e.target.files);
          e.currentTarget.value = '';
        }}
      />
    </DropdownMenu>
  );
};

export default UserMenu;
