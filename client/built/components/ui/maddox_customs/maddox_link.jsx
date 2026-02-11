import * as React from "react";
import { cn } from "@/lib/utils";
function Maddox_Link({ className, ...props }) {
    return <a className={cn("bg-amber-100")} {...props}/>;
}
export { Maddox_Link };
