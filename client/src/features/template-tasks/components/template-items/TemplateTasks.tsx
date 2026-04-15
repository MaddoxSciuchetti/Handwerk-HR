type TemplateTasksProps = {
  templateId: string;
  templateName: string;
};

export function TemplateTasks({
  templateId,
  templateName,
}: TemplateTasksProps) {
  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">{templateName}</h1>
      </div>
    </div>
  );
}
