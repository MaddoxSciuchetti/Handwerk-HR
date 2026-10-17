export function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.title = 'Arbeitsvertrag';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  return new Promise<void>((resolve, reject) => {
    const fail = window.setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
      reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
    }, 10000);

    iframe.onload = () => {
      window.clearTimeout(fail);
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        iframe.remove();
        URL.revokeObjectURL(url);
        reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        frameWindow.removeEventListener('afterprint', finish);
        window.removeEventListener('afterprint', finish);
        iframe.remove();
        URL.revokeObjectURL(url);
        resolve();
      };

      frameWindow.addEventListener('afterprint', finish);
      window.addEventListener('afterprint', finish);
      window.setTimeout(() => {
        try {
          frameWindow.focus();
          frameWindow.print();
        } catch {
          if (settled) return;
          settled = true;
          frameWindow.removeEventListener('afterprint', finish);
          window.removeEventListener('afterprint', finish);
          iframe.remove();
          URL.revokeObjectURL(url);
          reject(new Error('Der Druckdialog konnte nicht geöffnet werden.'));
        }
      }, 300);
    };
    iframe.src = url;
  });
}
