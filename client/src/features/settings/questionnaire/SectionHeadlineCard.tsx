import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import type { TemplateSection } from './questionnaireTemplate.types';

type SectionHeadlineCardProps = {
  section: TemplateSection;
  onChange: (section: TemplateSection) => void;
};

export function SectionHeadlineCard({
  section,
  onChange,
}: SectionHeadlineCardProps) {
  return (
    <div data-no-drag className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <input
        aria-label="Überschrift"
        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base font-semibold outline-none"
        value={section.title}
        maxLength={400}
        onChange={(event) =>
          onChange({ ...section, title: event.target.value })
        }
      />
      <PflichtfeldSwitch
        label="Optional"
        checked={section.optional === true}
        onChange={(checked) =>
          onChange({
            ...section,
            optional: checked || undefined,
          })
        }
      />
    </div>
  );
}
