import { TEmployForm } from "@/features/Ceo_Dashboard";
import { fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import useHandwerkerProBSBEmployee from "./use-unique-user";
import { threeDaysAgo } from "@/lib/utils";

function useCeoDashboard() {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [modal, setModalOpen] = useState<boolean>(false);
    const {
        data: allEmployeeData,
        isLoading,
        error,
    } = useQuery<TEmployForm>({
        queryKey: ["ceo-dashboard"],
        queryFn: fetchChefData,
    });

    console.log("all employee data:");
    console.log(allEmployeeData);

    const cleanData = useMemo(() => {
        if (!allEmployeeData) return [];
        const groups = new Map<string, TEmployForm>();
        allEmployeeData.forEach((item) => {
            if (!groups.has(item.owner)) {
                groups.set(item.owner, []);
            }
        });

        groups.forEach((_, key) => {
            const originalInputs = allEmployeeData
                .filter((item) => item.owner === key)
                .map((item) => ({
                    ...item,
                    inputs: item.inputs.filter(
                        (input) => input.status !== "erledigt",
                        // new Date(input.timestamp) < threeDaysAgo,
                    ),
                }));
            groups.set(key, originalInputs);
        });
        return Array.from(groups.entries());
    }, [allEmployeeData, threeDaysAgo]);

    console.log("cleaned data:");
    console.log(cleanData);

    return {
        allEmployeeData,
        selectedUser,
        setSelectedUser,
        modal,
        setModalOpen,
        isLoading,
        error,
        cleanData,
    };
}

export default useCeoDashboard;
