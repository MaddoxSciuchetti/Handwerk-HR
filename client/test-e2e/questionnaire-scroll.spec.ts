import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 600 },
]) {
  test(`questionnaire keeps focused fields visible and ends at the card at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route('**/fragebogen/scroll-regression', async (route) => {
      if (route.request().resourceType() === 'document')
        return route.continue();
      await route.fulfill({
        json: {
          success: true,
          data: {
            status: 'sent',
            questions: Array.from({ length: 40 }, (_, index) => ({
              key: `field-${index}`,
              label: `Angabe ${index}`,
              section: 'Persönliche Angaben',
              type: 'text',
            })),
          },
        },
      });
    });
    await page.goto('/fragebogen/scroll-regression');
    const first = page.getByRole('textbox', { name: 'Angabe 0', exact: true });
    await first.fill('Anna');
    for (let index = 1; index < 40; index++) {
      await page.keyboard.press('Tab');
      await page.keyboard.type(`Antwort ${index}`);
      const field = page.getByRole('textbox', {
        name: `Angabe ${index}`,
        exact: true,
      });
      await expect(field).toBeFocused();
      await expect(field).toBeInViewport({ ratio: 0.75 });
    }
    await page.getByRole('checkbox', { name: /./ }).check();
    const submit = page.getByRole('button', { name: 'Absenden', exact: true });
    await expect(submit).toBeEnabled();
    await submit.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const button = document.querySelector('button[type="submit"]')!;
          const bottom = button.getBoundingClientRect().bottom;
          return window.innerHeight - bottom;
        })
      )
      .toBeLessThan(100);
    await expect(submit).toBeInViewport({ ratio: 1 });
    // Keyboard navigation must scroll the document rather than a clipped inner panel.
    expect(
      await page.evaluate(() => document.scrollingElement!.scrollTop)
    ).toBeGreaterThan(0);
    expect(await page.locator('main').evaluate((main) => main.scrollTop)).toBe(
      0
    );
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height - 200,
    });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport({ ratio: 1 });
    await page.setViewportSize(viewport);
    await first.click();
    await expect(first).toHaveValue('Anna');
    await expect(first).toBeInViewport({ ratio: 1 });
  });
}
