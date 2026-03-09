import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DropDownResuableProps<T> = {
  imgsrc: string;
  disabled?: boolean;
  onRemove: (value: T) => void;
  value: T;
};

const DropDownResuable = <T,>({
  imgsrc,
  disabled,
  onRemove,
  value,
}: DropDownResuableProps<T>) => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <img className="hover:scale-110" src={imgsrc} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className={`w-40 bg-gray-100`} align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={disabled}
              className="hover:bg-gray-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(value);
              }}
            >
              Löschen
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default DropDownResuable;
