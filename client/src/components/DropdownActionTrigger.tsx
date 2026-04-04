import { Edit, MoreHorizontal, TrashIcon } from 'lucide-react';
import DropdownMenuAction, {
  DropdownMenuActionItem,
} from './DropdownMenuAction';

type DropdownActionTriggerProps = {
  disabled?: boolean;
  description: string;
  triggerIcon: 'trash' | 'edit' | 'more';
  actions: DropdownMenuActionItem[];
};

const DropdownActionTrigger = ({
  disabled,
  description,
  triggerIcon,
  actions,
}: DropdownActionTriggerProps) => {
  const icon =
    triggerIcon === 'more' ? (
      <MoreHorizontal className="h-4 w-4" />
    ) : triggerIcon === 'edit' ? (
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
