import { Edit, TrashIcon } from 'lucide-react';
import DropdownMenuAction, {
  DropdownMenuActionItem,
} from './DropdownMenuAction';

type DropdownActionTriggerProps = {
  disabled?: boolean;
  description: string;
  triggerIcon: 'trash' | 'edit';
  actions: DropdownMenuActionItem[];
};

const DropdownActionTrigger = ({
  disabled,
  description,
  triggerIcon,
  actions,
}: DropdownActionTriggerProps) => {
  const icon =
    triggerIcon === 'edit' ? (
      <Edit className="h-4 w-4" />
    ) : (
      <TrashIcon className="h-4 w-4" />
    );
  return (
    <DropdownMenuAction
      disabled={disabled}
      description={description}
      triggerIcon={icon}
      actions={actions}
    />
  );
};

export type { DropdownMenuActionItem };
export default DropdownActionTrigger;
