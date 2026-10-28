import { expect, test, type Page } from '@playwright/test';

async function geometry(page: Page) {
  return page.locator('table').evaluate((table) =>
    Array.from(table.querySelectorAll('th, tbody tr:nth-child(-n+2) td')).map(
      (cell) => {
        const { x, y, width, height } = cell.getBoundingClientRect();
        return { x, y, width, height };
      }
    )
  );
}

for (const width of [1100, 800]) {
  for (const team of [false, true]) {
    test(`keeps columns and rows stable at ${width}px with ${team ? 'three' : 'five'} columns`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(
        `/test-e2e/fixtures/worker-table-layout.html${team ? '?team' : ''}`
      );
      const trigger = page.getByRole('button', {
        name: 'Typ für Alexandra Example ändern',
      });
      await expect(trigger).toHaveText('Team');
      await page.evaluate(() => document.fonts.ready);
      const before = await geometry(page);
      for (const label of ['Offboarding', 'Team']) {
        await trigger.click();
        expect(await geometry(page)).toEqual(before);
        await page
          .getByRole('menuitemradio', { name: label, exact: true })
          .click();
        await expect(trigger).toHaveAttribute('aria-busy', 'true');
        expect(await geometry(page)).toEqual(before);
        await page.getByRole('button', { name: 'Finish save' }).click();
        await expect(trigger).toHaveAttribute('aria-busy', 'false');
        expect(await geometry(page)).toEqual(before);
      }
    });
  }
}
