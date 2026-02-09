import { TEmployForm } from "@/features/Ceo_Dashboard";
import { useMemo } from "react";

function useHandwerkerProBSBEmployee(allEmployeeData: TEmployForm | undefined) {
    return useMemo(() => {
        if (!allEmployeeData) return [];
        const ownerToUserMap = new Map<string, TEmployForm[0]>();
        allEmployeeData.forEach((item) => {
            if (!ownerToUserMap.has(item.owner)) {
                ownerToUserMap.set(item.owner, item);
            }
        });
        return Array.from(ownerToUserMap.values());
    }, [allEmployeeData]);
}

export default useHandwerkerProBSBEmployee;
