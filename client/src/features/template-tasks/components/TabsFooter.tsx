import { Dispatch, SetStateAction } from 'react';
import Pagination from './Pagination';

type TabsFooterProps = {
  postsPerPage: number;
  totalPosts: number;
  tab: 'ONBOARDING' | 'OFFBOARDING';
  setCurrentPage: Dispatch<SetStateAction<number>>;
  currentPage: number;
  taskLengthByTemplateType: { ONBOARDING: number; OFFBOARDING: number };
};

const TabsFooter = ({
  postsPerPage,
  totalPosts,
  tab,
  setCurrentPage,
  currentPage,
  taskLengthByTemplateType,
}: TabsFooterProps) => {
  return (
    <>
      <div className="flex justify-between mt-2 items-center">
        <Pagination
          postsPerPage={postsPerPage}
          totalPosts={totalPosts}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
        {tab === 'OFFBOARDING' ? (
          <p className="font-light text-xs text-[var(--muted-foreground)]">
            {taskLengthByTemplateType.OFFBOARDING} Vorlagen (Offboarding)
          </p>
        ) : (
          <p className="font-light text-xs text-[var(--muted-foreground)]">
            {taskLengthByTemplateType.ONBOARDING} Vorlagen (Onboarding)
          </p>
        )}
      </div>
    </>
  );
};

export default TabsFooter;
