import ChatMain from '@/features/agent-ai/components/ChatMain';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/agent-ai')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ChatMain />;
}
