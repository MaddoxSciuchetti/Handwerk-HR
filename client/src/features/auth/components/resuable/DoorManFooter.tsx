type DoorManFooterProps = {
  description: string;
  action: string;
  nav: () => void;
};

const DoorManFooter = ({ description, action, nav }: DoorManFooterProps) => {
  return (
    <div className="flex items-center justify-center gap-1 text-sm text-amber-50">
      <p className="text-sm text-gray-400">
        {description}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nav();
          }}
          className="text-white hover:text-gray-300 underline cursor-pointer"
        >
          {action}
        </button>
      </p>
    </div>
  );
};

export default DoorManFooter;
