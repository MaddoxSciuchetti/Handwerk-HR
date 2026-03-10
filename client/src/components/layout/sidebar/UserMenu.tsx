import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { logout } from '@/apis/index.apis';
import { Input } from '@/components/ui/input';
import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { userProfileMutations } from '@/features/user-profile/query-options/mutations/user-profile.mutations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useRef } from 'react';

const UserMenu = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
        className="w-35 rounded-xl border border-gray-300 bg-gray-100 p-1.5 shadow-md"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm font-medium text-gray-900 focus:bg-gray-200"
          onClick={() => fileInputRef.current?.click()}
        >
          Profile Foto
          <Upload className="ml-2 h-4 w-4 text-gray-500" />
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5 bg-gray-300" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-sm font-medium text-gray-900 focus:bg-gray-200"
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
