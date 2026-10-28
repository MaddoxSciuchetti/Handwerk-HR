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
            className="typo-body-xs inline-flex shrink-0 cursor-default rounded-full border border-green-300 bg-green-50/40 px-3 py-1 text-green-700 dark:border-green-400 dark:bg-green-500/20 dark:text-green-300"
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
