import { Button } from '@/components/ui/button';
import { File_Request } from '@/features/task-management/types/index.types';
import { PlusSquare } from 'lucide-react';

type FileHeaderProps = {
  toggleModal: () => void;
  handleZipExport: (fetchFiles: File_Request[] | undefined) => Promise<void>;
  fetchFiles: File_Request[] | undefined;
};

const FileHeader = ({
  toggleModal,
  handleZipExport,
  fetchFiles,
}: FileHeaderProps) => {
  return (
    <>
      <div className="flex flex-row  pt-5 pr-5 items-center">
        <PlusSquare
          className="flex flex-end cursor-pointer rounded-xl w-10 h-9  transition-colors "
          onClick={toggleModal}
        />

        <Button
          size={'sm'}
          variant={'outline'}
          onClick={() => handleZipExport(fetchFiles)}
          className="ml-4  cursor-pointer px-2 py-4 rounded-xl "
        >
          Exportieren
        </Button>
      </div>
    </>
  );
};

export default FileHeader;
