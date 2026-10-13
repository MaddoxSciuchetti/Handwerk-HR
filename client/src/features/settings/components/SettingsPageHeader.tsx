import type { ReactNode } from 'react';

type SettingsPageHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function SettingsPageHeader({ title, action }: SettingsPageHeaderProps) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start">
      {action}
      <h1 className={action ? 'typo-h4 mt-2 font-bold' : 'typo-h4 font-bold'}>
        {title}
      </h1>
    </div>
  );
}
