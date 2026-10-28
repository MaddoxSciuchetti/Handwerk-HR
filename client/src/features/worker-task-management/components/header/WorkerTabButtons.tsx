import { Button } from '@/components/ui/button';
import type { WorkerTab } from '../../types/index.types';

type WorkerTabButtonsProps = {
  activeTab: WorkerTab;
  hideTasks?: boolean;
  onTabChange: (tab: WorkerTab) => void;
};

export function WorkerTabButtons({
  activeTab,
  onTabChange,
  hideTasks = false,
}: WorkerTabButtonsProps) {
  return (
    <div className="mt-5 flex shrink-0 items-center gap-3">
      <Button
        type="button"
        variant={activeTab === 'information' ? 'default' : 'outline'}
        size="sm"
        className="rounded-2xl"
        onClick={() => onTabChange('information')}
      >
        Information
      </Button>
      {!hideTasks && (
        <Button
          type="button"
          variant={activeTab === 'form' ? 'default' : 'outline'}
          size="sm"
          className="rounded-2xl"
          onClick={() => onTabChange('form')}
        >
          Aufgaben
        </Button>
      )}
      <Button
        type="button"
        variant={activeTab === 'files' ? 'default' : 'outline'}
        size="sm"
        className="rounded-2xl"
        onClick={() => onTabChange('files')}
      >
        Dateien
      </Button>
    </div>
  );
}
