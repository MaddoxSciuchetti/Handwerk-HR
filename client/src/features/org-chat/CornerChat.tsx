import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { OrgChatComposer } from './OrgChatComposer';
import { getOrgChat, postOrgChat, type OrgChatMessage } from './orgChat.api';

const ORG_CHAT = 'org-chat';

function authorLabel(user: OrgChatMessage['user']) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function CornerChat() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [ORG_CHAT],
    queryFn: getOrgChat,
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });
  const { data: employees = [] } = useQuery({
    ...employeeQueries.getEmployees(),
    enabled: open,
  });
  const send = useMutation({
    mutationFn: postOrgChat,
    onSuccess: (result, variables) => {
      queryClient.setQueryData<OrgChatMessage[]>([ORG_CHAT], (previous = []) => [
        ...previous.filter((message) => message.id !== result.message.id),
        result.message,
      ]);
      if (result.mailFailed) {
        toast.error('Die E-Mail konnte nicht gesendet werden.');
      }
      if (variables.mentionUserIds?.length) {
        void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      }
    },
    onError: () => {
      toast.error('Nachricht konnte nicht gesendet werden.');
    },
  });

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open ? (
        <section
          aria-label="Chat"
          className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
        >
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <h2 className="text-sm font-medium">Chat</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Chat schließen"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Chat wird geladen…</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Noch keine Nachrichten.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.user.id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex max-w-[90%] flex-col gap-0.5 rounded-lg px-2 py-1 text-sm',
                      mine
                        ? 'self-end bg-muted'
                        : 'self-start bg-muted'
                    )}
                  >
                    <p className="text-xs text-muted-foreground">
                      {authorLabel(message.user)}
                    </p>
                    <p className="whitespace-pre-wrap wrap-anywhere">
                      {message.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <OrgChatComposer
            coworkers={employees.map((employee) => ({
              id: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
            }))}
            currentUserId={user?.id}
            disabled={send.isPending}
            onSend={async (body, mentionUserIds) => {
              await send.mutateAsync({ body, mentionUserIds });
            }}
          />
        </section>
      ) : null}
      <Button
        type="button"
        size="icon"
        className="size-12 rounded-full shadow-lg"
        aria-label={open ? 'Chat schließen' : 'Chat öffnen'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MessageCircle className="size-5" />
      </Button>
    </div>
  );
}
