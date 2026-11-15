import { test, expect } from '@playwright/test';

for (const mobileSVG of [false, true]) {
  test(`labels shrink and shed detail when zooming out (${mobileSVG ? 'mobile SVG' : 'desktop WebGL'})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (mobileSVG) {
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
    await expect(page.locator(mobileSVG ? '.compatibility-canvas>svg' : 'canvas')).toBeVisible();
    const labels = page.locator('.scene-labels');
    const ratio = async () => Number(await labels.getAttribute('data-label-zoom'));
    const marker = page.locator('[data-unit-marker="G-05"]');
    const scale = () => marker.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    await expect.poll(ratio).toBeCloseTo(1, 1);
    await expect(marker).toBeVisible();
    await page.locator('[data-unit-marker="G-01"]').click();
    await expect(page.getByRole('complementary', { name: 'Details for shop G-01' })).toBeVisible();
    await expect.poll(ratio).toBeCloseTo(1, 1);
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await expect.poll(ratio).toBeLessThan(0.95);
    await expect.poll(scale).toBeLessThan(0.95);
    for (let i = 0; i < 3; i++)
      await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await expect.poll(ratio).toBeLessThan(0.72);
    await expect(marker).toBeHidden();
    const selected = page.locator('[data-unit-label]');
    await expect(selected).toBeVisible();
    expect(
      await selected.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
    ).toBeLessThan(1);
    await expect(page.locator('[data-site-marker="ayodhya-raebareli-road"]')).toBeVisible();
    await test.info().attach('zoomed-out-labels', {
      body: await page.locator('.scene-area').screenshot(),
      contentType: 'image/png',
    });
    const stage = page.locator('.scene-viewport');
    await stage.hover({ position: { x: 30, y: 60 } });
    const beforeWheel = await ratio();
    await page.mouse.wheel(0, 400);
    await expect.poll(ratio).toBeLessThan(beforeWheel);
    await page.locator('.camera-toolbar .tool').first().click();
    await expect.poll(ratio).toBeCloseTo(1, 1);
    await expect(marker).toBeVisible();
    await expect.poll(scale).toBeCloseTo(1, 1);
    await page.getByRole('button', { name: 'Context', exact: true }).click();
    await page.getByRole('button', { name: 'Show Unit Labels', exact: true }).click();
    await expect(marker).toBeHidden();
    expect(errors).toEqual([]);
  });
}
