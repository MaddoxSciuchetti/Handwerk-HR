import { getHistoryData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
export const useGetHistory = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["formHistory", id],
        queryFn: () => getHistoryData(id),
        enabled: !!id,
    });
    return {
        historyData: data,
        isLoading,
        error,
        refetchHistory: refetch,
    };
};
