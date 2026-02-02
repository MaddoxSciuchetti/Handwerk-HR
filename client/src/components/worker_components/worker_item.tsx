import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileModal } from "../file-exports/FileExport-Modal";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useProcessData,
  useProcessDataContext,
} from "@/contexts/ProcessDataContext";

interface ToDoItem {
  item_value: number;

  item: string;
  form_type: string;
  gotopage: (taskId: number, form_type: any) => void;
  onRemove: (value_item: number) => void;
}

export function Worker_Item({
  form_type,
  item_value,

  item,
  gotopage,
  onRemove,
}: ToDoItem) {
  const [modal, setModal] = useState<boolean>(false);

  // const {
  //   data: getScore,
  //   isLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ["getScore", item_value],
  //   queryFn: () => fetchScoreData,
  // });

  const {
    data: processData,
    isLoading: processLoading,
    completedTasksCount,
  } = useProcessData(item_value, form_type);

  return (
    <>
      <tr>
        <td className="text-xl">{item}</td>

        <td
          className={`${
            form_type === "Onboarding"
              ? "bg-blue-200 font-bold text-blue-400! p-0 m-0 outline "
              : "bg-fuchsia-200 font-bold text-pink-400! rounded-2xl p-0 m-0"
          }`}
          lang="en"
        >
          {form_type}
        </td>
        <td>
          <Button
            onClick={() => gotopage(item_value, form_type)}
            variant="outline"
            size="sm"
          >
            Live thread
          </Button>
        </td>

        <th>
          {processLoading
            ? "..."
            : `${completedTasksCount}/${processData?.form?.fields?.length || 0}`}
        </th>

        <td>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">XXX</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onRemove(item_value)}>
                  Löschen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModal(true)}>
                  Export
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {modal &&
        createPortal(
          <FileModal
            id={item_value}
            onClose={setModal}
            form_type={form_type}
          />,
          document.body,
        )}
    </>
  );
}
