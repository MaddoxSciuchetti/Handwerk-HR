import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/trycatch';
import { CalendarDays, ChevronRight } from 'lucide-react';
import useEmployeeGroups from '../../hooks/useEmployeeGroups';
import { TAccordion } from '../../types/employeeData.types';

export function EmployeeTabsData({ onTaskClick, user, cleanData }: TAccordion) {
  const { employeeGroups, hasNoOpenTasks } = useEmployeeGroups(user, cleanData);

  if (hasNoOpenTasks)
    return (
      <div className="text-left text-muted-foreground">
        Keine offenen Aufgaben
      </div>
    );

  return (
    <>
      <Accordion type="single" collapsible className="space-y-2">
        {employeeGroups.map(([employeeId, group]) => (
          <AccordionItem
            key={employeeId}
            value={employeeId}
            className={cn(
              'overflow-hidden rounded-xl border border-b transition-colors last:border-b',
              'border-border data-[state=open]:border-foreground/50'
            )}
          >
            <AccordionTrigger className="group px-4 py-3 hover:no-underline">
              <div className="flex min-w-0 items-center gap-2.5">
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />

                <span className="truncate text-base font-medium text-foreground">
                  {group.employee.vorname} {group.employee.nachname}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="border-t p-0">
              <div className="divide-y">
                {group.inputs.map((task) => {
                  const statusLabel =
                    task.status === 'null' ? 'Nicht angefangen' : task.status;

                  return (
                    <button
                      type="button"
                      key={`${task.form_field_id}-${task.timestamp.toISOString()}`}
                      onClick={onTaskClick}
                      className="flex w-full items-start gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {task.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {task.timeStampLastChange.toLocaleDateString(
                              'de-DE'
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-4  pt-3 text-xs text-muted-foreground">
        Klicke auf eine Aufgabe, um Details zu öffnen
      </p>
    </>
  );
}
