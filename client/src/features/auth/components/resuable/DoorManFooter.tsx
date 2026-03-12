type DoorManFooterProps = {
  description: string;
  action: string;
  nav: () => void;
};

const DoorManFooter = ({ description, action, nav }: DoorManFooterProps) => {
  return (
    <div className="flex items-center justify-center gap-1 text-sm text-foreground">
      <p className="text-sm text-muted-foreground">
        {description}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nav();
          }}
          className="cursor-pointer text-foreground underline hover:text-accent-foreground"
        >
          {action}
        </button>
      </p>
    </div>
  );
};

export default DoorManFooter;
