import { getProfileFoto, logout } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import useAuth from "@/hooks/useAuth";

const UserMenu = () => {
    const { user, isLoading, isError } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutate: signOut } = useMutation({
        mutationFn: logout,
        onSettled: () => {
            queryClient.clear();
            navigate({ to: "/login" });
        },
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer w-10 h-10">
                    <AvatarImage
                        className="h-full w-full"
                        src={user?.presignedUrl}
                    />
                    <AvatarFallback>Profile</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-200">
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
