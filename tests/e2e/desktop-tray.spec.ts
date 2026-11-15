import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1512, height: 945 },
]) {
  test(`desktop tray receives clicks below the presentation buttons at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    if (viewport.width !== 1366)
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
    for (const route of ['/', '/explore']) {
      await page.goto(route);
      if (route === '/')
        await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
      const labels = page.locator('.scene-labels');
      await expect
        .poll(async () => Number(await labels.getAttribute('data-label-zoom')))
        .toBeCloseTo(1, 1);
      const position = await page.evaluate(() => {
        const phase = document
          .querySelector('[aria-label="Building presentation"]')!
          .getBoundingClientRect();
        const tray = document.querySelector('.model-navigation')!.getBoundingClientRect();
        const primary = document.querySelector('.camera-toolbar')!.getBoundingClientRect();
        const host = document.querySelector('.explorer')!.getBoundingClientRect();
        const stage = document.querySelector('.scene-area')!.getBoundingClientRect();
        const viewerCenter =
          (Math.max(host.left, stage.left) + Math.min(host.right, stage.right)) / 2;
        return {
          centerDifference: Math.abs(viewerCenter - primary.left - primary.width / 2),
          gap: tray.top - phase.bottom,
          clickable: [...document.querySelectorAll('.model-navigation button')].map((button) => {
            const r = button.getBoundingClientRect();
            return (
              document
                .elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
                ?.closest('button') === button
            );
          }),
        };
      });
      expect(position.centerDifference).toBeLessThanOrEqual(1);
      expect(position.gap).toBeGreaterThanOrEqual(8);
      expect(position.gap).toBeLessThanOrEqual(20);
      expect(position.clickable).toEqual([true, true, true, true, true, true]);
      for (const button of await page.locator('.model-navigation button').all()) {
        await button.hover();
        const tooltip = await button.evaluate((element) => {
          const style = getComputedStyle(element, '::after');
          const bounds = element.getBoundingClientRect();
          const row = document.querySelector('.site-context-controls')!.getBoundingClientRect();
          return {
            visible: style.visibility,
            opacity: style.opacity,
            top: bounds.top + Number.parseFloat(style.top),
            buttonBottom: bounds.bottom,
            rowBottom: row.bottom,
          };
        });
        expect(tooltip.visible).toBe('visible');
        expect(tooltip.opacity).toBe('1');
        expect(tooltip.top).toBeGreaterThan(tooltip.buttonBottom);
        expect(tooltip.top).toBeGreaterThan(tooltip.rowBottom);
      }
      await page.getByRole('button', { name: 'Reset 3D model', exact: true }).focus();
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      const rotate = page.getByRole('button', { name: 'Rotate', exact: true });
      await expect(rotate).toBeFocused();
      expect(
        await rotate.evaluate((element) => getComputedStyle(element, '::after').visibility),
      ).toBe('visible');
      await page.getByRole('button', { name: 'Rotate', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      const zoom = () => labels.getAttribute('data-label-zoom').then(Number);
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await expect.poll(zoom).toBeGreaterThan(1.05);
      const closeZoom = await zoom();
      await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
      await expect.poll(zoom).toBeLessThan(closeZoom);
      await page.getByRole('button', { name: 'Opposite side context', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Opposite side context', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Reset 3D model', exact: true }).click();
      await expect.poll(zoom).toBeCloseTo(1, 1);
      await page.getByRole('button', { name: 'Controls', exact: true }).click();
      const menu = page.getByRole('dialog', { name: 'Model controls' });
      await expect(menu).toBeVisible();
      await expect(menu).toBeInViewport();
      await page.getByRole('button', { name: 'Architecture mode', exact: true }).click();
      await page.getByRole('button', { name: 'Leasing mode', exact: true }).click();
      await page.getByRole('button', { name: 'Close controls', exact: true }).click();
      await expect(menu).toHaveCount(0);
      await expect(page.getByRole('button', { name: /full.?screen/i })).toHaveCount(0);
      if (viewport.width === 1366 && route === '/') {
        await page.getByRole('button', { name: 'Opposite side context', exact: true }).hover();
        await test.info().attach('centered-desktop-tray', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      }
    }
  });
}
