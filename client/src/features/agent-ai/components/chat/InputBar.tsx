import { UseMutationResult } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { AgentResponse } from '../../types/agent.types';
import Search from './Search';

type InputBarProps = {
  handleClick: () => void;
  message: string;
  sendAgentMessageMutation: UseMutationResult<AgentResponse, Error, string>;
  setMessage: Dispatch<SetStateAction<string>>;
  inputRef: RefObject<HTMLInputElement | null>;
};

const InputBar = ({
  handleClick,
  message,
  sendAgentMessageMutation,
  setMessage,
  inputRef,
}: InputBarProps) => {
  return (
    <>
      <div className="flex justify-between border-2 w-170 mb-5 p-2 items-center rounded-4xl">
        <Search
          inputRef={inputRef}
          handleClick={handleClick}
          message={message}
          setMessage={setMessage}
        />
        <Send onClick={handleClick} className="mr-2 cursor-pointer" />
      </div>
    </>
  );
};

export default InputBar;
