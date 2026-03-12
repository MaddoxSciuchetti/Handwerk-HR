import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock } from 'lucide-react';
import HistoryContent from './HistoryContent';

type TaskHistoryProps = {
  id_original: number;
};

const TaskHistory = ({ id_original }: TaskHistoryProps) => {
  return (
    <>
      <Accordion type="single" collapsible className="max-w-6xl">
        <AccordionItem value="shipping" className="mb-10  ">
          <AccordionTrigger className="border-border border p-2  rounded-2xl ">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground rounded-2xl">
              <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
              <span>Bearbeitungsverlauf</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="mt-5">
            <HistoryContent id_original={id_original} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default TaskHistory;
