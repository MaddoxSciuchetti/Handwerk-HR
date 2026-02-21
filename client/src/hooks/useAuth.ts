import { useQuery } from "@tanstack/react-query";
import { getUser } from "../lib/api";

export const AUTH = "auth";

export type User = {
    id: string;
    email: string;
    verified: boolean;
    user_permission: "CHEF" | "MITARBEITER";
    createdAt: Date;
    updatedAt: Date;
    vorname: string;
    nachname: string;
    presignedUrl?: string;
};

type Auth = {
    user: User | undefined;
    isLoading: boolean;
    isError: boolean;
};

const useAuth = (opts: Record<string, any> = {}): Auth => {
    const {
        data: user,
        isLoading,
        isError,
    } = useQuery<User>({
        queryKey: [AUTH],
        queryFn: getUser,
        staleTime: Infinity,
    });

    return {
        user,
        isLoading,
        isError,
    };
};

export default useAuth;
