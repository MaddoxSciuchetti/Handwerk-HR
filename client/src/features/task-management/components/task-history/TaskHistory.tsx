import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import HistoryContent from './HistoryContent';

type TaskHistoryProps = {
  id_original: number;
};

const TaskHistory = ({ id_original }: TaskHistoryProps) => {
  return (
    <>
      <Accordion type="single" collapsible className="max-w-6xl">
        <AccordionItem value="shipping" className="mb-10 ">
          <AccordionTrigger className=" -blue-600 border-2 p-2 border-gray-300">
            Bearbeitungsverlauf
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
