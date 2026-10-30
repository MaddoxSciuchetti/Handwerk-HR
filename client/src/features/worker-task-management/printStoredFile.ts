import { printHtml, printPdfBlob } from './printPdf';

const PRINT_PAGE_STYLE =
  '@page { margin: 18mm; } body { font: 12pt Arial, sans-serif; color: black; } h1 { font-size: 18pt; } h2 { font-size: 14pt; } p, dd { white-space: pre-wrap; overflow-wrap: anywhere; } dt { font-weight: bold; margin-top: 12pt; } dd { margin: 4pt 0 12pt; } img { display: block; max-width: 100%; max-height: 250mm; object-fit: contain; }';

const blobCache = new Map<string, Promise<Blob>>();

async function loadBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Die Datei konnte nicht geladen werden.');
  return response.blob();
}

/** Warm the in-memory blob cache so print can open without waiting on the network. */
export function prefetchStoredFile(url: string) {
  let pending = blobCache.get(url);
  if (!pending) {
    pending = loadBlob(url).catch((error) => {
      blobCache.delete(url);
      throw error;
    });
    blobCache.set(url, pending);
  }
  return pending;
}

export function clearStoredFilePrintCache() {
  blobCache.clear();
}

export function printContent(title: string, content: HTMLElement) {
  const page = document.implementation.createHTMLDocument(title);
  const style = page.createElement('style');
  style.textContent = PRINT_PAGE_STYLE;
  page.head.append(style);
  page.body.append(page.importNode(content, true));
  return printHtml(`<!doctype html>${page.documentElement.outerHTML}`);
}

export async function printStoredFile(
  url: string,
  name: string,
  mimeType?: string | null
) {
  // Fetching as a blob bypasses attachment headers without starting a download.
  const blob = await prefetchStoredFile(url);
  const type = (mimeType || blob.type).split(';')[0].toLowerCase();
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    await printPdfBlob(
      blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' })
    );
    return;
  }
  if (
    type.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
  ) {
    const imageUrl = URL.createObjectURL(blob);
    await printHtml(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title><style>${PRINT_PAGE_STYLE}</style></head><body><img src="${imageUrl}" alt="${escapeHtml(name)}"></body></html>`,
      [imageUrl]
    );
    return;
  }
  if (type === 'text/plain' || /\.txt$/i.test(name)) {
    const text = document.createElement('p');
    text.textContent = await blob.text();
    await printContent(name, text);
    return;
  }
  throw new Error(
    'Dieser Dateityp kann nicht direkt gedruckt werden. Bitte verwenden Sie eine PDF- oder Bilddatei.'
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
