import { ReactNode } from 'react';
import { AgentResponse } from '../../types/agent.types';

type ChatDisplayProps = {
  children: ReactNode;
  agentreply: AgentResponse | undefined;
};

const ChatDisplay = ({ children, agentreply }: ChatDisplayProps) => {
  return (
    <div className="flex items-end justify-center h-full border-2">
      <div className="flex flex-col justify-end border-2 h-full">
        <p>{agentreply?.reply}</p>
        <p>place where the count should go </p>
        {children}
      </div>
    </div>
  );
};

export default ChatDisplay;
