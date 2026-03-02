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
              ? 'active cursor-pointer rounded-2xl bg-gray-100 w-40 text-sm mt-5 text-center px-2 py-1'
              : 'cursor-pointer rounded-2xl bg-blue-100 w-40 text-sm mt-5 text-center px-2 py-1'
          }
        >
          {showMyItems ? 'Alle Aufgaben' : 'Meine Aufgaben'}
        </p>
      </span>
    </>
  );
};

export default FilteredTasks;
