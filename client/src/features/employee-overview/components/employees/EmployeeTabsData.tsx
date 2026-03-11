import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import useEmployeeGroups from '../../hooks/useEmployeeGroups';
import { TAccordion } from '../../types/employeeData.types';
import DataContent from './accordion/DataContent';

export function EmployeeTabsData({ onTaskClick, user, cleanData }: TAccordion) {
  const { employeeGroups } = useEmployeeGroups(user, cleanData);

  if (
    employeeGroups.length === 0 || employeeGroups[0]?.[1].inputs.length === 0
      ? true
      : false
  )
    return (
      <div className="text-left text-muted-foreground">
        Keine offenen Aufgaben
      </div>
    );

  return (
    <>
      <Accordion
        type="single"
        collapsible
        defaultValue="shipping"
        className="w-full cursor-pointer space-y-3"
      >
        {employeeGroups.map(([employeeName, group], index) => (
          <AccordionItem
            key={employeeName}
            value={`employee-${index}`}
            className="cursor-pointer rounded-xl border-b-0 px-3"
          >
            <AccordionTrigger className="">
              Handwerker: {group.employee.vorname} {group.employee.nachname}
            </AccordionTrigger>
            <AccordionContent className="mt-2 flex flex-col items-center justify-center pb-3">
              <DataContent group={group} onTaskClick={onTaskClick} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
