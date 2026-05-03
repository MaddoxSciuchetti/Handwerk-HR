import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock } from 'lucide-react';
import HistoryContent from './HistoryContent';

type TaskHistoryProps = {
  taskId: string;
  currentUserId?: string;
  onEditComment?: (commentId: string, body: string) => void;
};

const TaskHistory = ({ taskId, currentUserId, onEditComment }: TaskHistoryProps) => {
  return (
    <Accordion type="single" collapsible className="max-w-6xl">
      <AccordionItem value="history" className="mb-10">
        <AccordionTrigger className="border-border rounded-2xl border p-2">
          <div className="text-foreground flex items-center gap-2 rounded-2xl text-sm font-medium">
            <Clock className="text-muted-foreground ml-2 h-4 w-4" />
            <span>Bearbeitungsverlauf</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="mt-5">
          <HistoryContent
            taskId={taskId}
            currentUserId={currentUserId}
            onEditComment={onEditComment}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default TaskHistory;
