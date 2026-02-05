import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import z, { success } from "zod";
import { API_URL } from "../api";
import Form from "@/components/worker_components/worker_form_data";
import { Mappingform } from "../schemas/Task";

import { APIResponse } from "../types/api_response";
import PreviewComponent from "@/components/worker_components/preivew_component";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Worker_Backround from "@/components/backround_worker";

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

export type form_field = {
  id: number;
  form_field_id: number;
  description: string;
  owner: string;
  status: string;
  edit: string;
};

export type api_Response = {
  user: {
    id: number;
    name: string;
  };
  form: {
    id: number;
    type: string;
    fields: form_field[];
  };
};

const formSchema = z.object({
  id: z.string(),
  editcomment: z.string(),
  select_option: z.string(),
  form_field_id: z.string(),
});

type OffboardingFormProps = {
  id: number;
  search: { param1: string }; // match validateSearch
};

const OnOf_Worker_Procedure: React.FC<OffboardingFormProps> = ({
  id,
  search,
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    selectedItem: {
      id: number;
      description: string;
      editcomment: string;
      select_option: string;
      form_field_id: number;
    } | null;
  }>({
    isOpen: false,
    selectedItem: null,
  });

  const queryClient = useQueryClient();

  const [activetab, setActiveTab] = useState<string>("form");

  const { user, isError } = useAuth();

  const { data, error, isLoading } = useQuery<api_Response, Error>({
    queryKey: ["somethingelse", id],
    queryFn: () => fetchFormattedData(),
  });

  async function sendFormData(formData: Mappingform): Promise<APIResponse> {
    const url = `${API_URL}/offboarding/editdata`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();

      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "unkown error",
      };
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const formValues = Object.fromEntries(formData);

      const result = formSchema.safeParse(formValues);

      if (!result.success) {
        console.log("validation errors", result.error);
        return;
      }
      console.log("=== HandleSubmit ====");
      console.log("Begin form result", result);
      console.log(result.data.id);

      if (!user) {
        console.log("user not authenticated");
        return;
      }

      await insertHistoryData(result.data, user);
      queryClient.invalidateQueries({
        queryKey: ["formHistory", parseInt(result.data.id)],
      });

      // await getHistoryData(result.data.id);

      const response = await sendFormData(result.data);
      if (response.success) {
        await queryClient.invalidateQueries({
          queryKey: ["somethingelse", id],
        });

        setModalState({ isOpen: false, selectedItem: null });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchFormattedData(): Promise<api_Response> {
    const res = await fetch(
      `${API_URL}/offboarding/user/${id}?param1=${search.param1}`,
    );

    if (!res.ok) {
      throw new Error("response not ok");
    }
    console.log("=== Fetch formData === ");
    const response = await res.json();
    console.log(response);

    return response;
  }

  if (error) {
    // component
    return <div>This is a error {error.message}</div>;
  }
  if (isLoading) {
    // component
    return <div>Still loading</div>;
  }

  async function openEditModal(
    id: number,
    description: string,
    editcomment: string,
    select_option: string,
    form_field_id: number,
  ) {
    setModalState({
      isOpen: true,
      selectedItem: {
        id,
        description,
        editcomment,
        select_option,
        form_field_id,
      },
    });
  }

  function closeModal() {
    setModalState({
      isOpen: false,
      selectedItem: null,
    });
  }

  type insertHistoryDataType = z.infer<typeof formSchema>;

  type user_verified = {
    createdAt: string;
    email: string;
    id: string;
    updatedAt: string;
    verified: boolean;
  };

  async function insertHistoryData(
    result: insertHistoryDataType,
    user: user_verified,
  ) {
    try {
      const response = await fetch(`${API_URL}/offboarding/editHisoryData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result,
          user,
        }),
      });
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      const result_API = await response.json();
      return { success: true, affectedRows: result_API };
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div className="flex flex-col fixed w-full max-w-5xl h-150 rounded-2xl mx-auto  shadow-gray-200 shadow-lg overflow-auto p-6 ">
        <div className="w-max flex justify gap-5">
          <Button
            variant={"outline"}
            className={activetab === "form" ? "active" : ""}
            onClick={() => setActiveTab("form")}
          >
            Prozess
          </Button>
          <Button
            variant={"outline"}
            className={activetab === "files" ? "active" : ""}
            onClick={() => setActiveTab("files")}
          >
            Datein
          </Button>
        </div>
        <div>
          {activetab === "files" && <Worker_Backround id={id} />}
          {activetab === "form" && (
            <div className="">
              {modalState.isOpen && modalState.selectedItem && (
                <PreviewComponent
                  onClose={closeModal}
                  id={modalState.selectedItem.id}
                  description={modalState.selectedItem.description}
                  editcomment={modalState.selectedItem.editcomment}
                  select_option={modalState.selectedItem.select_option}
                  form_field_id={modalState.selectedItem.form_field_id}
                  handleSubmit={handleSubmit}
                />
              )}

              {data?.form.fields.map((field: form_field, index: number) => (
                <Form
                  key={index}
                  id_original={field.id}
                  editcomment={field.edit}
                  select_option={field.status}
                  description={field.description}
                  owner={field.owner}
                  form_field_id={data.form.id}
                  onEdit={(
                    id,
                    description,
                    editcomment,
                    select_option,
                    form_field,
                  ) =>
                    openEditModal(
                      id,
                      description,
                      editcomment,
                      select_option,
                      form_field,
                    )
                  }
                  handleSubmit={handleSubmit}
                  // historyResult={historyResult}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OnOf_Worker_Procedure;
