import { API_URL } from '@/config/env';

export function DocumentFontStyles() {
  const base = API_URL.replace(/\/$/, '');
  const families = {
    Calibri: 'Calibri',
    Arial: 'Arial',
    Helvetica: 'Helvetica',
    'Times New Roman': 'TimesNewRoman',
  };
  const variants = [
    ['', 400, 'normal'],
    ['-Bold', 700, 'normal'],
    ['-Italic', 400, 'italic'],
    ['-BoldItalic', 700, 'italic'],
  ];
  const symbols = {
    Symbol: 'Symbol',
    'Apple Symbols': 'AppleSymbols',
    Wingdings: 'Wingdings',
  };
  return (
    <style>
      {Object.entries(symbols)
        .map(
          ([family, file]) =>
            `@font-face{font-family:"${family}";font-weight:400;font-style:normal;font-display:swap;src:url("${base}/document-fonts/${file}.ttf") format("truetype")}`
        )
        .join('') +
        Object.entries(families)
          .flatMap(([family, file]) =>
            variants.map(
              ([suffix, weight, style]) =>
                `@font-face{font-family:"${family}";font-weight:${weight};font-style:${style};font-display:swap;src:url("${base}/document-fonts/${file}${suffix}.ttf") format("truetype")}`
            )
          )
          .join('')}
    </style>
  );
}
