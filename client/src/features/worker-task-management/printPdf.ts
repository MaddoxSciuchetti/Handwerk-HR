type PrintFrameOptions = {
  /** Extra wait after load before print(). PDFs need a short settle; HTML does not. */
  settleMs?: number;
  revokeUrls?: string[];
};

function createPrintFrame() {
  const iframe = document.createElement('iframe');
  iframe.title = 'Druckansicht';
  // Chrome's PDF viewer barely initializes in a 0×0 frame; keep real page size off-screen.
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '800px';
  iframe.style.height = '1100px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);
  return iframe;
}

function printInFrame(
  assignSource: (iframe: HTMLIFrameElement) => void,
  { settleMs = 0, revokeUrls = [] }: PrintFrameOptions = {}
) {
  const iframe = createPrintFrame();

  return new Promise<void>((resolve, reject) => {
    let removed = false;
    let frameWindow: Window | null = null;
    let releaseTimer = 0;

    const removeFrame = () => {
      if (removed) return;
      removed = true;
      window.clearTimeout(releaseTimer);
      frameWindow?.removeEventListener('afterprint', removeFrame);
      window.removeEventListener('afterprint', removeFrame);
      iframe.remove();
      for (const url of revokeUrls) URL.revokeObjectURL(url);
    };

    const fail = window.setTimeout(() => {
      removeFrame();
      reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
    }, 10000);

    iframe.onload = () => {
      window.clearTimeout(fail);
      frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        removeFrame();
        reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
        return;
      }

      const openPrint = () => {
        try {
          frameWindow?.focus();
          frameWindow?.print();
        } catch {
          removeFrame();
          reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
          return;
        }

        // Chrome's PDF viewer never fires `afterprint` for a blob iframe, so
        // the preview must not wait on it. Keep the frame until the dialog
        // closes; removing it now cancels the print.
        frameWindow?.addEventListener('afterprint', removeFrame);
        window.addEventListener('afterprint', removeFrame);
        releaseTimer = window.setTimeout(removeFrame, 60_000);
        resolve();
      };

      if (settleMs > 0) {
        window.setTimeout(openPrint, settleMs);
      } else {
        // Let layout paint once so images/styles in HTML frames are ready.
        requestAnimationFrame(() => openPrint());
      }
    };

    assignSource(iframe);
  });
}

export function printHtml(html: string, revokeUrls: string[] = []) {
  return printInFrame((iframe) => {
    iframe.srcdoc = html;
  }, { settleMs: 0, revokeUrls });
}

export function printPdfBlob(blob: Blob) {
  if (blob.type.startsWith('text/html')) {
    return blob.text().then((html) => printHtml(html));
  }
  const url = URL.createObjectURL(blob);
  return printInFrame((iframe) => {
    iframe.src = url;
  }, {
    // Off-screen real-size frame loads the viewer; a short settle still helps large PDFs.
    settleMs: 100,
    revokeUrls: [url],
  });
}
