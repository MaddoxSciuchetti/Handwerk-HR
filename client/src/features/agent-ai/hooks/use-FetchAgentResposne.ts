import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchAgentMessage } from '../apis/agent.apis';
import { SENDAGENT } from '../consts/angent.consts';

function useFetchAgentMessage() {
  const [displayMessage, setDisplayMessage] = useState<string>('');

  const { data: agentresponse, ...options } = useQuery({
    queryKey: [SENDAGENT],
    queryFn: fetchAgentMessage,
  });

  return {};
}
export default useFetchAgentMessage;
