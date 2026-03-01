import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { user } from '@/lib/api';

import { UseMutateFunction } from '@tanstack/react-query';
import { TEmployee } from '../../schemas/schema';

type EditDropdownProps = {
  value: TEmployee;
  DeleteEmployee: UseMutateFunction<user, Error, string, unknown>;
};

const EditDropdown = ({ value, DeleteEmployee }: EditDropdownProps) => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <img className="hover:scale-110" src="/assets/editReact.svg" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className={`w-40 bg-gray-100`} align="start">
          <DropdownMenuGroup>
            {value.user_permission === 'CHEF' ? (
              <DropdownMenuItem
                disabled
                className="hover:bg-gray-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  DeleteEmployee(value.id);
                }}
              >
                Löschen
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="hover:bg-gray-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  DeleteEmployee(value.id);
                }}
              >
                Löschen
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default EditDropdown;
