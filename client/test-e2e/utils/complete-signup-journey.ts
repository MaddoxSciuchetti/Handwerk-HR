import { expect, type Page } from '@playwright/test';
import { waitForPostLoginUrl } from './wait-post-login-url';

export type CompleteSignupUser = {
  vorname: string;
  nachname: string;
  displayName: string;
  orgName: string;
  email: string;
  password: string;
  confirmpassword: string;
};

export async function completeSignupAndLogin(
  page: Page,
  testUser: CompleteSignupUser
): Promise<void> {
  await page.goto('/signup');
  await expect(page).toHaveURL(/\/signup$/);

  await page.getByLabel(/^Display Name$/i).fill(testUser.displayName);
  await page.getByLabel(/Email Address/i).fill(testUser.email);
  await page.getByLabel(/^Vorname$/i).fill(testUser.vorname);
  await page.getByLabel(/^Nachname$/i).fill(testUser.nachname);
  await page.getByLabel(/^Password$/i).fill(testUser.password);
  await page.getByLabel(/Confirm Password/i).fill(testUser.confirmpassword);
  await page.getByRole('button', { name: /^Continue$/i }).click();

  await page.getByLabel(/^Company Name$/i).fill(testUser.orgName);
  await page.getByRole('button', { name: /Create Account/i }).click();

  await page.waitForURL('**/login');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel(/Email Address/i).fill(testUser.email);
  await page.getByLabel(/^Password$/i).fill(testUser.password);
  await page.getByRole('button', { name: /^Login$/i }).click();

  await waitForPostLoginUrl(page);
}
