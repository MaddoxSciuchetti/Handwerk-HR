import { Button } from '@/components/ui/button';
import type { WorkerTab } from '../../types/index.types';

type WorkerTabButtonsProps = {
  activeTab: WorkerTab;
  onTabChange: (tab: WorkerTab) => void;
};

export function WorkerTabButtons({
  activeTab,
  onTabChange,
}: WorkerTabButtonsProps) {
  return (
    <div className="mt-5 flex shrink-0 items-center gap-3">
      <Button
        type="button"
        variant={activeTab === 'form' ? 'default' : 'outline'}
        size="sm"
        className="rounded-2xl"
        onClick={() => onTabChange('form')}
      >
        Aufgaben
      </Button>
      <Button
        type="button"
        variant={activeTab === 'files' ? 'default' : 'outline'}
        size="sm"
        className="rounded-2xl"
        onClick={() => onTabChange('files')}
      >
        Dateien
      </Button>
      <Button
        type="button"
        variant={activeTab === 'materials' ? 'default' : 'outline'}
        size="sm"
        className="rounded-2xl"
        data-testid="materials-tab-button"
        onClick={() => onTabChange('materials')}
      >
        Materialien
      </Button>
    </div>
  );
}
