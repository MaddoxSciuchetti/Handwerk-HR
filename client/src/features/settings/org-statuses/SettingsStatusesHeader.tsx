import type { ReactNode } from 'react';

type SettingsStatusesHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function SettingsStatusesHeader({
  title,
  description,
  action,
}: SettingsStatusesHeaderProps) {
  return (
    <div className="flex w-200 flex-col items-start">
      {action}
      <h1 className={action ? 'typo-h4 mt-2 font-bold' : 'typo-h4 font-bold'}>
        {title}
      </h1>
      <p className="typo-body-sm text-muted-foreground">{description}</p>
    </div>
  );
}
