import AsyncWrapper from '@/components/alerts/layout-wrapper/AsyncWrapper';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import useSendAgentMessage from '../hooks/use-SendAgentMessage';
import ChatDisplay from './chat/ChatDisplay';
import ChatInput from './chat/ChatInput';

const ChatMain = () => {
  const { user, isError, isLoading } = useAuth();
  const { agentreply, handleClick, inputRef } = useSendAgentMessage();

  return (
    <>
      <AsyncWrapper
        isLoading={isLoading}
        isError={isError || !user}
        userpermission={user?.user_permission}
        requiredpermission={'CHEF'}
      >
        <div className="h-full">
          <ChatDisplay agentreply={agentreply}>
            <ChatInput handleClick={handleClick} inputRef={inputRef} />
          </ChatDisplay>
        </div>
      </AsyncWrapper>
    </>
  );
};

export default ChatMain;
