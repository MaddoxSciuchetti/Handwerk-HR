import { Button } from '@/components/ui/button';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { useGetTemplates } from '@/features/template-tasks/hooks/useGetTemplates';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LayoutTemplate, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { WORKERBYID } from '../../consts/query-key.consts';
import type { TemplateApplyTarget } from '../../pendingTemplate';
import {
  applyTemplate,
  previewTemplate,
  type AutomationChoice,
} from '../../api/templateApplication.api';
import { TemplateAutomationConfirmation } from './TemplateAutomationConfirmation';

const dismissKey = (id: string) => `template-prompt-dismissed:${id}`;

export function TemplateApplyPrompt({
  targets,
}: {
  targets: TemplateApplyTarget[];
}) {
  const [open, setOpen] = useState(() =>
    Boolean(
      targets[0] && !sessionStorage.getItem(dismissKey(targets[0].engagementId))
    )
  );
  const [previousId, setPreviousId] = useState(targets[0]?.engagementId);
  const [engagementId, setEngagementId] = useState(targets[0]?.engagementId);
  const [templateId, setTemplateId] = useState<string>();
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [handled, setHandled] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useGetTemplates();
  const available = targets.filter(
    (target) => !handled.includes(target.engagementId)
  );
  const selected =
    available.find((target) => target.engagementId === engagementId) ??
    available[0];
  const selectedId = selected?.engagementId;
  const preview = useQuery({
    queryKey: [
      'template-application-preview',
      selected?.workerId,
      selectedId,
      templateId,
    ],
    queryFn: () =>
      previewTemplate(selected!.workerId, selectedId!, templateId!),
    enabled: Boolean(selected && templateId),
  });
  if (selectedId !== previousId) {
    setPreviousId(selectedId);
    setTemplateId(undefined);
    setRequestKey(crypto.randomUUID());
    setOpen(
      Boolean(selectedId && !sessionStorage.getItem(dismissKey(selectedId)))
    );
  }

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
    void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
  };
  const apply = useMutation({
    mutationFn: (input: {
      runAutomation: boolean;
      choices: Record<string, AutomationChoice>;
      target: TemplateApplyTarget;
      templateId: string;
      templateRevision?: string;
    }) =>
      applyTemplate(input.target.workerId, input.templateId, {
        workerEngagementId: input.target.engagementId,
        runAutomation: input.runAutomation,
        choices: input.choices,
        idempotencyKey: requestKey,
        templateRevision: input.templateRevision,
      }),
    onSuccess: (result, input) => {
      refresh();
      setHandled((current) => [...current, input.target.engagementId]);
      setOpen(false);
      if (result.outcomes.length || result.running) {
        const succeeded = result.outcomes.filter(
          (outcome) => outcome.status === 'completed'
        ).length;
        const failed = result.outcomes.filter(
          (outcome) => outcome.status === 'failed'
        ).length;
        const pending = result.outcomes.filter(
          (outcome) => outcome.status === 'pending'
        ).length;
        const message = result.running
          ? 'Automatisierung läuft bereits.'
          : `${succeeded} erfolgreich · ${failed} fehlgeschlagen${pending ? ` · ${pending} zu prüfen` : ''}`;
        if (failed || pending) toast.error(message);
        else toast.success(message);
      } else toast.success('Aufgaben erstellt');
    },
    onError: (error: Error) => {
      refresh();
      void queryClient.invalidateQueries({
        queryKey: ['template-application-preview'],
      });
      toast.error(error.message || 'Template konnte nicht angewendet werden');
    },
  });
  useEffect(() => {
    if (!apply.isPending) return;
    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [apply.isPending, queryClient]);

  if (!selected && !apply.isPending) return null;
  const close = () => {
    if (selectedId) sessionStorage.setItem(dismissKey(selectedId), '1');
    setOpen(false);
  };
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      {open && selected && (
        <section
          aria-label="Template auswählen"
          className="max-h-[75vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {templateId ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zurück zur Template-Auswahl"
                disabled={apply.isPending}
                onClick={() => {
                  setTemplateId(undefined);
                  setRequestKey(crypto.randomUUID());
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : (
              <p className="text-sm font-medium">Template auswählen</p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto rounded-full"
              aria-label="Schließen"
              onClick={close}
            >
              <X className="size-4" />
            </Button>
          </div>
          {available.length > 1 && (
            <div className="mb-2 flex flex-col gap-1">
              {available.map((target) => (
                <button
                  key={target.engagementId}
                  type="button"
                  disabled={apply.isPending}
                  className={cn(
                    'rounded-lg px-2 py-1 text-left text-xs',
                    target.engagementId === selectedId
                      ? 'bg-muted'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setEngagementId(target.engagementId)}
                >
                  {target.label}
                </button>
              ))}
            </div>
          )}
          {templateId ? (
            <>
              {preview.isPending && (
                <p className="text-xs text-muted-foreground">
                  Template wird geladen…
                </p>
              )}
              {preview.isError && (
                <p role="alert" className="text-xs text-destructive">
                  Template konnte nicht geladen werden.
                </p>
              )}
              {preview.data && (
                <TemplateAutomationConfirmation
                  key={`${selectedId}:${templateId}:${preview.data.revision}`}
                  template={preview.data}
                  engagementId={selectedId!}
                  busy={apply.isPending}
                  onApply={(runAutomation, choices) =>
                    apply.mutate({
                      runAutomation,
                      choices,
                      target: selected,
                      templateId,
                      templateRevision: preview.data?.revision,
                    })
                  }
                />
              )}
            </>
          ) : (
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {isLoading ? (
                <p className="px-1 text-xs text-muted-foreground">
                  Templates werden geladen…
                </p>
              ) : !templates?.length ? (
                <p className="px-1 text-xs text-muted-foreground">
                  Keine Templates vorhanden
                </p>
              ) : (
                templates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="ghost"
                    className="h-auto justify-start rounded-lg px-2 py-1.5 text-left"
                    disabled={apply.isPending}
                    onClick={() => setTemplateId(template.id)}
                  >
                    <span className="truncate">{template.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {template._count.items}
                    </span>
                  </Button>
                ))
              )}
            </div>
          )}
        </section>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 rounded-full bg-card shadow-lg"
        aria-label="Template wählen"
        aria-expanded={open}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
      >
        <LayoutTemplate className="size-4" />
      </Button>
    </div>
  );
}
