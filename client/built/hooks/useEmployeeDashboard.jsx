import { specificEmployeeData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
function useEmployeeDashboard() {
    const { data: EmployeeData } = useQuery({
        queryKey: ["EmployeeData"],
        queryFn: specificEmployeeData,
    });
}
