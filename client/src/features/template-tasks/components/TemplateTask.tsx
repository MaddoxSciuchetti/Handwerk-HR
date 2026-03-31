import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import usePagination from '../hooks/usePagination';
import { templateV2Queries } from '../query-options/queries/templateV2.queries';
import CreateTemplateModalV2 from './CreateTemplateModalV2';
import Pagination from './Pagination';
import TemplateList from './TemplateList';

function TemplateTasks() {
  const { data = [], isPending } = useQuery(templateV2Queries.list());

  const [createOpen, setCreateOpen] = useState(false);
  const {
    currentPage,
    setCurrentPage,
    search,
    setSearch,
    paginatedTemplates,
    postsPerPage,
    templatesMatchingSearch,
  } = usePagination(data);

  if (isPending) {
    return <LoadingAlert />;
  }

  return (
    <div
      role="region"
      aria-label="Vorlagen Verwaltung"
      className="mx-auto flex h-full min-h-0 w-full max-w-8xl flex-1 flex-col gap-4 rounded-xl bg-card p-5"
    >
      <div className="shrink-0">
        <SearchHeaderResuable
          compact
          search={search}
          setSearch={setSearch}
          description="Vorlage anlegen"
          openModal={() => setCreateOpen(true)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TemplateList paginatedTemplates={paginatedTemplates} />
      </div>
      <div className="shrink-0 border-t border-border bg-card pt-4">
        <div className="flex items-center justify-between">
          <Pagination
            postsPerPage={postsPerPage}
            totalPosts={templatesMatchingSearch.length}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
          />
          <p className="font-light text-xs text-[var(--muted-foreground)]">
            {templatesMatchingSearch.length} Vorlage
            {templatesMatchingSearch.length === 1 ? '' : 'n'}
          </p>
        </div>
      </div>
      {createOpen && (
        <ModalOverlay handleToggle={() => setCreateOpen(false)}>
          <CreateTemplateModalV2 onClose={() => setCreateOpen(false)} />
        </ModalOverlay>
      )}
    </div>
  );
}

export default TemplateTasks;
