import type { EngagementType } from '../types/index.types';
import { isCalendarDayBefore, parseCalendarDate } from './calendarDate';

type TeamEngagement = {
  type: EngagementType;
  status: string;
};

export type TeamWorker = {
  firstName: string;
  lastName: string;
  birthday?: string | null;
  exitDate?: string | null;
  engagements: TeamEngagement[];
};

export function showsCompanyAnniversary(worker: {
  engagements: TeamEngagement[];
}): boolean {
  const engagement = worker.engagements[0];
  if (!engagement || engagement.type === 'offboarding') return false;
  if (engagement.type === 'transfer') return true;
  return engagement.type === 'onboarding' && engagement.status === 'completed';
}

export function isTeamMember(worker: TeamWorker, today = new Date()): boolean {
  if (worker.exitDate && isCalendarDayBefore(worker.exitDate, today)) {
    return false;
  }
  return showsCompanyAnniversary(worker);
}

function birthdaySortKey(birthday: string | null | undefined): number {
  if (!birthday) return Number.POSITIVE_INFINITY;
  const date = parseCalendarDate(birthday);
  if (!date) return Number.POSITIVE_INFINITY;
  return date.getUTCMonth() * 32 + date.getUTCDate();
}

export function compareTeamWorkers(left: TeamWorker, right: TeamWorker): number {
  const leftKey = birthdaySortKey(left.birthday);
  const rightKey = birthdaySortKey(right.birthday);
  if (leftKey !== rightKey) {
    if (!Number.isFinite(leftKey)) return 1;
    if (!Number.isFinite(rightKey)) return -1;
    return leftKey - rightKey;
  }
  return `${left.lastName} ${left.firstName}`.localeCompare(
    `${right.lastName} ${right.firstName}`,
    'de'
  );
}
