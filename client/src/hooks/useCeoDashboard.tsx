import { TEmployForm } from "@/features/Ceo_Dashboard";
import { fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import useUniqueUser from "./use-unique-user";

function useCeoDashboard() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [modal, setModalOpen] = useState<boolean>(false);

  // custom hook implementation
  const {
    data: chefdata,
    isLoading,
    error,
  } = useQuery<TEmployForm>({
    queryKey: ["ceo-dashboard"],
    queryFn: fetchChefData,
  });
  const uniqueUsersByOwner = useUniqueUser(chefdata);
  console.log(uniqueUsersByOwner);

  const selectUserData = useMemo(
    () => chefdata?.filter((item) => item.owner === selectedUser) || [],
    [selectedUser, chefdata],
  );

  console.log(selectUserData);
  return {
    selectedUser,
    setSelectedUser,
    modal,
    setModalOpen,
    chefdata,
    uniqueUsersByOwner,
    selectUserData,
    isLoading,
    error,
  };
}

export default useCeoDashboard;
