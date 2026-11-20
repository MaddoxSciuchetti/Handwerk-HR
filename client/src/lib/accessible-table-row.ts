import type { KeyboardEvent } from 'react';

/**
 * Activate a focusable clickable table row on Enter/Space when the row itself
 * is focused (not when a nested control handled the key).
 */
export function activateTableRowOnKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  activate: () => void
) {
  if (event.target !== event.currentTarget) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  activate();
}
