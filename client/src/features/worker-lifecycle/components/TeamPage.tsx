import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useMemo } from 'react';
import useHome from '../hooks/useHome';
import { nextUpcomingAnniversary } from '../utils/companyAnniversary';
import { compareTeamWorkers, isTeamMember } from '../utils/teamMembers';
import NextAnniversary from './NextAnniversary';
import ProjectItem from './ProjectItem';

function TeamPage() {
  const { user, isLoading, isError } = useAuth();
  const {
    error,
    workers,
    handleNavigate,
    isLoading: workersLoading,
  } = useHome();

  useBodyScrollLock();

  const teamWorkers = useMemo(
    () => (workers ?? []).filter((worker) => isTeamMember(worker)).sort(compareTeamWorkers),
    [workers]
  );
  const nextAnniversaryIds = useMemo(() => {
    const next = nextUpcomingAnniversary(teamWorkers);
    return new Set(next?.people.map((person) => person.id) ?? []);
  }, [teamWorkers]);

  if (isError || (!isLoading && !user)) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
        <NextAnniversary
          people={teamWorkers}
          isLoading={isLoading || workersLoading}
        />
        <Card className="flex min-h-64 shrink-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row items-center px-6 py-3">
            <CardTitle className="text-base font-medium">Team</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <ScrollableTableViewport>
              <Table aria-busy={isLoading || workersLoading}>
                <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-12 bg-card px-6 py-3">Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-0 [&_td]:py-4">
                  {isLoading || workersLoading ? (
                    <TableSkeletonRows variant="team" />
                  ) : (
                    teamWorkers.map((worker) => (
                      <ProjectItem
                        key={worker.id}
                        variant="team"
                        marked={nextAnniversaryIds.has(worker.id)}
                        worker={worker}
                        gotopage={handleNavigate}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollableTableViewport>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TeamPage;
