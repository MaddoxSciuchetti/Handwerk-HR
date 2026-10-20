import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { forgetQuestionnaireDraft } from '@/features/questionnaire/questionnairePreview';
import { saveQuestionnaireTemplate } from './questionnaireTemplate.api';
import type { TemplateItem } from './questionnaireTemplate.types';

type Snapshot = { name: string; items: TemplateItem[] };

export const templateKey = ['automation', 'questionnaire'] as const;

export function useQuestionnaireAutosave(
  initial: Snapshot | null,
  current: Snapshot | null
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'saved' | 'pending' | 'error'>('saved');
  const saved = useRef<string | null>(null);
  const latest = useRef(current);
  latest.current = current;
  const queued = useRef<Snapshot | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialJson = initial ? JSON.stringify(initial) : null;
  const currentJson = current ? JSON.stringify(current) : null;

  // One request at a time; changes made during a save replace the queued snapshot.
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (running.current) return;
    running.current = true;
    try {
      while (queued.current) {
        const next = queued.current;
        queued.current = null;
        const json = JSON.stringify(next);
        if (json === saved.current) continue;
        try {
          const result = await saveQuestionnaireTemplate(next.items, next.name);
          saved.current = json;
          queryClient.setQueryData(templateKey, result);
          if (JSON.stringify(latest.current) === json) {
            forgetQuestionnaireDraft();
          }
        } catch {
          if (mounted.current) setStatus('error');
          toast.error('Fragebogen konnte nicht gespeichert werden');
          // A newer edit can still be saved; otherwise wait for an edit or retry.
          if (!queued.current) return;
        }
      }
      if (mounted.current) setStatus('saved');
    } finally {
      running.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    if (saved.current === null && initialJson) saved.current = initialJson;
    clearTimeout(timer.current);
    const next = latest.current;
    if (!next || !next.name) {
      queued.current = null;
      return;
    }
    if (currentJson === saved.current && !running.current) {
      queued.current = null;
      setStatus('saved');
      return;
    }
    queued.current = next;
    setStatus('pending');
    timer.current = setTimeout(() => void flush(), 500);
  }, [initialJson, currentJson, flush]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void flush();
    };
  }, [flush]);

  const saveNow = () => {
    if (!latest.current?.name) return;
    queued.current = latest.current;
    setStatus('pending');
    void flush();
  };

  return { status, saveNow };
}
