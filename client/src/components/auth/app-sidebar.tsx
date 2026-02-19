import {
    Calendar,
    Home,
    Inbox,
    Search,
    Settings,
    HandMetal,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

import UserMenu from "./UserMenu";
import useAuth from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";

// Menu items.

const items = [
    {
        title: "Mein Mitarbeiter",
        to: "/mitarbeiter-uebersicht",
        icon: Home,
        requiredPermission: "CHEF",
    },
    {
        title: "Meine Handwerker",
        to: "/handwerker",
        icon: Inbox,
    },
    {
        title: "Vorlage",
        to: "/template-konfiguration",
        icon: Settings,
        requiredPermission: "CHEF",
    },
    {
        title: "Mitarbeiter Monitor",
        to: "/dashboard/ceo",
        icon: HandMetal,
        requiredPermission: "CHEF",
    },
];

export function AppSidebar({}) {
    const { user, isError } = useAuth();

    const hasPermission = useMemo(() => {
        return (requiredPermission: string | undefined) => {
            if (!requiredPermission) return true;
            if (user?.user_permission !== requiredPermission) return false;
            return true;
        };
    }, [user?.user_permission]);

    const accessibleItems = useMemo(() => {
        if (!user) return [];
        return items.filter((item) => hasPermission(item.requiredPermission));
    }, [hasPermission]);

    if (user === undefined) {
        return "";
    }
    return (
        <Sidebar className="bg-gray-100 rounded-2xl">
            <SidebarHeader className="mt-5 flex flex-row align-middle">
                <UserMenu />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-black">
                        BSB Team
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="text-black">
                            {accessibleItems.map((item, index) => (
                                <SidebarMenuItem
                                    className="text-black"
                                    key={index}
                                >
                                    <SidebarMenuButton asChild>
                                        <Link to={item.to}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
