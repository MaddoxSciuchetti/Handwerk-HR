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
      className={`rounded-2xl border bg-muted/50 ${
        omitted ? 'border-dashed border-border opacity-80' : 'border-border'
      }`}
      aria-label={heading}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{heading}</h2>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {showGate ? (
          <fieldset className="flex shrink-0 items-center gap-3">
            <legend className="sr-only">{heading} mitsenden</legend>
            <span className="text-sm text-muted-foreground">Mitsenden</span>
            <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
              <input
                type="radio"
                name={`section-include-${title}`}
                checked={!omitted}
                className="size-4 accent-primary"
                onChange={() => onOmitChange?.(false)}
              />
              Ja
            </Label>
            <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
              <input
                type="radio"
                name={`section-include-${title}`}
                checked={omitted}
                className="size-4 accent-primary"
                onChange={() => onOmitChange?.(true)}
              />
              Nein
            </Label>
          </fieldset>
        ) : null}
      </div>
      {omitted ? (
        <p className="border-t border-border/60 px-5 py-3 text-sm text-muted-foreground">
          Dieser Abschnitt wird nicht mitgesendet. Der Mitarbeiter muss hier
          nichts ausfüllen.
        </p>
      ) : (
        <div className="flex flex-col gap-2 border-t border-border/60 px-3 pt-1 pb-3">
          {wrapQuestionCards(children)}
        </div>
      )}
    </section>
  );
}

/** Put each direct child in a white card so the fill UI matches the editor. */
function wrapQuestionCards(children: ReactNode) {
  if (children == null) return null;
  const list = Array.isArray(children) ? children : [children];
  return list.map((child, index) => {
    if (child == null || child === false) return null;
    return (
      <div
        key={index}
        className="rounded-xl border border-border bg-card px-4 py-4"
      >
        {child}
      </div>
    );
  });
}
