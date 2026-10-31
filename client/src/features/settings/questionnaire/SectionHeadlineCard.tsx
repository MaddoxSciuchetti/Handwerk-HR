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
    <div data-no-drag className="flex min-w-0 flex-col gap-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Überschrift
      </p>
      <input
        aria-label="Überschrift"
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-base font-semibold outline-none"
        value={section.title}
        maxLength={400}
        onChange={(event) =>
          onChange({ ...section, title: event.target.value })
        }
      />
      <PflichtfeldSwitch
        label="Optional (BSB kann Abschnitt abwählen)"
        checked={section.optional === true}
        onChange={(checked) =>
          onChange({
            ...section,
            optional: checked || undefined,
          })
        }
      />
      <p className="text-xs text-muted-foreground">
        Ziehen Sie Fragen unter diese Überschrift, um sie zuzuordnen.
      </p>
    </div>
  );
}
