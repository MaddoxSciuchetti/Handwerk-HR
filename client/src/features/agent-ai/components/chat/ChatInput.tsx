import { Send } from 'lucide-react';
import { RefObject } from 'react';
import Search from './Search';

type ChatInputProps = {
  handleClick: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const ChatInput = ({ handleClick, inputRef }: ChatInputProps) => {
  return (
    <>
      <div className="flex justify-between border-2 w-170 mb-5 p-2 items-center rounded-4xl">
        <Search inputRef={inputRef} handleClick={handleClick} />
        <Send onClick={handleClick} className="mr-2 cursor-pointer" />
      </div>
    </>
  );
};

export default ChatInput;
