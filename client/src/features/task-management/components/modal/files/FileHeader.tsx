import { Button } from '@/components/ui/button';
import { File_Request } from '@/features/task-management/types/index.types';

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
      <div className="flex flex-row justify-end pt-5 pr-5">
        <img
          className="flex flex-end cursor-pointer rounded-xl p-1 outline outline-border"
          onClick={toggleModal}
          src="/assets/copy.svg"
          alt="Upload File"
        />

        <Button
          variant={'outline'}
          onClick={() => handleZipExport(fetchFiles)}
          className="ml-4 cursor-pointer p-1 rounded-xl "
        >
          Zip export
        </Button>
      </div>
    </>
  );
};

export default FileHeader;
