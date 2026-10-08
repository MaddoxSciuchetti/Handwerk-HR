import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useState } from 'react';
import WorkerEngagementInfoModal from './WorkerEngagementInfoModal';

type WorkerEngagementInfoButtonProps = {
  workerId: string;
};

function WorkerEngagementInfoButton({
  workerId,
}: WorkerEngagementInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Handwerker Informationen"
        className="cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        <Info className="h-4 w-4" />
      </Button>
      <WorkerEngagementInfoModal
        isOpen={isOpen}
        workerId={workerId}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default WorkerEngagementInfoButton;
