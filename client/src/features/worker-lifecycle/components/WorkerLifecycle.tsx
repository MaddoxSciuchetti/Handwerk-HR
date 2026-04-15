import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import { SelectDropdown } from '@/components/ui/selfmade/selectdropdown';
import {
  Cell,
  CellHolder,
  GrowingItem,
  ItemHeader,
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import useHome from '@/features/worker-lifecycle/hooks/useHome';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ChevronUp } from 'lucide-react';
import GreetingHeader from './GreetingHeader';
import ProjectItem from './ProjectItem';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  console.log(user);
  const {
    error,
    workers,
    modal,
    search,
    setSearch,
    toggleModal,
    handleNavigate,
  } = useHome();

  useBodyScrollLock();

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <GreetingHeader firstname={user?.firstName || ''} />
        <Table>
          <TableHeader>
            <GrowingItem>Handwerker</GrowingItem>
            <SelectDropdown
              state={'Default'}
              size={'lg'}
              icon={ChevronUp}
              label="Select Option"
              options={[{ label: 'maddox', value: 'maddox' }]}
              value={search}
              setValue={setSearch}
            />
            <Button
              className="text-sm text-surface-page"
              onClick={() => toggleModal()}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ItemHeader className="p-0">
            <GrowingItem className="pl-10 py-2">
              <p className="typo-body-sm">Name</p>
            </GrowingItem>
            <CellHolder>
              <Cell className="typo-body-sm">Type</Cell>
              <Cell className="typo-body-sm">Verantwortlich</Cell>
              <Cell className="typo-body-sm">Zuletzt bearbeitet</Cell>
              <Cell className="typo-body-sm">Status</Cell>
            </CellHolder>
          </ItemHeader>
          {workers?.map((worker) => (
            <ProjectItem
              key={worker.id}
              worker={worker}
              gotopage={handleNavigate}
            />
          ))}
        </Table>

        <LifeCycleModal modal={modal} toggleModal={toggleModal} />
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
