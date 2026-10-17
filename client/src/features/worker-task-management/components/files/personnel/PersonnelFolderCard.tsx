import { Folder } from 'lucide-react';
import { StoredFileBox } from '../StoredFileBox';

type PersonnelFolderCardProps = {
  label: string;
  onOpen: () => void;
};

export function PersonnelFolderCard({ label, onOpen }: PersonnelFolderCardProps) {
  return <StoredFileBox label={label} icon={Folder} onOpen={onOpen} />;
}
