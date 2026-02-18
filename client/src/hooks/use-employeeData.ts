import { specificEmployeeData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

function useEmployeeData() {
    const {
        data: EmployeeData,
        isLoading,
        error,
        isError,
    } = useQuery({
        queryKey: ["EmployeeDataSpecifics"],
        queryFn: specificEmployeeData,
    });

    return {
        EmployeeData,
        isLoading,
        ErrorEmployee: error,
        isError,
    };
}

export default useEmployeeData;
