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

test('keeps the header bar stuck to the top of the table viewport while scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 720 });
  await page.goto('/test-e2e/fixtures/worker-table-layout.html');
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.getByTestId('viewport');
  const headerTopBefore = await page
    .locator('th')
    .first()
    .evaluate((header) => {
      return header.getBoundingClientRect().top;
    });
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
    node.dispatchEvent(new Event('scroll'));
  });
  const headerTopAfter = await page
    .locator('th')
    .first()
    .evaluate((header) => {
      return header.getBoundingClientRect().top;
    });
  expect(headerTopAfter).toBe(headerTopBefore);
  expect(await viewport.evaluate((node) => node.scrollTop > 0)).toBe(true);
  await expect(viewport).toHaveAttribute('data-scrolled', '');
});

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
      for (const label of ['Onboarding', 'Team', 'Offboarding', 'Team']) {
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

for (const team of [false, true]) {
  test(`adds an accessible anniversary column in ${team ? 'Team' : 'normal'} view`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
    await page.setViewportSize({ width: 700, height: 720 });
    await page.goto(
      `/test-e2e/fixtures/worker-table-layout.html${team ? '?team' : ''}`
    );
    const add = page.getByRole('button', { name: 'Add column' });
    await expect(add).toHaveCSS('opacity', '0');
    await add.hover();
    await expect(add).toHaveCSS('opacity', '1');
    await page.mouse.move(0, 0);
    await add.focus();
    await expect(add).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    await expect(page.locator('button[aria-label="Add column"]')).toHaveCSS(
      'opacity',
      '1'
    );
    await page.getByRole('menuitem', { name: 'Anniversary date' }).click();
    await expect(add).toHaveCount(0);
    const anniversary = page.getByRole('columnheader', { name: 'Anniversary' });
    await expect(anniversary).toHaveCount(1);
    await expect(
      page.locator('tbody tr').first().locator('td').last()
    ).toHaveText('12.11.2027');
    await expect(
      page.locator('tbody tr').nth(1).locator('td').last()
    ).toHaveText('04.03.2027');
    const count = team ? 4 : 6;
    await expect(page.getByRole('columnheader')).toHaveCount(count);
    await expect(page.locator('tbody tr').first().locator('td')).toHaveCount(
      count
    );
    const viewport = page.getByTestId('viewport');
    const top = await anniversary.evaluate(
      (el) => el.getBoundingClientRect().top
    );
    await viewport.evaluate((el) => {
      el.scrollTop = 200;
      el.scrollLeft = el.scrollWidth;
    });
    await expect
      .poll(() => anniversary.evaluate((el) => el.getBoundingClientRect().top))
      .toBe(top);
    expect(await viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const headers = await page.locator('th').evaluateAll((cells) =>
      cells.map((el) => ({
        x: el.getBoundingClientRect().x,
        width: el.getBoundingClientRect().width,
      }))
    );
    const cells = await page
      .locator('tbody tr')
      .nth(5)
      .locator('td')
      .evaluateAll((cells) =>
        cells.map((el) => ({
          x: el.getBoundingClientRect().x,
          width: el.getBoundingClientRect().width,
        }))
      );
    expect(cells).toEqual(headers);
    await page.screenshot({
      path: `/tmp/worker-anniversary-${team ? 'team' : 'normal'}.png`,
    });
    await page.reload();
    await expect(
      page.getByRole('columnheader', { name: 'Anniversary' })
    ).toHaveCount(0);
  });
}

test.describe('touch column control', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 700, height: 720 },
  });
  test('keeps the add button visible without hovering', async ({ page }) => {
    await page.goto('/test-e2e/fixtures/worker-table-layout.html?team');
    const add = page.getByRole('button', { name: 'Add column' });
    await expect(add).toHaveCSS('opacity', '1');
    await add.tap();
    await page.getByRole('menuitem', { name: 'Anniversary date' }).tap();
    await expect(
      page.getByRole('columnheader', { name: 'Anniversary' })
    ).toHaveCount(1);
  });
});
