// src/routes/__root.tsx
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/auth/app-sidebar";
import { useState } from "react";
import FeatureModal from "@/components/modal/FeatureModal";

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
        <SidebarProvider>
            <SidebarLayout />
        </SidebarProvider>
    );
}

// Separate component that uses the sidebar hook
function SidebarLayout() {
    const [modal, setModal] = useState<boolean>(false);
    const { toggleSidebar } = useSidebar(); // Now this is inside SidebarProvider!

    const handleOpenModal = () => {
        setModal((prev) => !prev);
        toggleSidebar();
    };

    return (
        <>
            <AppSidebar openModal={handleOpenModal} />
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

            {/* Modal renders here */}
            {modal && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        onClick={handleOpenModal}
                        className="fixed inset-0 bg-black/50 cursor-pointer"
                        aria-label="Close modal"
                    />
                    <FeatureModal />
                </div>
            )}
        </>
    );
}
