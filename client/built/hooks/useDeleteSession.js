import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSession } from "../lib/api";
import { SESSIONS } from "./useSessions";
const useDeleteSession = (sessionId) => {
    const queryClient = useQueryClient();
    const { mutate, ...rest } = useMutation({
        mutationFn: () => deleteSession(sessionId),
        onSuccess: () => {
            queryClient.setQueryData([SESSIONS], (cache) => {
                const updatedCache = cache?.filter((session) => session.id !== sessionId) ?? [];
                return updatedCache;
            });
        },
    });
    const updatedCache = queryClient.getQueryData([SESSIONS]);
    return { deleteSession: mutate, ...rest };
};
export default useDeleteSession;
