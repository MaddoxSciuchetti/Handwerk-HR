import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import type { WorkerTab } from '../../types/index.types';

type WorkerHeaderProps = {
  activeTab: WorkerTab;
  openForCreate: () => void;
  onOpenFileUpload: () => void;
  onExportFiles: () => void;
};

const WorkerHeader = ({
  activeTab,
  openForCreate,
  onOpenFileUpload,
  onExportFiles,
}: WorkerHeaderProps) => {
  const title = activeTab === 'form' ? 'Aufgaben' : 'Dateien';

  return (
    <>
      <CardTitle className="text-base font-medium">{title}</CardTitle>
      <div className="flex h-8 shrink-0 items-center gap-3">
        {activeTab === 'form' ? (
          <Button type="button" className="rounded-2xl" onClick={openForCreate}>
            Aufgabe hinzufügen
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              data-testid="open-file-upload"
              onClick={onOpenFileUpload}
            >
              Hochladen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={onExportFiles}
            >
              Exportieren
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default WorkerHeader;
