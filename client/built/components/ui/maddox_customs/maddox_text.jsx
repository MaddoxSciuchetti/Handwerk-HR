import * as React from "react";
import { cn } from "@/lib/utils";
function Text({ className, ...props }) {
    return <p className={cn("flex")} {...props}/>;
}
export { Text };
