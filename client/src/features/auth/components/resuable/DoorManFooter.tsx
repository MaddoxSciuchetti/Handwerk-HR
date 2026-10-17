import { Button } from '@/components/ui/button';

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
        <Button
          type="button"
          variant="link"
          onClick={(e) => {
            e.stopPropagation();
            nav();
          }}
          className="h-auto p-0 text-foreground underline hover:bg-transparent hover:text-accent-foreground"
        >
          {action}
        </Button>
      </p>
    </div>
  );
};

export default DoorManFooter;
