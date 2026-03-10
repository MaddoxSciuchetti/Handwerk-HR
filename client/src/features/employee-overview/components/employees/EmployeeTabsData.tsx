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

  return (
    <>
      <Accordion
        type="single"
        collapsible
        defaultValue="shipping"
        className="w-full cursor-pointer rounded-2xl border-[0.5px] border-gray-300 "
      >
        {employeeGroups.length === 0 ||
        employeeGroups[0]?.[1].inputs.length === 0 ? (
          <p>Nutzer hat keine Offenen Aufgaben</p>
        ) : (
          employeeGroups.map(([employeeName, group], index) => (
            <AccordionItem
              key={employeeName}
              value={`employee-${index}`}
              className=" cursor-pointer rounded-xl border border-gray-200 px-3 last:mb-0"
            >
              <AccordionTrigger className="">
                Handwerker: {group.employee.vorname} {group.employee.nachname}
              </AccordionTrigger>
              <AccordionContent className="mt-2 flex flex-col items-center justify-center pb-3">
                <DataContent group={group} onTaskClick={onTaskClick} />
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
    </>
  );
}
