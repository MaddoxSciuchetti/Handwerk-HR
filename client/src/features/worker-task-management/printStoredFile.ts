import { printPdfBlob } from './printPdf';

export function printContent(title: string, content: HTMLElement) {
  const page = document.implementation.createHTMLDocument(title);
  const style = page.createElement('style');
  style.textContent =
    '@page { margin: 18mm; } body { font: 12pt Arial, sans-serif; color: black; } h1 { font-size: 18pt; } h2 { font-size: 14pt; } p, dd { white-space: pre-wrap; overflow-wrap: anywhere; } dt { font-weight: bold; margin-top: 12pt; } dd { margin: 4pt 0 12pt; } img { display: block; max-width: 100%; max-height: 250mm; object-fit: contain; }';
  page.head.append(style);
  page.body.append(page.importNode(content, true));
  return printPdfBlob(
    new Blob(['<!doctype html>', page.documentElement.outerHTML], {
      type: 'text/html',
    })
  );
}

export async function printStoredFile(
  url: string,
  name: string,
  mimeType?: string | null
) {
  // Fetching as a blob bypasses attachment headers without starting a download.
  const response = await fetch(url);
  if (!response.ok) throw new Error('Die Datei konnte nicht geladen werden.');
  const blob = await response.blob();
  const type = (mimeType || blob.type).split(';')[0].toLowerCase();
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    await printPdfBlob(new Blob([blob], { type: 'application/pdf' }));
    return;
  }
  if (
    type.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
  ) {
    const imageUrl = URL.createObjectURL(blob);
    try {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = name;
      await image.decode();
      await printContent(name, image);
    } finally {
      // The print frame has loaded its own image before printContent resolves.
      URL.revokeObjectURL(imageUrl);
    }
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
