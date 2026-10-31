import { Label } from '@/components/ui/label';
import {
  isOptionalQuestionnaireSection,
  questionnaireSectionHeading,
} from '@shared/questionnaireSections';
import type { ReactNode } from 'react';

type QuestionnaireSectionCardProps = {
  title: string;
  optional?: boolean;
  preview?: boolean;
  omitted?: boolean;
  onOmitChange?: (omitted: boolean) => void;
  children?: ReactNode;
};

export function QuestionnaireSectionCard({
  title,
  optional: optionalProp,
  preview,
  omitted = false,
  onOmitChange,
  children,
}: QuestionnaireSectionCardProps) {
  const { title: heading, hint } = questionnaireSectionHeading(title);
  const optional =
    optionalProp === true || isOptionalQuestionnaireSection(title);
  const showGate = Boolean(preview && optional && onOmitChange);

  return (
    <section
      className={`rounded-2xl border border-border bg-card/60 p-4 sm:p-5 ${
        omitted ? 'border-dashed opacity-80' : ''
      }`}
      aria-label={heading}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{heading}</h2>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {showGate ? (
          <fieldset className="flex shrink-0 flex-col gap-1.5 sm:items-end">
            <legend className="sr-only">{heading} mitsenden</legend>
            <p className="text-xs font-medium text-foreground">
              Für diesen Mitarbeiter erforderlich?
            </p>
            <div className="flex gap-4">
              <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                <input
                  type="radio"
                  name={`section-include-${title}`}
                  checked={!omitted}
                  className="size-4 accent-primary"
                  onChange={() => onOmitChange?.(false)}
                />
                Ja
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                <input
                  type="radio"
                  name={`section-include-${title}`}
                  checked={omitted}
                  className="size-4 accent-primary"
                  onChange={() => onOmitChange?.(true)}
                />
                Nein
              </Label>
            </div>
          </fieldset>
        ) : null}
      </div>
      {omitted ? (
        <p className="text-sm text-muted-foreground">
          Dieser Abschnitt wird nicht mitgesendet. Der Mitarbeiter muss hier
          nichts ausfüllen.
        </p>
      ) : (
        <div className="flex flex-col gap-4">{children}</div>
      )}
    </section>
  );
}
