import { Table, TableBody, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Worker_Item } from "./worker_components/worker_item";
function HandwerkerTable({ filtered, form_type, onRemove, gotopage, }) {
    return (<>
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
                    {filtered?.map((task) => (<Worker_Item key={task.id} item_value={task.id} form_type={form_type(task)} item={task.vorname} onRemove={onRemove} gotopage={gotopage}/>))}
                </TableBody>
            </Table>
        </>);
}
export default HandwerkerTable;
