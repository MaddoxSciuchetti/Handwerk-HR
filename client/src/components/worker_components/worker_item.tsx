import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <th>8/10</th>

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
              <DropdownMenuItem>Export</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
