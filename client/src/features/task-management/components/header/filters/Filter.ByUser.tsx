type FilteredTasksProps = {
  showMyItems: boolean;
  handleMeFilter: () => Promise<void>;
};

const FilterByUser = ({ showMyItems, handleMeFilter }: FilteredTasksProps) => {
  return (
    <>
      <span>
        <p
          onClick={() => handleMeFilter()}
          className={
            showMyItems
              ? 'active mt-5 w-40 cursor-pointer rounded-2xl border border-border bg-(--dropdown-surface) px-2 py-1 text-center text-sm text-foreground'
              : 'mt-5 w-40 cursor-pointer rounded-2xl border border-border bg-muted px-2 py-1 text-center text-sm text-muted-foreground transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)'
          }
        >
          {showMyItems ? 'Alle Aufgaben' : 'Meine Aufgaben'}
        </p>
      </span>
    </>
  );
};

export default FilterByUser;
