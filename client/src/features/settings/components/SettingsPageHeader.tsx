import type { ReactNode } from 'react';

type SettingsPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SettingsPageHeader({
  title,
  description,
  action,
}: SettingsPageHeaderProps) {
  return (
    <div className="flex w-200 shrink-0 flex-col items-start">
      {action}
      <h1 className={action ? 'typo-h4 mt-2 font-bold' : 'typo-h4 font-bold'}>
        {title}
      </h1>
      {description ? (
        <p className="typo-body-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
