type FilteredTasksProps = {
  showMyItems: boolean;
  handleMeFilter: () => Promise<void>;
};

const FilteredTasks = ({ showMyItems, handleMeFilter }: FilteredTasksProps) => {
  return (
    <>
      <span>
        <p
          onClick={() => handleMeFilter()}
          className={
            showMyItems
              ? 'active mt-5 w-40 cursor-pointer rounded-2xl bg-accent px-2 py-1 text-center text-sm text-accent-foreground'
              : 'mt-5 w-40 cursor-pointer rounded-2xl bg-muted px-2 py-1 text-center text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }
        >
          {showMyItems ? 'Alle Aufgaben' : 'Meine Aufgaben'}
        </p>
      </span>
    </>
  );
};

export default FilteredTasks;
