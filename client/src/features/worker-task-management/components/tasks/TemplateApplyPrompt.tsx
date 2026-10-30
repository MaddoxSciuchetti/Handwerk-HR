import { scheduleDateLabel } from '@/features/all-tasks/utils/deactivationSchedule';
import { TEMPLATE_DEMO_MODE } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Item } from '@/components/ui/item';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { useGetTemplates } from '@/features/template-tasks/hooks/useGetTemplates';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronUp,
  LayoutTemplate,
  X,
  CheckCircle2,
  CircleAlert,
  Circle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { WORKERBYID } from '../../consts/query-key.consts';
import type { TemplateApplyTarget } from '../../pendingTemplate';
import {
  applyTemplate,
  dismissTemplateApplication,
  getTemplateApplication,
  previewTemplate,
  type AutomationChoice,
  type TemplateApplicationResult,
} from '../../api/templateApplication.api';
import { TemplateAutomationProgress } from './TemplateAutomationProgress';
import {
  automationRevealQueryKey,
  mergeAutomationProgress,
  mergeAutomationReveal,
  type AutomationProgress,
  type AutomationReveal,
} from '../../utils/automationProgress';
import { TemplateAutomationConfirmation } from './TemplateAutomationConfirmation';
import { useTemplateAutomationOptions } from '../../hooks/useTemplateAutomationOptions';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';

const dismissKey = (id: string) => `template-prompt-dismissed:${id}`;
const resultsDismissKey = (id: string) => `template-results-dismissed:${id}`;

export function TemplateApplyPrompt({
  targets,
}: {
  targets: TemplateApplyTarget[];
}) {
  const [open, setOpen] = useState(false);
  const [previousId, setPreviousId] = useState(targets[0]?.engagementId);
  const [templateId, setTemplateId] = useState<string>();
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [synchronizing, setSynchronizing] = useState(false);
  const [fadingEngagement, setFadingEngagement] = useState<string | null>(null);
  const [mockedRun, setMockedRun] = useState(false);
  const [lastRun, setLastRun] = useState<{
    target: TemplateApplyTarget;
    templateName: string;
    result: TemplateApplicationResult;
  }>();
  const [showResults, setShowResults] = useState(true);
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>(() =>
    targets
      .map((target) => target.engagementId)
      .filter((id) => sessionStorage.getItem(resultsDismissKey(id)))
  );
  const [handled, setHandled] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useGetTemplates();
  const available = targets.filter(
    (target) =>
      !handled.includes(target.engagementId) &&
      !hiddenIds.includes(target.engagementId) &&
      !sessionStorage.getItem(resultsDismissKey(target.engagementId))
  );
  const selected = available[0];
  const selectedId = selected?.engagementId;
  useTemplateAutomationOptions({
    engagementId: selectedId,
    hasMail: Boolean(selectedId),
    hasTeams: Boolean(selectedId),
  });
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
    setOpen(false);
  }

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [WORKERBYID] }),
        queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] }),
      ]),
    [queryClient]
  );
  const publishReveal = useCallback(
    (
      engagementId: string,
      result: TemplateApplicationResult,
      progress: AutomationProgress,
      active: boolean
    ) => {
      const key = automationRevealQueryKey(engagementId);
      if (!active) {
        queryClient.setQueryData<AutomationReveal | null>(key, null);
        return;
      }
      queryClient.setQueryData<AutomationReveal | null>(key, (previous) =>
        mergeAutomationReveal(previous, result, progress)
      );
    },
    [queryClient]
  );
  const apply = useMutation({
    mutationFn: async (input: {
      runAutomation: boolean;
      choices: Record<string, AutomationChoice>;
      target: TemplateApplyTarget;
      templateId: string;
      templateRevision?: string;
      templateName: string;
      automationCount: number;
      requestKey: string;
    }) => {
      const request = () =>
        applyTemplate(input.target.workerId, input.templateId, {
          workerEngagementId: input.target.engagementId,
          runAutomation: input.runAutomation,
          choices: input.choices,
          idempotencyKey: input.requestKey,
          templateRevision: input.templateRevision,
        });
      const progressKey = [
        'template-application-progress',
        input.requestKey,
      ] as const;
      const recordProgress = (result: TemplateApplicationResult) => {
        const previous =
          queryClient.getQueryData<AutomationProgress>(progressKey);
        const progress = mergeAutomationProgress(previous, result);
        queryClient.setQueryData<AutomationProgress>(progressKey, progress);
        if (input.runAutomation)
          publishReveal(input.target.engagementId, result, progress, true);
      };
      let result = await request();
      recordProgress(result);
      // Reusing the same application key reads the receipt without rerunning actions.
      while (result.running) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        result = await request();
        recordProgress(result);
      }
      return result;
    },
    onMutate: (input) => {
      if (!input.runAutomation) return;
      const worker = queryClient.getQueryData<WorkerDetailResponse>([
        WORKERBYID,
        input.target.workerId,
      ]);
      const baselineIds =
        worker?.data.engagements.flatMap((engagement) =>
          (engagement.issues ?? []).map((issue) => issue.id)
        ) ?? [];
      queryClient.setQueryData<AutomationReveal>(
        automationRevealQueryKey(input.target.engagementId),
        { baselineIds, visibleIds: [] }
      );
    },
    onSuccess: async (result, input) => {
      setSynchronizing(true);
      // Keep the mutation pending until the visible task queries have caught up.
      await refresh();
      publishReveal(
        input.target.engagementId,
        result,
        { finishedIds: [] },
        false
      );
      const run = {
        target: input.target,
        templateName: input.templateName,
        result,
      };
      setLastRun(run);
      queryClient.setQueryData(
        [
          'template-application-result',
          input.target.workerId,
          input.target.engagementId,
        ],
        run
      );
      setShowResults(true);
      sessionStorage.removeItem(resultsDismissKey(input.target.engagementId));
      setResultsDismissed(false);
      if (TEMPLATE_DEMO_MODE) {
        setTemplateId(undefined);
        setRequestKey(crypto.randomUUID());
      } else {
        setHandled((current) => [...current, input.target.engagementId]);
      }
      setOpen(false);
      if (result.outcomes.length || result.running) {
        const succeeded = result.outcomes.filter(
          (outcome) => outcome.status === 'completed'
        ).length;
        const scheduled = result.outcomes.filter(
          (outcome) => outcome.status === 'scheduled'
        ).length;
        const failed = result.outcomes.filter(
          (outcome) => outcome.status === 'failed'
        ).length;
        const pending = result.outcomes.filter(
          (outcome) => outcome.status === 'pending'
        ).length;
        const message = result.running
          ? 'Automatisierung läuft bereits.'
          : `${succeeded} erfolgreich · ${failed} fehlgeschlagen${scheduled ? ` · ${scheduled} geplant` : ''}${pending ? ` · ${pending} zu prüfen` : ''}`;
        if (failed || pending) toast.error(message);
        else toast.success(message);
      } else toast.success('Aufgaben erstellt');
    },
    onError: (error: Error, input) => {
      publishReveal(
        input.target.engagementId,
        { count: 0, issueIds: [], outcomes: [], running: false },
        { finishedIds: [] },
        false
      );
      void refresh();
      void queryClient.invalidateQueries({
        queryKey: ['template-application-preview'],
      });
      toast.error(error.message || 'Template konnte nicht angewendet werden');
    },
  });
  const liveRun = useQuery({
    queryKey: ['template-application-progress', apply.variables?.requestKey],
    queryFn: async () => {
      const target = apply.variables!.target;
      const record = await getTemplateApplication(
        target.workerId,
        target.engagementId
      );
      const key = [
        'template-application-progress',
        apply.variables!.requestKey,
      ];
      const previous = queryClient.getQueryData<AutomationProgress>(key);
      const progress =
        record?.idempotencyKey === apply.variables!.requestKey
          ? mergeAutomationProgress(previous, record.result)
          : (previous ?? null);
      if (
        progress &&
        record?.idempotencyKey === apply.variables!.requestKey &&
        apply.variables?.runAutomation
      )
        publishReveal(target.engagementId, record.result, progress, true);
      return progress;
    },
    enabled: apply.isPending && !synchronizing,
    refetchInterval: 1000,
  });
  const resultTarget = selected ?? lastRun?.target;
  const savedRun = useQuery({
    queryKey: [
      'template-application-result',
      resultTarget?.workerId,
      resultTarget?.engagementId,
    ],
    queryFn: async () => {
      const record = await getTemplateApplication(
        resultTarget!.workerId,
        resultTarget!.engagementId
      );
      return record ? { ...record, target: resultTarget! } : null;
    },
    enabled: Boolean(resultTarget) && !apply.isPending,
    refetchInterval: open && showResults ? 2000 : false,
  });
  const completedRun = savedRun.data ?? lastRun;
  const hasVisibleRun =
    Boolean(completedRun) &&
    !resultsDismissed &&
    !(
      resultTarget &&
      sessionStorage.getItem(resultsDismissKey(resultTarget.engagementId))
    );
  useEffect(() => {
    if (!savedRun.data?.dismissed || !resultTarget) return;
    const engagementId = resultTarget.engagementId;
    sessionStorage.setItem(resultsDismissKey(engagementId), '1');
    setHiddenIds((current) =>
      current.includes(engagementId) ? current : [...current, engagementId]
    );
    setResultsDismissed(true);
    setShowResults(false);
    setOpen(false);
  }, [savedRun.data?.dismissed, resultTarget]);
  useEffect(() => {
    if (!apply.isPending || synchronizing) return;
    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [apply.isPending, synchronizing, queryClient]);

  const automationTasks = completedRun?.result.tasks
    ? completedRun.result.tasks.filter((task) =>
        completedRun.result.outcomes.some(
          (outcome) => outcome.issueId === task.id
        )
      )
    : (completedRun?.result.outcomes ?? []).map((outcome) => ({
        id: outcome.issueId,
        title: 'Automatisierung',
        status:
          outcome.status === 'completed'
            ? 'done'
            : outcome.status === 'failed'
              ? 'error'
              : outcome.status === 'scheduled'
                ? 'open'
                : 'in_progress',
      }));
  const running = apply.isPending;
  const receiptDismissed = Boolean(savedRun.data?.dismissed);
  const hiddenEngagement =
    Boolean(resultTarget) &&
    (hiddenIds.includes(resultTarget.engagementId) ||
      Boolean(
        sessionStorage.getItem(resultsDismissKey(resultTarget.engagementId))
      ) ||
      receiptDismissed);
  const close = () => {
    if (selectedId) sessionStorage.setItem(dismissKey(selectedId), '1');
    setOpen(false);
  };
  const dismissRun = useCallback(
    (target: Pick<TemplateApplyTarget, 'workerId' | 'engagementId'>) => {
      const { workerId, engagementId } = target;
      sessionStorage.setItem(dismissKey(engagementId), '1');
      setOpen(false);
      sessionStorage.setItem(resultsDismissKey(engagementId), '1');
      setHiddenIds((current) =>
        current.includes(engagementId) ? current : [...current, engagementId]
      );
      setResultsDismissed(true);
      setShowResults(false);
      void dismissTemplateApplication(workerId, engagementId)
        .then(() => refresh())
        .catch((error: { message?: string }) => {
          sessionStorage.removeItem(resultsDismissKey(engagementId));
          setHiddenIds((current) =>
            current.filter((id) => id !== engagementId)
          );
          setResultsDismissed(false);
          setOpen(true);
          setFadingEngagement(null);
          toast.error(
            error.message || 'Leiste konnte nicht geschlossen werden'
          );
        });
    },
    [refresh]
  );
  const dismissBar = () => {
    if (resultTarget && !running) dismissRun(resultTarget);
  };
  const completedTarget = completedRun?.target;
  const succeeded = Boolean(
    completedRun &&
    !completedRun.result.running &&
    completedRun.result.outcomes.every(
      (outcome) =>
        outcome.status === 'completed' || outcome.status === 'scheduled'
    )
  );
  const completedWorkerId = completedTarget?.workerId;
  const completedEngagementId = completedTarget?.engagementId;
  useEffect(() => {
    if (
      running ||
      open ||
      !hasVisibleRun ||
      !succeeded ||
      !completedWorkerId ||
      !completedEngagementId
    )
      return;
    let fadeTimer: number;
    const holdTimer = window.setTimeout(() => {
      setFadingEngagement(completedEngagementId);
      fadeTimer = window.setTimeout(
        () =>
          dismissRun({
            workerId: completedWorkerId,
            engagementId: completedEngagementId,
          }),
        450
      );
    }, 1500);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [
    running,
    open,
    hasVisibleRun,
    succeeded,
    completedWorkerId,
    completedEngagementId,
    dismissRun,
  ]);
  const fading =
    !running &&
    !open &&
    succeeded &&
    fadingEngagement === completedEngagementId;
  if (!running && hiddenEngagement && !selected) return null;
  if (
    !running &&
    receiptDismissed &&
    selected?.engagementId === resultTarget?.engagementId
  ) {
    const others = available.filter(
      (target) => target.engagementId !== resultTarget?.engagementId
    );
    if (!others.length) return null;
  }
  if (!selected && !apply.isPending && !completedRun) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      {createPortal(
        <div
          aria-hidden="true"
          onClick={close}
          className={cn(
            'fixed inset-0 z-30 bg-blue-50/[0.03] backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none dark:bg-blue-950/[0.02]',
            open && !running ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        />,
        document.body
      )}
      <div
        className={cn(
          'grid w-80 max-w-[calc(100vw-2rem)] transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          open && !running
            ? 'grid-rows-[1fr] translate-y-0 opacity-100'
            : 'pointer-events-none grid-rows-[0fr] translate-y-2 opacity-0'
        )}
        inert={!open || running}
        aria-hidden={!open || running}
      >
        <div className="min-h-0 overflow-hidden">
          {showResults && hasVisibleRun && completedRun ? (
            <section
              aria-label="Ergebnis der Automatisierung"
              className="max-h-[65vh] overflow-y-auto rounded-2xl border border-border bg-card p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Ausgeführte Aufgaben
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Schließen"
                  onClick={close}
                >
                  <X className="size-4" />
                </Button>
              </div>
              {!automationTasks.length && (
                <p className="py-2 text-xs text-muted-foreground">
                  Keine Automatisierungen ausgeführt.
                </p>
              )}
              <Accordion type="multiple">
                {automationTasks.map((task) => {
                  const outcome = completedRun.result.outcomes.find(
                    (entry) => entry.issueId === task.id
                  );
                  const date =
                    'scheduledDeactivateAt' in task
                      ? task.scheduledDeactivateAt
                      : null;
                  const label = date
                    ? `Geplant · ${scheduleDateLabel(String(date))}`
                    : (
                        {
                          done: 'Abgeschlossen',
                          error: 'Fehlgeschlagen',
                          open: 'Offen',
                          in_progress: 'In Bearbeitung',
                          cancelled: 'Abgebrochen',
                          not_applicable: 'Nicht zutreffend',
                        } as Record<string, string>
                      )[task.status];
                  const Icon =
                    task.status === 'done'
                      ? CheckCircle2
                      : task.status === 'error'
                        ? CircleAlert
                        : Circle;
                  const row = (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-4 shrink-0',
                          task.status === 'done'
                            ? 'text-emerald-600'
                            : task.status === 'error'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        )}
                      />
                      <span className="flex-1 text-left">{task.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {label}
                      </span>
                    </>
                  );
                  if (task.status !== 'error')
                    return (
                      <Item
                        key={task.id}
                        role="group"
                        aria-label={`${task.title}: ${label}`}
                        className="flex-nowrap gap-2 rounded-none border-0 border-b border-border px-0 py-2.5 text-xs last:border-b-0"
                      >
                        {row}
                      </Item>
                    );
                  return (
                    <AccordionItem
                      key={task.id}
                      value={task.id}
                      className="border-border"
                    >
                      <AccordionTrigger
                        aria-label={`${task.title}: ${label}`}
                        className="gap-2 text-xs"
                      >
                        {row}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          {outcome?.message ||
                            'Bei der Automatisierung ist ein Fehler aufgetreten.'}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              {selected && (
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => {
                    setShowResults(false);
                    setTemplateId(undefined);
                  }}
                >
                  Template Hinzufügen
                </Button>
              )}
            </section>
          ) : (
            selected && (
              <section
                aria-label="Template auswählen"
                className="max-h-[75vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 text-card-foreground"
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
                {templateId ? (
                  <>
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
                        onApply={(runAutomation, choices) => {
                          setFadingEngagement(null);
                          setSynchronizing(false);
                          setShowResults(false);
                          setMockedRun(Boolean(preview.data?.mocked));
                          apply.mutate({
                            requestKey,
                            runAutomation,
                            choices,
                            target: selected,
                            templateId,
                            templateRevision: preview.data?.revision,
                            templateName: preview.data?.name ?? 'Template',
                            automationCount:
                              preview.data?.items.filter(
                                (item) =>
                                  item.sequence && item.integrationProvider
                              ).length ?? 0,
                          });
                        }}
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
            )
          )}
        </div>
      </div>
      <div
        data-state={fading ? 'fading' : 'visible'}
        className={cn(
          'relative flex h-11 shrink-0 items-center overflow-hidden rounded-full border border-border bg-card shadow-lg transition-[width,opacity,transform] duration-[450ms] ease-out motion-reduce:transition-none',
          fading
            ? 'pointer-events-none translate-y-1 opacity-0'
            : 'translate-y-0 opacity-100',
          running || hasVisibleRun ? 'w-80 max-w-[calc(100vw-2rem)]' : 'w-11'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={running || (!selected && !hasVisibleRun)}
          aria-label={
            hasVisibleRun ? 'Ausgeführte Aufgaben anzeigen' : 'Template wählen'
          }
          aria-busy={Boolean(templateId && preview.isPending)}
          aria-expanded={open && !running}
          onClick={() => {
            if (hasVisibleRun) {
              setFadingEngagement(null);
              void savedRun.refetch();
              setShowResults(true);
              setOpen((current) => (showResults ? !current : true));
            } else if (open) close();
            else setOpen(true);
          }}
        >
          {templateId && preview.isPending ? (
            <Spinner aria-hidden="true" aria-label={undefined} />
          ) : (
            <LayoutTemplate className="size-4" />
          )}
        </Button>
        {(running || hasVisibleRun) && (
          <TemplateAutomationProgress
            key={apply.variables?.requestKey ?? resultTarget?.engagementId}
            mocked={mockedRun}
            synchronizing={synchronizing}
            automating={apply.variables?.runAutomation !== false}
            completed={!running && !apply.isError}
            finishedCount={liveRun.data?.finishedIds.length ?? 0}
            activeCount={
              liveRun.data?.startedIds?.filter(
                (id) => !liveRun.data?.finishedIds.includes(id)
              ).length ?? 0
            }
            totalCount={
              apply.variables?.runAutomation
                ? apply.variables.automationCount
                : 0
            }
          />
        )}
        {(running || hasVisibleRun) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mr-1.5 shrink-0 rounded-full text-muted-foreground"
            disabled={running || !completedRun}
            aria-label="Ergebnisse anzeigen"
            aria-expanded={open && showResults && !running}
            onClick={() => {
              setFadingEngagement(null);
              void savedRun.refetch();
              setShowResults(true);
              setOpen((current) => (showResults ? !current : true));
            }}
          >
            <ChevronUp
              className={cn(
                'size-4 transition-transform duration-300 motion-reduce:transition-none',
                open && showResults && 'rotate-180'
              )}
            />
          </Button>
        )}
        {(running || hasVisibleRun) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mr-1.5 shrink-0 rounded-full text-muted-foreground"
            disabled={running}
            aria-label="Leiste schließen"
            onClick={dismissBar}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
