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
import { useSidebar } from "../ui/sidebar";
import { useToggleModal } from "@/hooks/use-toggleModal";

interface ToDoItem {
  item_value: number;
  item: string;
  form_type: string;
  gotopage: (taskId: number, form_type: any) => void;
  onRemove: (value_item: number) => void;
  className?: string;
}

export function Worker_Item({
  form_type,
  item_value,
  item,
  gotopage,
  onRemove,
  className,

  ...props
}: ToDoItem) {
  // const [modal, setModal] = useState<boolean>(false);

  // const { toggleSidebar } = useSidebar();
  const { modal, setModal, toggleModal } = useToggleModal();
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
      <tr
        onClick={() => gotopage(item_value, form_type)}
        className="hover:bg-gray-50 rounded-2xl cursor-pointer border-seperate border-spacing-y-2 py-5"
      >
        <td className="text-sm font-semibold">{item}</td>

        <td
          className={
            form_type === "Onboarding"
              ? "text-sm underline decoration-2 decoration-sky-400 justify-center items-center py-5"
              : "text-sm underline decoration-2 decoration-red-400 justify-center items-center py-5"
          }
          lang="en"
        >
          {form_type}
        </td>

        <th className="">
          <span
            className={
              completedTasksCount === null
                ? "text-red-500"
                : completedTasksCount <= 5
                  ? "text-red-600"
                  : completedTasksCount < 12
                    ? "text-orange-300"
                    : completedTasksCount >= 13
                      ? "text-green-500"
                      : ""
            }
          >
            {processLoading ? "..." : completedTasksCount}
          </span>
          <span className="text-black font-medium">
            /{processData?.form?.fields?.length || 0}
          </span>
        </th>

        <td>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <img
                className="hover:scale-110"
                src="/public/assets/Edit React Icon.svg"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-40 bg-gray-100`} align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="hover:bg-gray-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item_value);
                  }}
                >
                  Löschen
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-gray-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModal();
                  }}
                >
                  Export
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {modal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={toggleModal}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <FileModal id={item_value} form_type={form_type} />
        </div>
      )}
    </>
  );
}
