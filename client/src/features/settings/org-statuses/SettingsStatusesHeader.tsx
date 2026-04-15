type SettingsStatusesHeaderProps = {
  title: string;
  description: string;
};

export function SettingsStatusesHeader({
  title,
  description,
}: SettingsStatusesHeaderProps) {
  return (
    <div className="flex w-200 flex-col items-start">
      <h1 className="typo-h4 font-bold">{title}</h1>
      <p className="typo-body-sm text-muted-foreground">{description}</p>
    </div>
  );
}
