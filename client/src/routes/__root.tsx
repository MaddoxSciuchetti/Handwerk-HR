// src/routes/__root.tsx
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/auth/app-sidebar";

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    const location = useLocation();

    const isLoginPage = location.pathname === "/login";
    const isSignUp = location.pathname === "/signup";
    const isVerfiy = location.pathname === "/verify-email";
    const isHomePage = location.pathname === "/";

    if (isLoginPage || isSignUp || isVerfiy || isHomePage) {
        return (
            <main className="min-h-screen">
                <Outlet />
            </main>
        );
    }

    return (
        // But use this structure:
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-center justify-center flex-1">
                        <Outlet />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
