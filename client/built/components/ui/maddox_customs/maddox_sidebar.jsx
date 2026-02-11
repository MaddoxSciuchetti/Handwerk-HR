import * as React from "react";
import { cn } from "@/lib/utils";
function Sidebar({ className, ...props }) {
    return (<aside className={cn("w-3xs shrink-0 border-r  text-foreground", className)} {...props}/>);
}
function SidebarSection({ className, ...props }) {
    return (<div className={cn("rounded-lg border bg-card text-card-foreground p-4", className)} {...props}/>);
}
export { Sidebar, SidebarSection };
