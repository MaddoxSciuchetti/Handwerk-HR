import { Label } from '@/components/ui/label';
import { PflichtfeldSwitch } from './PflichtfeldSwitch';
import type { TemplateItem, TemplateSection } from './questionnaireTemplate.types';

type SectionHeadlineCardProps = {
  section: TemplateSection;
  items: TemplateItem[];
  memberKeys: string[];
  onChange: (section: TemplateSection) => void;
  onMembersChange: (memberKeys: string[]) => void;
};

function itemLabel(item: TemplateItem) {
  if (item.kind === 'section') return item.title;
  if (item.kind === 'repeater') return item.section;
  return item.label || item.key;
}

export function SectionHeadlineCard({
  section,
  items,
  memberKeys,
  onChange,
  onMembersChange,
}: SectionHeadlineCardProps) {
  const selected = new Set(memberKeys);
  const assignable = items.filter((item) => item.kind !== 'section');

  const toggle = (key: string) => {
    if (selected.has(key)) {
      onMembersChange(memberKeys.filter((entry) => entry !== key));
      return;
    }
    onMembersChange([...memberKeys, key]);
  };

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
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-sm font-medium">Fragen unter dieser Überschrift</p>
        <p className="text-xs text-muted-foreground">
          Haken setzen oder entfernen, um Fragen zuzuordnen. Reihenfolge bleibt
          erhalten.
        </p>
        {assignable.length === 0 ? (
          <p className="text-xs text-muted-foreground">Noch keine Fragen.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {assignable.map((item) => (
              <li key={item.key}>
                <Label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={selected.has(item.key)}
                    onChange={() => toggle(item.key)}
                  />
                  <span className="min-w-0 truncate">{itemLabel(item)}</span>
                </Label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
