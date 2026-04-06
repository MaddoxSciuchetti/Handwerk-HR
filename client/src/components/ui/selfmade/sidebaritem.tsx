import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon: LucideIcon;
}
export function SidebarItem({ label, icon: Icon, ...props }: SidebarItemProps) {
  return (
    <div
      className="flex items-center gap-3 py-3 group/hover cursor-pointer"
      {...props}
    >
      <Icon className="w-6 h-6 text-interactive-disabled-text group-hover/hover:text-interactive-primary-bg " />
      <p className="text-interactive-disabled-text text-body-sm group-hover/hover:text-interactive-primary-bg ">
        {label}
      </p>
    </div>
  );
}
