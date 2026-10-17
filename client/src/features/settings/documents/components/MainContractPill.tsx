import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MAIN_CONTRACT_HINT =
  'Hauptvertrag der für die automatische Synchronisation verwendet wird';

export function MainContractPill() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="typo-body-xs inline-flex shrink-0 cursor-default rounded-full border border-green-200 bg-green-100 px-3 py-1 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            onClick={(event) => event.stopPropagation()}
          >
            Hauptvertrag
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{MAIN_CONTRACT_HINT}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
