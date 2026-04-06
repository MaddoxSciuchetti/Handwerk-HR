import { cn } from '@/lib/trycatch';
import { PanelLeftIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import '../../../../globals.css';
import { Button } from '../button';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

interface SidebarContextProps {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a CustomSideBarProvider.');
  }

  return context;
}

function CustomSideBarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  const toggleSidebar = useCallback(() => {
    console.log('toggleSidebar');
    setOpen((open) => !open);
  }, [setOpen]);

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed';

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      toggleSidebar,
    }),
    [state, open, setOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { state } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap "
        className={cn(
          'relative w-48 bg-transparent',
          'transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0'
        )}
      />

      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 left-0 z-10 h-svh w-48',
          'transition-[left,width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]',
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="justify-between rounded-r-xl flex h-full w-full flex-col mt-1 mb-1  py-6  min-w-48 w-35 max-w-35 bg-card"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-7 cursor-pointer', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Test</span>
    </Button>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className
      )}
      {...props}
    />
  );
}

export {
  CustomSideBarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
};
