import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) {
  test(`construction, proposal, context and four-level selection (${mobile ? 'mobile SVG' : 'desktop WebGL'})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (mobile) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          ...args: unknown[]
        ) {
          if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
          return original.apply(this, [type, ...args] as Parameters<typeof original>);
        } as typeof original;
      });
    }
    await page.goto('/explore');
    await expect(
      page.getByRole('button', { name: 'Structural Frame View', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(mobile ? '.compatibility-canvas>svg' : 'canvas')).toBeVisible();
    await expect(page.getByText('Preparing your perspective')).toBeHidden();
    await page.locator('[data-unit-marker="G-01"]').click();
    await expect(page.getByRole('complementary', { name: 'Details for shop G-01' })).toBeVisible();
    await page.getByRole('button', { name: 'Close unit details' }).click();
    const proposed = page.getByRole('button', {
      name: 'Proposed Finished Plaza View',
      exact: true,
    });
    await proposed.click();
    await expect(proposed).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Context', exact: true }).click();
    for (const name of ['Show Roads', 'Show Landmarks', 'Show Checkpoints', 'Show Unit Labels']) {
      const button = page.getByRole('button', { name, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByRole('button', { name: 'Context', exact: true }).click();
    await page.getByRole('button', { name: 'First Floor', exact: true }).click();
    await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
    await page.locator('[data-unit="S2-05"]').click();
    await expect(page.getByRole('complementary', { name: 'Details for shop S2-05' })).toBeVisible();
    await expect(page.locator('.unit-demo')).toContainText('Dimensions and status unverified');
    await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
    await page.getByRole('button', { name: 'Enquire about this space', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Structural Frame View', exact: true }).click();
    await expect(page.locator('.selected-panel')).toContainText('S2-05');
    await expect(page.locator('.floor-pills button[aria-label="First Floor"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'All floors', exact: true }).click();
    await page.getByRole('button', { name: 'Opposite side context', exact: true }).click();
    await expect(page.locator('[data-site-marker="police-station"]')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('location uses the provided landmark and address-based directions', async ({ page }) => {
  await page.goto('/location');
  await expect(
    page
      .getByText(/Opposite Inayat Nagar Police Station, Faizabad, Ayodhya, Uttar Pradesh/)
      .first(),
  ).toBeVisible();
  const link = page.locator('a[href*="google.com/maps/dir/"]').first();
  await expect(link).toBeVisible();
  expect(new URL((await link.getAttribute('href'))!).searchParams.get('destination')).toContain(
    'Inayat Nagar Police Station',
  );
  await expect(page.getByRole('region', { name: 'Approximate site orientation' })).toBeVisible();
});
