import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { RefObject } from 'react';
import Search from './Search';

type ChatInputProps = {
  handleClick: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  isPending: boolean;
};

const ChatInput = ({ handleClick, inputRef, isPending }: ChatInputProps) => {
  return (
    <>
      <div className="flex justify-between border-2 mb-5 p-2 items-center rounded-4xl">
        <Search inputRef={inputRef} handleClick={handleClick} />
        <Button
          disabled={isPending}
          variant={'outline'}
          className={`${isPending ? `bg-gray-300` : ''} flex items-center justify-center cursor-pointer rounded-4xl`}
        >
          <Send onClick={handleClick} className="mr-1 cursor-pointer" />
        </Button>
      </div>
    </>
  );
};

export default ChatInput;
