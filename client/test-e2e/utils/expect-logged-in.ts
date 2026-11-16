import { expect, type Page } from '@playwright/test';

/** After login the greeting is "Hallo, {firstName}" (not a bare first-name node). */
export async function expectLoggedInAs(
  page: Page,
  firstName: string
): Promise<void> {
  await expect(
    page.getByText(new RegExp(`^Hallo,\\s*${escapeForRegex(firstName)}$`))
  ).toBeVisible({ timeout: 30_000 });
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
