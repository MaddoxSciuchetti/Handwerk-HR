import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { useMemo } from "react";
export function AccordionDemo({ data, onTaskClick, user, cleanData, }) {
    const employeeGroups = useMemo(() => {
        return cleanData
            .filter(([owner]) => owner === user)
            .map(([owner, items]) => {
            const flatInputs = items.flatMap((task) => task.inputs.map((input) => ({
                description: task.description,
                timestamp: input.timestamp,
                form_field_id: task.form_field_id,
                status: input.status,
                employee: input.employee,
            })));
            const firstEmployee = flatInputs[0]?.employee;
            return [
                owner,
                {
                    employee: firstEmployee ?? {
                        vorname: owner,
                        nachname: "",
                        email: null,
                    },
                    inputs: flatInputs.map(({ employee, ...rest }) => rest),
                },
            ];
        })
            .filter(([, group]) => group.inputs.length > 0);
    }, [cleanData, user]);
    return (<>
            <Accordion type="single" collapsible defaultValue="shipping" className="">
                {employeeGroups.length === 0 ||
            employeeGroups[0]?.[1].inputs.length === 0 ? (<p>{user} hat keine Offenen Aufgaben</p>) : (employeeGroups.map(([employeeName, group], index) => (<AccordionItem key={employeeName} value={`employee-${index}`} className="">
                            <AccordionTrigger className="border p-2">
                                Handwerker: {group.employee.vorname}{" "}
                                {group.employee.nachname}
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col justify-center items-center  mt-5">
                                {group.inputs.length === 0 ? (<p>{user} hat keine Offenen Aufgaben</p>) : (<div className="flex flex-col gap-5 w-full ">
                                        Offene Aufgaben:
                                        {group.inputs.map((task, taskIndex) => (<div key={taskIndex} className="  p-2 mb-2 hover:bg-gray-200 rounded-2xl" onClick={onTaskClick}>
                                                <p>
                                                    <strong>Aufabe:</strong>
                                                    {task.description}
                                                </p>
                                                <p>
                                                    <strong>
                                                        Zuletzt bearbeitet:
                                                    </strong>{" "}
                                                    {task.timestamp.toLocaleDateString()}
                                                </p>
                                                <p>
                                                    <p>
                                                        <strong>Status:</strong>{" "}
                                                        {task.status === "null"
                        ? "Nicht angefangen"
                        : task.status}
                                                    </p>
                                                </p>
                                            </div>))}
                                    </div>)}
                            </AccordionContent>
                        </AccordionItem>)))}
            </Accordion>
        </>);
}
