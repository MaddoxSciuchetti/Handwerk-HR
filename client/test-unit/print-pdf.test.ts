import { afterEach, expect, it, vi } from 'vitest';
import { printPdfBlob } from '@/features/worker-task-management/printPdf';

const originalCreateElement = document.createElement.bind(document);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

it('resolves after opening the print dialog without waiting for afterprint', async () => {
  vi.useFakeTimers();
  const print = vi.fn();
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName !== 'iframe') return element;
    Object.defineProperty(element, 'contentWindow', {
      configurable: true,
      value: {
        focus: vi.fn(),
        print,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    Object.defineProperty(element, 'src', {
      configurable: true,
      set: () => {
        queueMicrotask(() => element.onload?.(new Event('load')));
      },
      get: () => '',
    });
    return element;
  });

  let settled = false;
  const pending = printPdfBlob(new Blob(['%PDF'], { type: 'application/pdf' })).then(
    () => {
      settled = true;
    }
  );

  await vi.advanceTimersByTimeAsync(299);
  expect(print).not.toHaveBeenCalled();
  expect(settled).toBe(false);

  await vi.advanceTimersByTimeAsync(1);
  await pending;
  expect(print).toHaveBeenCalledOnce();
  expect(settled).toBe(true);
  expect(document.body.querySelector('iframe')).not.toBeNull();
});
