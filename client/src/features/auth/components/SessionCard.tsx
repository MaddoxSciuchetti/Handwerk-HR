import { Button } from '@/components/ui/button';
import { Sessions_Type } from '@/features/user-profile/components/Settings';
import useDeleteSession from '@/hooks/use-deleteSession';

type Session = {
  session: Sessions_Type;
};

const SessionCard = ({ session }: Session) => {
  const { id, createdAt, userAgent, isCurrent } = session;

  const { deleteSession, isPending } = useDeleteSession(id);

  return (
    <div className="flex p-3 border border-gray-200 rounded-md">
      <div className="flex-1">
        <p className="font-bold text-sm mb-1">
          {new Date(createdAt).toLocaleString('en-US')}
          {isCurrent && ' (current session)'}
        </p>
        <p className="text-gray-500 text-xs">{userAgent}</p>
      </div>
      {!isCurrent && (
        <Button
          size="sm"
          variant="ghost"
          className="ml-4 self-center text-xl text-red-400 hover:text-red-600"
          title="Delete Session"
          onClick={() => deleteSession()}
          disabled={isPending}
        >
          &times;
        </Button>
      )}
    </div>
  );
};
export default SessionCard;
