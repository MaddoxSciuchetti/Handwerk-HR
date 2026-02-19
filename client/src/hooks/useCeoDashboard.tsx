import { TEmployForm } from "@/features/Ceo_Dashboard";
import { fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import useHandwerkerProBSBEmployee from "./use-unique-user";

function useCeoDashboard() {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [modal, setModalOpen] = useState<boolean>(false);

    // custom hook implementation
    const {
        data: allEmployeeData,
        isLoading,
        error,
    } = useQuery<TEmployForm>({
        queryKey: ["ceo-dashboard"],
        queryFn: fetchChefData,
    });
    const uniqueHandwerkerProBSBEmployee =
        useHandwerkerProBSBEmployee(allEmployeeData);
    console.log("unique users by auth_id");
    console.log(uniqueHandwerkerProBSBEmployee);

    const currentBSBEmployee = useMemo(
        () =>
            allEmployeeData?.filter((item) => item.owner === selectedUser) ||
            [],
        [selectedUser, allEmployeeData],
    );
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

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
                        (input) =>
                            input.status !== "erledigt" &&
                            new Date(input.timestamp) < threeDaysAgo,
                    ),
                }));
            groups.set(key, originalInputs);
        });
        return Array.from(groups.entries());
    }, [allEmployeeData, threeDaysAgo]);

    console.log("current BSB Employee Data:");
    console.log(currentBSBEmployee);

    return {
        selectedUser,
        setSelectedUser,
        modal,
        setModalOpen,
        allEmployeeData,
        uniqueHandwerkerProBSBEmployee,
        currentBSBEmployee,
        isLoading,
        error,
        cleanData,
    };
}

export default useCeoDashboard;
