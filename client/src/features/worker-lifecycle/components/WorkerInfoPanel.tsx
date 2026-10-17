import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import type { ReactNode } from 'react';
import WorkerInfoHeader from './WorkerInfoHeader';
import './worker-info-panel.css';

type WorkerInfoPanelProps = {
  isOpen: boolean;
  isError: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function WorkerInfoPanel({
  isOpen,
  isError,
  onClose,
  children,
}: WorkerInfoPanelProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
        aria-describedby={undefined}
        className="worker-info-panel gap-0 overflow-hidden rounded-4xl border border-border data-[side=right]:inset-y-1 data-[side=right]:right-1 data-[side=right]:h-auto data-[side=right]:w-[calc(100vw-0.5rem)] data-[side=right]:sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-6 pr-14">
          <WorkerInfoHeader isError={isError} />
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
