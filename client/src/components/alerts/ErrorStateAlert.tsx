import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { Link, type LinkProps } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';

type ErrorStateAction = {
  label: string;
} & Pick<LinkProps, 'to' | 'search' | 'params'>;

type ErrorStateAlertProps = {
  title?: string;
  message: string;
  action?: ErrorStateAction;
  className?: string;
};
const ErrorStateAlert = ({
  title,
  message,
  action,
  className,
}: ErrorStateAlertProps) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-2xl border border-destructive/20 bg-card/80 p-5 shadow-sm ring-1 ring-border/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex gap-4 sm:items-start">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
          aria-hidden
        >
          <AlertCircle className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          ) : null}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
          {action ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link
                  to={action.to}
                  search={action.search}
                  params={action.params}
                >
                  {action.label}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ErrorStateAlert;
