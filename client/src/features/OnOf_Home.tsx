import { useState, useEffect } from "react";
import { Worker_Item } from "@/components/worker_components/worker_item";
import { API_URL } from "../api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/modal/Modal";
import { useNavigate } from "@tanstack/react-router";
import { FormInputs } from "@/schemas/zodSchema";
import { fetchNameData } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type FormType = "Onboarding" | "Offboarding";

type EmployeeForm = {
  form_type: FormType;
};

export type OffboardingItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
};

function OnOf_Home() {
  const { toggleSidebar } = useSidebar();

  const { data, error, isSuccess } = useQuery<OffboardingItem[]>({
    queryKey: ["offboarding"],
    queryFn: fetchNameData,
  });

  console.log(data);

  const queryClient = useQueryClient();
  const [modal, setModal] = useState<boolean>(false);

  async function removeTask(taskId: number) {
    deleteTaskMutation.mutate(taskId);
  }

  const deleteTask = async (taskId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/offboarding/delete/${taskId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete task");
    }
    return;
  };

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboarding"] });
    },
  });

  const onSubmit = useMutation({
    mutationFn: async (data: FormInputs) => {
      const response = await fetch(
        `${API_URL}/offboarding/postoffboardingdata`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ data }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to submit");
      }
      const result = await response.json();
      console.log(result);
      return result;
    },

    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["offboarding"],
          refetchType: "all",
        });
        toggleModal();
      }
    },
    onError: (error) => {
      console.log("Submission failed", error);
    },
  });

  const navigate = useNavigate({ from: "/" });

  const handleNavigate = (taskId: number, form_type: any) => {
    navigate({
      to: "/user/$Id",
      params: { Id: String(taskId) },
      search: { param1: form_type },
    });
  };

  useEffect(() => {
    if (modal) {
      document.body.classList.add("active-modal");
    } else {
      document.body.classList.remove("active-modal");
    }
  }, [modal]);

  const toggleModal = () => {
    if (!modal) {
      setModal(true);
      toggleSidebar();
    } else {
      setModal(false);
      toggleSidebar();
    }
  };

  const getFirstFormType = (item: OffboardingItem) => {
    return item.employee_forms[0]?.form_type;
  };

  return (
    <>
      <div className=" w-full max-w-5xl h-150 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg">
        <div className="h-full flex flex-col ">
          <div className="flex items-center gap-4 mb-6">
            <Input className="" placeholder="Search" />
            <div className="flex gap-2">
              <Button variant={"outline"}>Filter</Button>
              <Button variant={"outline"} onClick={() => toggleModal()}>
                Mitarbeiter hinzufügen?
              </Button>
            </div>
          </div>

          <Table className=" text-left">
            <TableHeader className="outline">
              <TableRow className="text-lg">
                <TableHead className="text-left  pl-0">Handwerker</TableHead>
                <TableHead className="text-left  pl-0">Phase</TableHead>

                <TableHead className=" pl-0">Fortschritt</TableHead>
                <TableHead className=" pl-0">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((task: OffboardingItem) => (
                <Worker_Item
                  key={task.id}
                  item_value={task.id}
                  form_type={getFirstFormType(task)}
                  item={task.vorname}
                  onRemove={removeTask}
                  gotopage={handleNavigate}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {modal && (
          <div className="fixed inset-0 z-50 flex">
            <div
              onClick={toggleModal}
              className="fixed inset-0 bg-black/50 cursor-pointer"
              aria-label="Close modal"
            />
            <Modal className="p-4 rounded-lg" onSuccess={onSubmit} />
          </div>
        )}
      </div>
    </>
  );
}

export default OnOf_Home;
