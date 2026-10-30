import { afterEach, expect, it, vi } from 'vitest';
import { printHtml, printPdfBlob } from '@/features/worker-task-management/printPdf';

const originalCreateElement = document.createElement.bind(document);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function mockFrame(options?: { contentWindow?: object | null }) {
  const print = vi.fn();
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName !== 'iframe') return element;
    Object.defineProperty(element, 'contentWindow', {
      configurable: true,
      value:
        options && 'contentWindow' in options
          ? options.contentWindow
          : {
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
    Object.defineProperty(element, 'srcdoc', {
      configurable: true,
      set: () => {
        queueMicrotask(() => element.onload?.(new Event('load')));
      },
      get: () => '',
    });
    return element;
  });
  return print;
}

it('resolves after opening the print dialog without waiting for afterprint', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const print = mockFrame();

  let settled = false;
  const pending = printPdfBlob(new Blob(['%PDF'], { type: 'application/pdf' })).then(
    () => {
      settled = true;
    }
  );

  await vi.advanceTimersByTimeAsync(99);
  expect(print).not.toHaveBeenCalled();
  expect(settled).toBe(false);

  await vi.advanceTimersByTimeAsync(1);
  await pending;
  expect(print).toHaveBeenCalledOnce();
  expect(settled).toBe(true);
  expect(document.body.querySelector('iframe')).not.toBeNull();
});

it('prints HTML through srcdoc without the PDF settle delay', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  const print = mockFrame();
  await printHtml('<!doctype html><html><body>Hallo</body></html>');
  expect(print).toHaveBeenCalledOnce();
});
