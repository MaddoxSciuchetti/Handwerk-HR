import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { TEmployForm } from "@/features/Ceo_Dashboard";
import { fetchNameData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import AdminModal from "./AdminModal";

type TAccordion = {
    data: TEmployForm;
    onTaskClick: () => void;
};

export type EmployeeGroup = {
    employee: { vorname: string; nachname: string; email: string | null };
    inputs: Array<{
        description: string;
        timestamp: Date;
        form_field_id: number;
        status: string;
    }>;
};

export function AccordionDemo({ data, onTaskClick }: TAccordion) {
    const employeeGroups = useMemo(() => {
        const groups = new Map<string, EmployeeGroup>();

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const finishedTasks = data.map((task) => ({
            ...task,
            inputs: task.inputs.filter(
                (input) =>
                    input.status !== "erledigt" &&
                    new Date(input.timestamp) < threeDaysAgo,
            ),
        }));

        finishedTasks.forEach((taskInfo) => {
            taskInfo.inputs.forEach((input) => {
                const employeeKey = `${input.employee.id}${input.employee.vorname} ${input.employee.nachname}`;

                if (!groups.has(employeeKey)) {
                    groups.set(employeeKey, {
                        employee: input.employee,
                        inputs: [],
                    });
                }

                groups.get(employeeKey)!.inputs.push({
                    description: taskInfo.description,
                    timestamp: input.timestamp,
                    form_field_id: taskInfo.form_field_id,
                    status: input.status,
                });
            });
        });
        return Array.from(groups.entries());
    }, [data]);

    console.log("employee groupes");
    console.log(employeeGroups);

    return (
        <>
            <Accordion
                type="single"
                collapsible
                defaultValue="shipping"
                className=""
            >
                {employeeGroups.map(([employeeName, group], index) => (
                    <AccordionItem
                        key={employeeName}
                        value={`employee-${index}`}
                        className=""
                    >
                        <AccordionTrigger className="border p-2">
                            Handwerker: {group.employee.vorname}{" "}
                            {group.employee.nachname}
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col justify-center items-center  mt-5">
                            <div className="flex flex-col gap-5 w-full ">
                                Offene Aufgaben:
                                {group.inputs.map((task, taskIndex) => (
                                    <div
                                        key={taskIndex}
                                        className="  p-2 mb-2 hover:bg-gray-200 rounded-2xl"
                                        onClick={onTaskClick}
                                    >
                                        <p>
                                            <strong>Aufabe:</strong>
                                            {task.description}
                                        </p>
                                        <p>
                                            <strong>Zuletzt bearbeitet:</strong>{" "}
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
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </>
    );
}
