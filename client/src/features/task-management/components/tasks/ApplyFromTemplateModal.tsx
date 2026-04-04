import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { templateV2Queries } from '@/features/template-tasks/query-options/queries/templateV2.queries';
import { useMutation, useQuery } from '@tanstack/react-query';
import { workerMutations } from '../../query-options/mutations/worker.mutations';
import type { LifecycleType } from '../../types/index.types';

type ApplyFromTemplateModalProps = {
  workerId: string;
  workerEngagementId: string;
  lifecycleType: LifecycleType;
  onClose: () => void;
};

export default function ApplyFromTemplateModal({
  workerId,
  workerEngagementId,
  lifecycleType,
  onClose,
}: ApplyFromTemplateModalProps) {
  const { data: templates = [], isPending } = useQuery(
    templateV2Queries.list()
  );

  const templatesForCurrentPhase = templates.filter(
    (issueTemplate) => issueTemplate.type === lifecycleType
  );

  const { mutate, isPending: isApplying, variables } = useMutation(
    workerMutations.applyIssueTemplate(workerId)
  );

  return (
    <SmallWrapper className="max-h-[min(90vh,28rem)] min-h-48">
      <div className="flex w-full min-h-0 flex-col gap-3 text-left">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Aus Vorlage übernehmen
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wählen Sie eine Vorlage. Es werden Aufgaben für diese Phase angelegt.
          </p>
        </div>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Lade Vorlagen…</p>
        ) : templatesForCurrentPhase.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Vorlage für diese Phase vorhanden.
          </p>
        ) : (
          <ul className="max-h-64 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {templatesForCurrentPhase.map((issueTemplate) => {
              const isApplyingThisTemplate =
                isApplying && variables?.templateId === issueTemplate.id;
              return (
                <li key={issueTemplate.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                    disabled={isApplying}
                    onClick={() =>
                      mutate(
                        {
                          templateId: issueTemplate.id,
                          workerEngagementId,
                        },
                        { onSuccess: onClose }
                      )
                    }
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">
                        {issueTemplate.name}
                        {isApplyingThisTemplate ? ' …' : ''}
                      </span>
                      {issueTemplate.description ? (
                        <span className="text-xs font-normal text-muted-foreground line-clamp-2">
                          {issueTemplate.description}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {issueTemplate._count.items}{' '}
                        {issueTemplate._count.items === 1 ? 'Punkt' : 'Punkte'}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </SmallWrapper>
  );
}
