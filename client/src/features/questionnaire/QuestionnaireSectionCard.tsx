import { questionnaireSectionHeading } from '@shared/questionnaireSections';
import type { ReactNode } from 'react';
import { PflichtfeldSwitch } from '@/features/settings/questionnaire/PflichtfeldSwitch';

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
  preview,
  omitted = false,
  onOmitChange,
  children,
}: QuestionnaireSectionCardProps) {
  const { title: heading, hint } = questionnaireSectionHeading(title);
  const showOmit = Boolean(preview && onOmitChange);

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
        {showOmit ? (
          <PflichtfeldSwitch
            label="Mitsenden"
            checked={!omitted}
            onChange={(checked) => onOmitChange?.(!checked)}
          />
        ) : null}
      </div>
      {omitted ? (
        <p className="border-t border-border/60 px-5 py-3 text-sm text-muted-foreground">
          Dieser Abschnitt wird nicht mitgesendet.
        </p>
      ) : (
        <div className="flex flex-col gap-4 border-t border-border/60 px-3 pt-3 pb-4">
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
