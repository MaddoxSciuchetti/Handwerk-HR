import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import {
  ProjectHeader,
  ProjectItem,
  ProjectTable,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import useHome from '@/features/worker-lifecycle/hooks/useHome';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { getFirstFormType } from '../utils/formtype';
import ActiveArchiveHeader from './ActiveArchiveHeader';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const {
    error,
    filtered,
    handleNavigate,
    modal,
    mode,
    search,
    setSearch,
    setMode,
    toggleModal,
  } = useHome();

  useBodyScrollLock();

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <SearchHeaderResuable
          openModal={toggleModal}
          search={search}
          setSearch={setSearch}
          description="Handwerker hinzufügen"
        />
        <ActiveArchiveHeader mode={mode} setMode={setMode} />
        <ProjectTable>
          <TableHeader
            label={'Handwerker'}
            action={toggleModal}
            actionLabel="Hinzufügen"
          />
          <ProjectHeader />
          {filtered?.length ? (
            filtered.map((task) => (
              <ProjectItem
                key={task.id}
                project_name={`${task.vorname} ${task.nachname}`}
                statusInformation={{
                  status: 'test',
                  priority: 'Low',
                  lead: 'test',
                  date: 'test',
                }}
                img={['assets/Box.svg', 'assets/BoxSelect.svg']}
                item_value={task.id}
                form_type={getFirstFormType(task)}
                gotopage={handleNavigate}
              />
            ))
          ) : (
            <p className="text-center text-label-lg">
              Keine Handwerker gefunden
            </p>
          )}
        </ProjectTable>
        {/* <LifeCycleTable
          filtered={filtered}
          mode={mode}
          gotopage={handleNavigate}
        /> */}
        <LifeCycleModal modal={modal} toggleModal={toggleModal} />
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
