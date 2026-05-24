import {
  QueryObserverPlaceholderResult,
  QueryObserverSuccessResult,
} from '@tanstack/react-query';
import { InviteDetailsResponse } from '../types/auth.types';

export function InviteSignupHeader({
  inviteQuery,
}: {
  inviteQuery:
    | QueryObserverSuccessResult<InviteDetailsResponse, Error>
    | QueryObserverPlaceholderResult<InviteDetailsResponse, Error>;
}) {
  return (
    <div className="mb-4 space-y-1">
      <h2 className="text-xl font-semibold">Join {inviteQuery.data.orgName}</h2>
      <p className="text-sm text-muted-foreground">{inviteQuery.data.email}</p>
    </div>
  );
}
