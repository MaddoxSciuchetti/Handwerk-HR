import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import type { WorkerTab } from '../../types/index.types';

type WorkerHeaderProps = {
  activeTab: WorkerTab;
  openForCreate: () => void;
  hideCreate?: boolean;
  onOpenFileUpload: () => void;
  onExportFiles: () => void;
  onUploadMaterials: () => void;
  materialsUploadDisabled?: boolean;
};

const titles: Record<WorkerTab, string> = {
  form: 'Aufgaben',
  files: 'Dateien',
  materials: 'Materialien',
};

const WorkerHeader = ({
  activeTab,
  openForCreate,
  hideCreate = false,
  onOpenFileUpload,
  onExportFiles,
  onUploadMaterials,
  materialsUploadDisabled = false,
}: WorkerHeaderProps) => {
  return (
    <>
      <CardTitle className="text-base font-medium">{titles[activeTab]}</CardTitle>
      <div className="flex h-8 shrink-0 items-center gap-3">
        {activeTab === 'form' && !hideCreate ? (
          <Button type="button" className="rounded-2xl" onClick={openForCreate}>
            Aufgabe hinzufügen
          </Button>
        ) : null}
        {activeTab === 'files' ? (
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
        ) : null}
        {activeTab === 'materials' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-2xl"
            data-testid="open-materials-upload"
            disabled={materialsUploadDisabled}
            onClick={onUploadMaterials}
          >
            Hochladen
          </Button>
        ) : null}
      </div>
    </>
  );
};

export default WorkerHeader;
