import { Label } from '@/components/ui/label';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import type { TemplateSection } from './questionnaireTemplate.types';

type SectionHeadlineCardProps = {
  section: TemplateSection;
  onChange: (section: TemplateSection) => void;
  /** When set (send dialog), BSB chooses whether this section goes to the worker. */
  onOmitChange?: (omitted: boolean) => void;
};

export function SectionHeadlineCard({
  section,
  onChange,
  onOmitChange,
}: SectionHeadlineCardProps) {
  const omitted = section.omitFromWorker === true;
  const showOmit = Boolean(onOmitChange) && section.optional === true;

  return (
    <div
      data-no-drag
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
    >
      <input
        aria-label="Überschrift"
        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base font-semibold outline-none"
        value={section.title}
        maxLength={400}
        onChange={(event) =>
          onChange({ ...section, title: event.target.value })
        }
      />
      {showOmit ? (
        <fieldset className="flex shrink-0 items-center gap-3">
          <legend className="sr-only">{section.title} mitsenden</legend>
          <span className="text-sm text-muted-foreground">Mitsenden</span>
          <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
            <input
              type="radio"
              name={`section-include-${section.key}`}
              checked={!omitted}
              className="size-4 accent-primary"
              onChange={() => onOmitChange?.(false)}
            />
            Ja
          </Label>
          <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
            <input
              type="radio"
              name={`section-include-${section.key}`}
              checked={omitted}
              className="size-4 accent-primary"
              onChange={() => onOmitChange?.(true)}
            />
            Nein
          </Label>
        </fieldset>
      ) : (
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
      )}
    </div>
  );
}
