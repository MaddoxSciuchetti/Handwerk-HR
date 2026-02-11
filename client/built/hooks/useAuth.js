import { useQuery } from "@tanstack/react-query";
import { getUser } from "../lib/api";
export const AUTH = "auth";
const useAuth = (opts = {}) => {
    const { data: user, isLoading, isError, } = useQuery({
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
