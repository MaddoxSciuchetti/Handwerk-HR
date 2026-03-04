import { AgentResponse } from '../types/agent.types';

type ConversationProps = {
  agentreply: AgentResponse | null;
};
const Conversation = ({ agentreply }: ConversationProps) => {
  return <div>{agentreply?.reply}</div>;
};

export default Conversation;
