import { Folder } from 'lucide-react';
import { StoredFileBox } from '../StoredFileBox';
import { useFolderFileDrop } from '../../../hooks/useFolderFileDrop';

type PersonnelFolderCardProps = {
  label: string;
  onOpen: () => void;
  onFiles: (files: File[]) => void;
};

export function PersonnelFolderCard({
  label,
  onOpen,
  onFiles,
}: PersonnelFolderCardProps) {
  const { isDragging, dropHandlers } = useFolderFileDrop(onFiles);
  return (
    <StoredFileBox
      label={label}
      icon={Folder}
      onOpen={onOpen}
      {...dropHandlers}
      className={isDragging ? 'border-muted-foreground bg-muted/50' : undefined}
    />
  );
}
