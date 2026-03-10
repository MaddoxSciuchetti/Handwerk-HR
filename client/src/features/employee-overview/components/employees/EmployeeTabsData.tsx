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
        className=" p-5 cursor-pointer border-[0.5px] border-gray-300 rounded-2xl w-full"
      >
        {employeeGroups.length === 0 ||
        employeeGroups[0]?.[1].inputs.length === 0 ? (
          <p>Nutzer hat keine Offenen Aufgaben</p>
        ) : (
          employeeGroups.map(([employeeName, group], index) => (
            <AccordionItem
              key={employeeName}
              value={`employee-${index}`}
              className="cursor-pointer "
            >
              <AccordionTrigger className=" p-2">
                Handwerker: {group.employee.vorname} {group.employee.nachname}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col justify-center items-center  mt-5">
                <DataContent group={group} onTaskClick={onTaskClick} />
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
    </>
  );
}
