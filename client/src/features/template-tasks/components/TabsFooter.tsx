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
          <p className="font-light text-xs text-(--muted-foreground)">
            {taskLengthByTemplateType.OFFBOARDING} Aufgaben in Offboarding
            template
          </p>
        ) : (
          <p className="font-light text-xs text-(--muted-foreground)">
            {taskLengthByTemplateType.ONBOARDING} Aufgaben in Onboarding
            template
          </p>
        )}
      </div>
    </>
  );
};

export default TabsFooter;
