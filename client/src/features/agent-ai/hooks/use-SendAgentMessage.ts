import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { sendAgentMessage } from '../apis/agent.apis';
import { SENDAGENT } from '../consts/angent.consts';
import { AgentResponse } from '../types/agent.types';

function useSendAgentMessage() {
  const [message, setMessage] = useState<string>('');
  const [agentreply, setAgentReply] = useState<AgentResponse>();
  const inputRef = useRef<HTMLInputElement>(null);
  console.log(agentreply);

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
    setMessage('');
    sendAgentMessageMutation.mutate(message);
  };

  return {
    sendAgentMessageMutation,
    message,
    setMessage,
    handleClick,
    agentreply,
    inputRef,
  };
}

export default useSendAgentMessage;
