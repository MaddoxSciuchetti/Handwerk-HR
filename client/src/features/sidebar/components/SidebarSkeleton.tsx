import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export const SidebarSkeleton = () => {
  return (
    <Sidebar className="p-5">
      <SidebarHeader className="rounded-xl bg-muted/40 p-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Array.from({ length: 6 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <div className="mt-2 rounded-xl py-5 px-3">
                    <Skeleton className="h-4 w-full" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Skeleton className="mx-1 mb-1 h-10 rounded-xl" />
    </Sidebar>
  );
};
