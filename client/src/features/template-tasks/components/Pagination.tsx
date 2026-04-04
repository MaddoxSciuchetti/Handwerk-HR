import { Dispatch, MouseEvent, SetStateAction } from 'react';

type PaginationProps = {
  postsPerPage: number;
  totalPosts: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  currentPage: number;
};

const Pagination = ({
  postsPerPage,
  totalPosts,
  setCurrentPage,
  currentPage,
}: PaginationProps) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalPosts / postsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageUpdate = (
    number: number,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setCurrentPage(number);
  };

  return (
    <ul className="flex gap-2 ">
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={(e) => handlePageUpdate(number, e)}
          aria-label={`Seite ${number}`}
          aria-current={currentPage === number ? 'page' : undefined}
          className={`page-item ${currentPage === number ? 'text-[var(--muted-foreground)] underline' : 'text-[var(--foreground)]'}`}
        >
          {number}
        </button>
      ))}
    </ul>
  );
};

export default Pagination;
