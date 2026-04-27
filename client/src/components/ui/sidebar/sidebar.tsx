import { cn } from '@/lib/trycatch';
import { PanelLeftIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../../../globals.css';
import { Button } from '../button';
import {
  SidebarContext,
  type SidebarContextProps,
  useSidebar,
} from './sidebar-context';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '4rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

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
          'group/sidebar-wrapper flex min-h-svh w-full bg-muted',
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
  collapsible = 'icon',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { state } = useSidebar();
  const safeCollapsible = collapsible === 'offcanvas' ? 'icon' : collapsible;

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
      data-collapsible={state === 'collapsed' ? safeCollapsible : ''}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap "
        className={cn(
          'relative w-[12.25rem] bg-transparent',
          'transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]'
        )}
      />

      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-1 left-1 z-10 h-[calc(100svh-0.5rem)] w-48',
          'transition-[left,width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]',
          'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]'
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            'flex h-full w-full min-w-48 max-w-35 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card py-6',
            'group-data-[collapsible=icon]:min-w-[var(--sidebar-width-icon)]',
            'group-data-[collapsible=icon]:py-4',
            className
          )}
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
        'relative flex w-full flex-1 flex-col bg-background',
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
