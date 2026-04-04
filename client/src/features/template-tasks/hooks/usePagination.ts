import { useEffect, useMemo, useState } from 'react';
import { IssueTemplateListItem } from '../api/templateV2.api';

function usePagination(data: readonly IssueTemplateListItem[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(7);
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch]);

  const templatesMatchingSearch = useMemo(() => {
    const matchesSearchQuery = (issueTemplate: IssueTemplateListItem) => {
      if (!normalizedSearch) return true;
      const nameLower = issueTemplate.name.toLowerCase();
      const descriptionLower = (issueTemplate.description ?? '').toLowerCase();
      return (
        nameLower.includes(normalizedSearch) ||
        descriptionLower.includes(normalizedSearch)
      );
    };
    return data.filter(matchesSearchQuery);
  }, [data, normalizedSearch]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;

  const paginatedTemplates = useMemo(
    () => templatesMatchingSearch.slice(indexOfFirstPost, indexOfLastPost),
    [templatesMatchingSearch, indexOfFirstPost, indexOfLastPost]
  );

  return {
    currentPage,
    setCurrentPage,
    search,
    setSearch,
    paginatedTemplates,
    postsPerPage,
    templatesMatchingSearch,
  };
}

export default usePagination;
