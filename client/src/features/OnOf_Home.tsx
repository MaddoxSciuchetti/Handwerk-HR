import { useState, useEffect } from "react";
import { Worker_Item } from "@/components/worker_components/worker_item";
import { API_URL } from "../api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/modal/Modal";
import { useNavigate } from "@tanstack/react-router";
import { FormInputs } from "@/schemas/zodSchema";

type FormType = "Onboarding" | "Offboarding";

type EmployeeForm = {
  form_type: FormType;
};

type OffboardingItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
};

function OnOf_Home() {
  async function fetchNameData(): Promise<OffboardingItem[]> {
    const response = await (
      await fetch(`${API_URL}/offboarding/fetchData`)
    ).json();
    console.log("this is data send from server", response);
    return response;
  }

  const { data, error, isSuccess } = useQuery<OffboardingItem[]>({
    queryKey: ["offboarding"],
    queryFn: fetchNameData,
  });

  const queryClient = useQueryClient();
  const [modal, setModal] = useState<boolean>(false);

  async function removeTask(taskId: number) {
    deleteTaskMutation.mutate(taskId);
  }

  const deleteTask = async (taskId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/offboarding/delete/${taskId}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
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
    setModal(!modal);
  };

  const getFirstFormType = (item: OffboardingItem) => {
    return item.employee_forms[0]?.form_type;
  };

  return (
    <>
      <div
        className="flex justify-start pt-20 flex-col 
      min-h-screen items-center border"
      >
        <div
          className="w-full max-w-4xl border rounded-lg
         max-h-[90vh] overflow-auto flex flex-col items-center"
        >
          <div className="flex w-full p-4 ">
            <Input className="flex gap-2" />
            <Button variant={"outline"}>Filter</Button>
            <Button variant={"outline"} onClick={() => toggleModal()}>
              Neuen Mitarbeiter hinzufügen?
            </Button>
          </div>

          {/* fix any here */}
          <div className="w-full px-4">
            {data?.map((task: OffboardingItem) => (
              <Worker_Item
                key={task.id}
                item_value={task.id}
                // somewhere here the wrong id is being passed.
                form_type={getFirstFormType(task)}
                item={task.vorname}
                onRemove={removeTask}
                gotopage={handleNavigate}
              />
            ))}
          </div>

          {modal && (
            <div className="fixed inset-0 outline ">
              <Modal toggleModal={toggleModal} onSuccess={onSubmit} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OnOf_Home;
