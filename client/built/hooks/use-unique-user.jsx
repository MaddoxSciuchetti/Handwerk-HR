import { useMemo } from "react";
function useHandwerkerProBSBEmployee(allEmployeeData) {
    return useMemo(() => {
        if (!allEmployeeData)
            return [];
        const ownerToUserMap = new Map();
        allEmployeeData.forEach((item) => {
            if (!ownerToUserMap.has(item.owner)) {
                ownerToUserMap.set(item.owner, item);
            }
        });
        return Array.from(ownerToUserMap.values());
    }, [allEmployeeData]);
}
export default useHandwerkerProBSBEmployee;
