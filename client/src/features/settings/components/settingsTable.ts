export const settingsTableClassName =
  'border-separate border-spacing-x-0 border-spacing-y-1 [&_thead_th]:h-16 [&_thead_th]:border-b [&_thead_th]:border-border';

export const alignedSettingsTableClassName = `${settingsTableClassName} table-fixed`;

export const settingsTableBodyClassName =
  '[&_tr]:border-0 [&_tr]:hover:bg-transparent [&_td]:px-2 [&_td]:py-4 [&_td:first-child]:rounded-l-2xl [&_td:first-child]:pl-10 [&_td:last-child]:rounded-r-2xl [&_tr:hover_td]:bg-muted/50';

// Shared spacing keeps section headings, actions and table headers aligned.
export const settingsTableCardClassName =
  'mx-0 mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 self-stretch border border-border py-0 shadow-none ring-0';
