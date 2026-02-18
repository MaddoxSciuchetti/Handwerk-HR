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
import { OffboardingItem } from "@/features/OnOf_Home";
import { Worker_Item } from "./worker_components/worker_item";

type HandwerkerTableProps = {
    filtered: OffboardingItem[] | undefined;
    item_value?: number;
    form_type: (item: OffboardingItem) => string;
    onRemove: (taskId: number) => void;
    gotopage: (taskId: number, form_type: any) => void;
};

function HandwerkerTable({
    filtered,
    form_type,
    onRemove,
    gotopage,
}: HandwerkerTableProps) {
    return (
        <>
            <Table className=" text-left">
                <TableHeader className="outline">
                    <TableRow className="text-lg">
                        <TableHead className="text-left  pl-0">
                            Handwerker
                        </TableHead>
                        <TableHead className="text-left  pl-0">Phase</TableHead>

                        <TableHead className=" pl-0">Fortschritt</TableHead>
                        <TableHead className=" pl-0">Aktionen</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered?.map((task: OffboardingItem) => (
                        <Worker_Item
                            key={task.id}
                            item_value={task.id}
                            form_type={form_type(task)}
                            item={task.vorname}
                            item1={task.nachname}
                            onRemove={onRemove}
                            gotopage={gotopage}
                        />
                    ))}
                </TableBody>
            </Table>
        </>
    );
}

export default HandwerkerTable;
