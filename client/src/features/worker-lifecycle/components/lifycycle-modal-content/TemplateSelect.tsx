import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetTemplates } from '@/features/template-tasks/hooks/useGetTemplates';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';

const NO_TEMPLATE_VALUE = '__none__';

type TemplateSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
};
export function TemplateSelect<T extends FieldValues>({
  control,
  name,
}: TemplateSelectProps<T>) {
  const { data: templates, isLoading } = useGetTemplates();
  const allTemplates = templates ?? [];

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="ds-label-base typo-body-sm">Template (optional)</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ?? NO_TEMPLATE_VALUE}
            onValueChange={(v) =>
              field.onChange(v === NO_TEMPLATE_VALUE ? undefined : v)
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue
                placeholder={
                  isLoading
                    ? 'Templates werden geladen...'
                    : 'Kein Template auswählen'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEMPLATE_VALUE}>Kein Template</SelectItem>
              {allTemplates.length === 0 && !isLoading && (
                <SelectItem value="__empty__" disabled>
                  Keine Templates vorhanden
                </SelectItem>
              )}
              {allTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.templateName}
                  {template.type ? ` · ${template.type}` : ''} (
                  {template._count.items} Aufgaben)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
