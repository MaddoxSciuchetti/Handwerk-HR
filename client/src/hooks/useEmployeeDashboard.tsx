import { specificEmployeeData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import useUniqueUser from "./use-unique-user";

function useEmployeeDashboard() {
  const { data: EmployeeData } = useQuery({
    queryKey: ["EmployeeData"],
    queryFn: specificEmployeeData,
  });
}
