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
      window.setTimeout(() => {
        frameWindow.focus();
        frameWindow.print();
        window.setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(url);
        }, 60_000);
        resolve();
      }, 300);
    };
    iframe.src = url;
  });
}
