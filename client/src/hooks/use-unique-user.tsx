import { TEmployForm } from "@/features/Ceo_Dashboard";
import { useMemo } from "react";

function useUniqueUser(chefdata: TEmployForm | undefined) {
  return useMemo(() => {
    if (!chefdata) return [];
    const ownerToUserMap = new Map<string, TEmployForm[0]>();
    chefdata.forEach((item) => {
      if (!ownerToUserMap.has(item.owner)) {
        ownerToUserMap.set(item.owner, item);
      }
    });
    return Array.from(ownerToUserMap.values());
  }, [chefdata]);
}

export default useUniqueUser;
