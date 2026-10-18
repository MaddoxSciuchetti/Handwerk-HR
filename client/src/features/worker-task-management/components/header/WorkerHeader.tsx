import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import type { WorkerTab } from '../../types/index.types';

type WorkerHeaderProps = {
  activeTab: WorkerTab;
  isLoading?: boolean;
  openForCreate: () => void;
  hideCreate?: boolean;
  onOpenFileUpload: () => void;
  onExportFiles: () => void;
  onUploadMaterials: () => void;
  materialsUploadDisabled?: boolean;
  onAddClothing: () => void;
  clothingAddDisabled?: boolean;
  onSendQuestionnaire?: () => void;
};

const titles: Record<WorkerTab, string> = {
  form: 'Aufgaben',
  files: 'Dateien',
  materials: 'Materialien',
  clothing: 'Kleidung',
};

const WorkerHeader = ({
  activeTab,
  isLoading = false,
  openForCreate,
  hideCreate = false,
  onOpenFileUpload,
  onExportFiles,
  onUploadMaterials,
  materialsUploadDisabled = false,
  onAddClothing,
  clothingAddDisabled = false,
  onSendQuestionnaire,
}: WorkerHeaderProps) => {
  return (
    <>
      <CardTitle className="text-base font-medium">
        {titles[activeTab]}
      </CardTitle>
      <div className="flex h-8 shrink-0 items-center gap-3">
        {activeTab === 'form' && onSendQuestionnaire ? (
          <Button
            type="button"
            className="rounded-2xl"
            onClick={onSendQuestionnaire}
          >
            Fragebogen senden
          </Button>
        ) : null}
        {activeTab === 'form' && !hideCreate ? (
          <Button
            type="button"
            className="rounded-2xl"
            onClick={openForCreate}
            disabled={isLoading}
          >
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
              disabled={isLoading}
              onClick={onOpenFileUpload}
            >
              Hochladen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              disabled={isLoading}
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
            disabled={isLoading || materialsUploadDisabled}
            onClick={onUploadMaterials}
          >
            Hochladen
          </Button>
        ) : null}
        {activeTab === 'clothing' ? (
          <Button
            type="button"
            className="rounded-2xl"
            data-testid="open-clothing-add"
            disabled={isLoading || clothingAddDisabled}
            onClick={onAddClothing}
          >
            Hinzufügen
          </Button>
        ) : null}
      </div>
    </>
  );
};

export default WorkerHeader;
