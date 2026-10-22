import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import type { WorkerTab } from '../../types/index.types';

type WorkerHeaderProps = {
  activeTab: WorkerTab;
  isLoading?: boolean;
  openForCreate: () => void;
  hideCreate?: boolean;
  onOpenFileUpload: () => void;
  onAddFolder?: () => void;
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

const headerActionClassName =
  'h-7 w-32 rounded-2xl bg-black px-2 text-[0.8rem] text-white hover:bg-black/90';

const WorkerHeader = ({
  activeTab,
  isLoading = false,
  openForCreate,
  hideCreate = false,
  onOpenFileUpload,
  onAddFolder,
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
            className={headerActionClassName}
            onClick={onSendQuestionnaire}
          >
            Fragebogen senden
          </Button>
        ) : null}
        {activeTab === 'form' && !hideCreate ? (
          <Button
            type="button"
            className={headerActionClassName}
            onClick={openForCreate}
            disabled={isLoading}
          >
            Aufgabe hinzufügen
          </Button>
        ) : null}
        {activeTab === 'files' ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  data-testid="open-file-upload"
                  disabled={isLoading}
                  aria-label="Hinzufügen"
                  className="size-7 rounded-2xl bg-black text-white hover:bg-black/90"
                >
                  <Plus aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onOpenFileUpload}>
                  Datei
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddFolder?.()}>
                  Ordner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              className={headerActionClassName}
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
            className={headerActionClassName}
            data-testid="open-materials-upload"
            disabled={isLoading || materialsUploadDisabled}
            onClick={onUploadMaterials}
          >
            Hinzufügen
          </Button>
        ) : null}
        {activeTab === 'clothing' ? (
          <Button
            type="button"
            className={headerActionClassName}
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
