import { Button } from "../ui/button";
import {
  ItemActions,
  ItemContent,
  ItemTitle,
  MaddoxDescription,
} from "@/components/ui/item";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";

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
  return (
    <div className="flex flex-row max-4xl mt-3 border p-4 rounded-2xl my-10 ">
      <div className="flex flex-row min-w-xl">
        <div className="text-todo itum">{/* <span>{item}</span> */}</div>
        <ItemContent className="flex">
          <ItemTitle className="text-xl">{item}</ItemTitle>
        </ItemContent>
        <div className="flex flex-row content-center gap-5">
          <ItemActions>
            <Progress className="w-30" value={33} />
            <MaddoxDescription
              className={`${
                form_type === "Onboarding"
                  ? "bg-blue-200 font-bold text-blue-400! rounded-2xl"
                  : "bg-fuchsia-200 font-bold text-pink-400! rounded-2xl"
              }`}
              lang="en"
            >
              {form_type}
            </MaddoxDescription>
            <Button
              onClick={() => gotopage(item_value, form_type)}
              variant="outline"
              size="sm"
            >
              Live thread
            </Button>
          </ItemActions>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-20  focus:outline-none">
              . . .{" "}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-200">
              <Button
                variant={"outline"}
                onClick={() => onRemove(item_value)}
                className="flex flex-row font-bold py-2 px-4 rounded"
              >
                Löschen
              </Button>
              <Button variant={"outline"}>Teilen</Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
