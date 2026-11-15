import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) {
  test(`final look connects the image, four connected levels and a saved 3D perspective (${mobile ? 'mobile SVG' : 'desktop WebGL'})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
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
    await page.goto('/');
    const final = page.locator('.final-look');
    const renderer = page.locator(mobile ? '.compatibility-canvas>svg' : 'canvas');
    await expect(page.locator('.explorer')).toHaveClass(/view-3d/);
    await expect(final).toHaveCount(0);
    await expect(renderer).toBeVisible();
    await page.getByRole('button', { name: 'Final Look', exact: true }).click();
    await expect(final).toBeVisible();
    await expect(final.locator('img')).toHaveJSProperty('complete', true);
    await expect
      .poll(() => final.locator('img').evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(renderer).toBeHidden();
    await expect(page.getByRole('button', { name: 'Rotate', exact: true })).toHaveCount(0);
    await final.getByRole('button', { name: 'Zoom in final image', exact: true }).click();
    await expect(final.locator('output')).toHaveText('125%');
    await final.getByRole('button', { name: 'Reset final image', exact: true }).click();
    await expect(final.locator('output')).toHaveText('100%');
    await expect(final).toContainText('Artist’s impression');
    await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
    await expect(renderer).toBeVisible();
    const levels = page.locator('.floor-pills');
    for (const name of ['Semi-basement', 'Ground Floor', 'First Floor', 'Second Floor'])
      await expect(levels.getByRole('button', { name, exact: true })).toBeVisible();
    await page.locator('[data-unit-marker="G-01"]').click();
    await expect(page.locator('.selected-panel')).toContainText('Semi-basement');
    await page.getByRole('button', { name: 'Proposed Finished Plaza View', exact: true }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const labels = page.locator('.scene-labels');
    await expect
      .poll(async () => Number(await labels.getAttribute('data-label-zoom')))
      .toBeGreaterThan(1.05);
    await page.waitForTimeout(700);
    const zoom = Number(await labels.getAttribute('data-label-zoom'));
    // A persistent renderer retains manual zoom and shop selection across the image view.
    await renderer.evaluate((element) => element.setAttribute('data-same-renderer', 'yes'));
    await page.getByRole('button', { name: 'Final Look', exact: true }).click();
    await expect(final).toBeVisible();
    await expect(renderer).toBeHidden();
    await expect(final).toContainText('Selected: G-01 · Semi-basement');
    await expect(page.getByRole('button', { name: 'Controls', exact: true })).toHaveCount(0);
    await final.getByRole('button', { name: 'Enquire about this space', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('G-01');
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await final.getByRole('button', { name: 'Back to my space in 3D', exact: true }).click();
    await expect(renderer).toBeVisible();
    await expect(renderer).toHaveAttribute('data-same-renderer', 'yes');
    await expect(page.locator('.selected-panel')).toContainText('G-01');
    await expect(
      page.getByRole('button', { name: 'Proposed Finished Plaza View', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () => Number(await labels.getAttribute('data-label-zoom')))
      .toBeCloseTo(zoom, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
