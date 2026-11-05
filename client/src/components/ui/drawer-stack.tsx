/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import './right-sidebar.css';

type Entry = {
  id: number;
  title: string;
  content: ReactNode;
  depth: number;
  open: boolean;
};
type Stack = {
  push: (title: string, content: ReactNode, depth: number) => void;
  close: (id: number) => void;
  register: (id: string, depth: number | null) => void;
  activeDepth: number;
};
const StackContext = createContext<Stack | null>(null);
const DepthContext = createContext(0);
const CloseContext = createContext<(() => void) | null>(null);

export function useDrawerStack() {
  const stack = useContext(StackContext);
  const depth = useContext(DepthContext);
  const back = useContext(CloseContext);
  if (!stack) return null;
  return {
    push: (title: string, content: ReactNode) =>
      stack.push(title, content, depth + 1),
    back,
  };
}

export function DrawerStackProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const nextId = useRef(0);
  const [layers, setLayers] = useState<Record<string, number>>({});
  const register = useCallback((id: string, depth: number | null) => {
    setLayers((current) => {
      if (depth === null) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: depth };
    });
  }, []);
  const push = useCallback(
    (title: string, content: ReactNode, depth: number) => {
      const id = ++nextId.current;
      setEntries((current) => [
        ...current,
        { id, title, content, depth, open: true },
      ]);
    },
    []
  );
  const close = useCallback((id: number) => {
    setEntries((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      return current.map((entry, i) =>
        i >= index && index >= 0 ? { ...entry, open: false } : entry
      );
    });
  }, []);
  const activeDepth = Math.max(0, ...Object.values(layers));
  useEffect(() => {
    if (!activeDepth) return;
    const root = document.getElementById('root');
    if (!root) return;
    const previous = root.inert;
    root.inert = true;
    return () => {
      root.inert = previous;
    };
  }, [activeDepth]);
  return (
    <StackContext.Provider value={{ push, close, register, activeDepth }}>
      {children}
      {entries.map((entry) => (
        <DepthContext.Provider key={entry.id} value={entry.depth - 1}>
          <DrawerLayer
            open={entry.open}
            title={entry.title}
            onClose={() => close(entry.id)}
            onClosed={() =>
              setEntries((current) =>
                current.filter((item) => item.id !== entry.id)
              )
            }
          >
            {entry.content}
          </DrawerLayer>
        </DepthContext.Provider>
      ))}
    </StackContext.Provider>
  );
}

type DrawerLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  open: boolean;
  title: string;
  onClose: () => void;
  onClosed?: () => void;
  showCloseButton?: boolean;
  contentClassName?: string;
};

export function DrawerLayer({
  open,
  title,
  onClose,
  onClosed,
  showCloseButton = true,
  contentClassName,
  className,
  children,
  style,
  ...props
}: DrawerLayerProps) {
  const depth = useContext(DepthContext) + 1;
  const stack = useContext(StackContext);
  const register = stack?.register;
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const closedRef = useRef(onClosed);
  useEffect(() => {
    closeRef.current = onClose;
    closedRef.current = onClosed;
  }, [onClose, onClosed]);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  const covered = (stack?.activeDepth ?? depth) > depth;

  useEffect(() => {
    if (!open) return;
    register?.(id, depth);
    return () => register?.(id, null);
  }, [open, register, id, depth]);

  useEffect(() => {
    if (open || !present) return;
    const timer = window.setTimeout(() => {
      setPresent(false);
      closedRef.current?.();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, present]);

  useEffect(() => {
    if (!open) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const panels = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-drawer-layer][data-state="open"]'
        ),
      ];
      const top = panels
        .sort(
          (a, b) =>
            Number(a.dataset.drawerLayer) - Number(b.dataset.drawerLayer)
        )
        .at(-1);
      if (top !== panel.current) return;
      // A legacy panel outside the Cockpit stack can still own Escape.
      if (
        document.querySelector(
          '[data-sidebar-aside][data-state="open"]:not([data-drawer-layer])'
        )
      )
        return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (
        event.key === 'Tab' &&
        panel.current &&
        !document.querySelector(
          '[data-slot="dialog-content"], [data-slot="select-content"], [data-slot="popover-content"]'
        )
      ) {
        const focusable = [
          ...panel.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"], [contenteditable="true"]'
          ),
        ].filter(
          (element) =>
            !element.closest('[inert]') && element.getClientRects().length > 0
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          !first ||
          (event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === panel.current)) ||
          (!event.shiftKey &&
            (document.activeElement === last ||
              document.activeElement === panel.current))
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore after the parent layer has stopped being inert.
      window.requestAnimationFrame(() => {
        if (!trigger?.isConnected || trigger.closest('[inert]')) return;
        const top = [
          ...document.querySelectorAll<HTMLElement>(
            '[data-drawer-layer][data-state="open"]'
          ),
        ]
          .sort(
            (a, b) =>
              Number(a.dataset.drawerLayer) - Number(b.dataset.drawerLayer)
          )
          .at(-1);
        if (!top || top.contains(trigger))
          trigger.focus({ preventScroll: true });
      });
    };
  }, [open]);

  if (!present || typeof document === 'undefined') return null;
  const state = open ? 'open' : 'closed';
  return createPortal(
    <DepthContext.Provider value={depth}>
      <CloseContext.Provider value={onClose}>
        <button
          type="button"
          aria-label="Zurück zur vorherigen Ebene"
          tabIndex={-1}
          disabled={!open || covered}
          data-state={state}
          className="cockpit-drawer-overlay fixed inset-0 bg-black/15"
          style={{ zIndex: 50 + depth * 2 }}
          onClick={onClose}
        />
        <div
          {...props}
          ref={panel}
          role="dialog"
          aria-label={title}
          aria-modal={open && !covered ? true : undefined}
          aria-hidden={!open || covered}
          inert={!open || covered}
          tabIndex={-1}
          data-drawer-layer={depth}
          data-state={state}
          className={cn(
            'cockpit-drawer fixed right-1 flex max-w-none flex-col overflow-hidden rounded-[26px] border border-border bg-popover text-popover-foreground shadow-lg outline-none',
            className
          )}
          style={{
            width: `max(min(20rem, 95vw), calc(min(80vw, 72rem) - ${(depth - 1) * 0.25}rem))`,
            top: 4 + (depth - 1) * 4,
            bottom: 4 + (depth - 1) * 4,
            zIndex: 51 + depth * 2,
            ...style,
          }}
        >
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 z-10"
              aria-label="Schließen"
              onClick={onClose}
            >
              <XIcon />
            </Button>
          ) : null}
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-12 md:p-6 md:pt-12 [&_>div]:mx-0 [&_>div]:h-full [&_>div]:min-h-0 [&_>div]:max-w-none [&_>div]:rounded-none [&_>div]:bg-transparent [&_>div]:p-0',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </CloseContext.Provider>
    </DepthContext.Provider>,
    document.body
  );
}
