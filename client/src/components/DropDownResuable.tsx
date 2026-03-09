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
  description: string;
  action: () => void;
};

const DropDownResuable = <T,>({
  description,
  imgsrc,
  disabled,
  action,
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
                action();
              }}
            >
              {description}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default DropDownResuable;
