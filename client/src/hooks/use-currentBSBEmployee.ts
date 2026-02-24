import { TEmployForm } from "@/features/Ceo_Dashboard";
import { useMemo } from "react";

function useCurrentBSBEmployee(
    allEmployeeData: TEmployForm | undefined,
    selectedUser: string | null,
) {
    const currentBSBEmployee = useMemo(
        () =>
            allEmployeeData?.filter((item) => item.owner === selectedUser) ||
            [],
        [selectedUser, allEmployeeData],
    );

    return {
        currentBSBEmployee,
    };
}

export default useCurrentBSBEmployee;
