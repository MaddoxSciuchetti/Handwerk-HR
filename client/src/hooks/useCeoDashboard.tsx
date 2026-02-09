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
    console.log("unique users by owner");
    console.log(uniqueHandwerkerProBSBEmployee);

    const currentBSBEmployee = useMemo(
        () =>
            allEmployeeData?.filter((item) => item.owner === selectedUser) ||
            [],
        [selectedUser, allEmployeeData],
    );

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
    };
}

export default useCeoDashboard;
