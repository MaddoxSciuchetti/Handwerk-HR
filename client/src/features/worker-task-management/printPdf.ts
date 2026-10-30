export function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.title = 'Druckansicht';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

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
      URL.revokeObjectURL(url);
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

      window.setTimeout(() => {
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
      }, 300);
    };
    iframe.src = url;
  });
}
