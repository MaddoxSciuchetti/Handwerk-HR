import { Button } from '@/components/ui/button';
import API from '@/config/apiClient';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { useGetTemplates } from '@/features/template-tasks/hooks/useGetTemplates';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutTemplate, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { WORKERBYID } from '../../consts/query-key.consts';
import type { TemplateApplyTarget } from '../../pendingTemplate';

type TemplateApplyPromptProps = {
  targets: TemplateApplyTarget[];
};

export function TemplateApplyPrompt({ targets }: TemplateApplyPromptProps) {
  const [open, setOpen] = useState(false);
  const [engagementId, setEngagementId] = useState(targets[0]?.engagementId);
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useGetTemplates();
  const selected =
    targets.find((target) => target.engagementId === engagementId) ??
    targets[0];

  const apply = useMutation({
    mutationFn: (templateId: string) => {
      if (!selected) throw new Error('Kein Einsatz ausgewählt');
      return API.post(`/worker/${selected.workerId}/templates/${templateId}/apply`, {
        workerEngagementId: selected.engagementId,
        remainingOnly: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      setOpen(false);
      toast.success('Aufgaben aus dem Template angelegt');
    },
    onError: () => toast.error('Template konnte nicht angewendet werden'),
  });

  if (!selected) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      {open ? (
        <section
          aria-label="Template auswählen"
          className="w-72 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm">
              Welches Template soll jetzt angewendet werden?
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Schließen"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          {targets.length > 1 ? (
            <div className="mb-2 flex flex-col gap-1">
              {targets.map((target) => (
                <button
                  key={target.engagementId}
                  type="button"
                  className={cn(
                    'rounded-lg px-2 py-1 text-left text-xs',
                    target.engagementId === selected.engagementId
                      ? 'bg-muted'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setEngagementId(target.engagementId)}
                >
                  {target.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {isLoading ? (
              <p className="px-1 text-xs text-muted-foreground">
                Templates werden geladen…
              </p>
            ) : (templates ?? []).length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">
                Keine Templates vorhanden
              </p>
            ) : (
              (templates ?? []).map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="ghost"
                  className="h-auto justify-start rounded-lg px-2 py-1.5 text-left"
                  disabled={apply.isPending}
                  onClick={() => apply.mutate(template.id)}
                >
                  <span className="truncate">{template.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {template._count.items}
                  </span>
                </Button>
              ))
            )}
          </div>
        </section>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 rounded-full bg-card shadow-lg"
        aria-label="Template wählen"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <LayoutTemplate className="size-4" />
      </Button>
    </div>
  );
}
