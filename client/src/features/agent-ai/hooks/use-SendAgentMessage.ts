import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { sendAgentMessage } from '../apis/agent.apis';
import { SENDAGENT } from '../consts/angent.consts';
import { AgentResponse } from '../types/agent.types';

function useSendAgentMessage() {
  const [agentreply, setAgentReply] = useState<AgentResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendAgentMessageMutation = useMutation<AgentResponse, Error, string>({
    mutationKey: [SENDAGENT],
    mutationFn: sendAgentMessage,
    onSuccess: (data) => {
      setAgentReply(data);
      console.log('sucess');
    },
  });
  const handleClick = () => {
    const message = inputRef.current?.value;
    if (!message?.trim()) return;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    sendAgentMessageMutation.mutate(message);
  };

  return {
    handleClick,
    agentreply,
    inputRef,
  };
}

export default useSendAgentMessage;
