import AsyncWrapper from '@/components/alerts/layout-wrapper/AsyncWrapper';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import useSendAgentMessage from '../hooks/use-SendAgentMessage';
import ChatDisplay from './chat/ChatDisplay';
import ChatInput from './chat/ChatInput';
import Conversation from './Conversation';

const ChatMain = () => {
  const { user, isError, isLoading } = useAuth();
  const { agentreply, handleClick, inputRef, isPending } =
    useSendAgentMessage();

  return (
    <>
      <AsyncWrapper
        isLoading={isLoading}
        isError={isError || !user}
        userpermission={user?.user_permission}
        requiredpermission={'CHEF'}
      >
        <div className="h-full">
          <ChatDisplay>
            <div className="flex-1 grow overflow-x-auto overflow-y-auto">
              <Conversation agentreply={agentreply} />
            </div>
            <ChatInput
              handleClick={handleClick}
              inputRef={inputRef}
              isPending={isPending}
            />
          </ChatDisplay>
        </div>
      </AsyncWrapper>
    </>
  );
};

export default ChatMain;
