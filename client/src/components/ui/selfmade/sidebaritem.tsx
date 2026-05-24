import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
}
export function SidebarItem({
  label,
  icon: Icon,
  collapsed = false,
  className,
  ...props
}: SidebarItemProps) {
  const item = (
    <div
      className={`group/hover flex cursor-pointer items-center py-3 ${
        collapsed ? 'justify-center' : 'gap-3'
      } ${className ?? ''}`}
      {...props}
    >
      <Icon className="h-5 w-5 text-interactive-primary-bg transition-colors group-hover/hover:text-interactive-disabled-text" />
      {!collapsed && (
        <p className="typo-body-sm text-interactive-primary-bg transition-colors group-hover/hover:text-interactive-disabled-text">
          {label}
        </p>
      )}
    </div>
  );

  if (!collapsed) return item;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="bg-interactive-primary-bg px-2 py-1 text-xs text-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
