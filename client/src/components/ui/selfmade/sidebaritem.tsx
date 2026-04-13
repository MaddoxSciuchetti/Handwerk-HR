import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon: LucideIcon;
}
export function SidebarItem({ label, icon: Icon, ...props }: SidebarItemProps) {
  return (
    <div
      className="group/hover flex cursor-pointer items-center gap-3 py-3"
      {...props}
    >
      <Icon className="h-6 w-6 text-interactive-primary-bg transition-colors group-hover/hover:text-interactive-disabled-text" />
      <p className="text-body-sm text-interactive-primary-bg transition-colors group-hover/hover:text-interactive-disabled-text">
        {label}
      </p>
    </div>
  );
}
