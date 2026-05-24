import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useState } from 'react';
import HistoryContent from './HistoryContent';

type TaskHistoryProps = {
  taskId: string;
  currentUserId?: string;
  onEditComment?: (commentId: string, body: string) => void;
};

const TaskHistory = ({
  taskId,
  currentUserId,
  onEditComment,
}: TaskHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        aria-expanded={isOpen}
        className="border-border h-auto w-full justify-between rounded-2xl p-2"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Clock className="text-muted-foreground ml-2 h-4 w-4" />
          Bearbeitungsverlauf
        </span>
        {isOpen ? (
          <ChevronUp className="text-muted-foreground mr-2 size-4 shrink-0" />
        ) : (
          <ChevronDown className="text-muted-foreground mr-2 size-4 shrink-0" />
        )}
      </Button>
      {isOpen ? (
        <div className="mt-5 pb-6">
          <HistoryContent
            taskId={taskId}
            currentUserId={currentUserId}
            onEditComment={onEditComment}
          />
        </div>
      ) : null}
    </div>
  );
};

export default TaskHistory;
