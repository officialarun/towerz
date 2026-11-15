import { test, expect } from '@playwright/test';
for (const viewport of [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
]) {
  test(`mobile layout keeps units and controls apart at ${viewport.width}×${viewport.height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (type === 'webgl' || type === 'webgl2') return null;
        return original.apply(this, [type, ...args] as Parameters<typeof original>);
      } as typeof original;
    });
    await page.goto('/');
    await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
    await expect(page.locator('.compatibility-canvas>svg')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
    await expect(page.locator('.plan-content')).toHaveAttribute('transform', /scale\(1\.2\)/);
    await page.getByRole('button', { name: 'Zoom in floor plan', exact: true }).click();
    await page.getByRole('button', { name: 'Reset floor plan', exact: true }).click();
    await expect(page.locator('.plan-content')).toHaveAttribute('transform', /scale\(1\.2\)/);
    await page.locator('.floor-tabs').getByRole('button', { name: '1F', exact: true }).click();
    await page.locator('[data-unit="S2-05"]').click();
    await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
    await expect(page.locator('.compatibility-canvas>svg')).toBeVisible();
    const layout = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY };
      };
      return {
        width: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        panel: bounds('.selected-panel'),
        floors: bounds('.floor-navigation'),
        view: bounds('.view-switch'),
        stage: bounds('.scene-area'),
        toolbar: bounds('.camera-toolbar'),
        controls: [...document.querySelectorAll('.scene-area .model-control')].map((b) => {
          const r = b.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top + scrollY,
            bottom: r.bottom + scrollY,
            width: r.width,
            height: r.height,
          };
        }),
        actions: [...document.querySelectorAll<HTMLButtonElement>('.unit-actions button')].map(
          (b) => ({
            visible: b.clientWidth,
            content: b.scrollWidth,
            height: b.getBoundingClientRect().height,
            ...bounds(
              `.unit-actions button:nth-child(${[...b.parentElement!.children].indexOf(b) + 1})`,
            ),
          }),
        ),
      };
    });
    expect(layout.pageWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.view.bottom).toBeLessThanOrEqual(layout.floors.top);
    expect(layout.floors.bottom).toBeLessThanOrEqual(layout.stage.top);
    expect(layout.stage.bottom).toBeLessThanOrEqual(layout.panel.top);
    expect(layout.toolbar.top).toBeGreaterThanOrEqual(layout.stage.top);
    expect(layout.toolbar.bottom).toBeLessThanOrEqual(layout.stage.bottom);
    expect(layout.toolbar.bottom).toBeLessThanOrEqual(layout.panel.top);
    expect(layout.controls).toHaveLength(6);
    for (const control of layout.controls) {
      expect(control.left).toBeGreaterThanOrEqual(layout.stage.left);
      expect(control.right).toBeLessThanOrEqual(layout.stage.right);
      expect(control.top).toBeGreaterThanOrEqual(layout.stage.top);
      expect(control.bottom).toBeLessThanOrEqual(layout.stage.bottom);
      expect(control.width).toBeGreaterThanOrEqual(36);
      expect(control.height).toBeGreaterThanOrEqual(36);
    }
    for (const button of layout.actions) {
      expect(button.left).toBeGreaterThanOrEqual(layout.panel.left);
      expect(button.right).toBeLessThanOrEqual(layout.panel.right);
      expect(button.content).toBeLessThanOrEqual(button.visible);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Enquire about this space', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveCSS('font-size', '20.8px');
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Explore interior', exact: true }).click();
    await expect(
      page.locator('.interior-banner').getByRole('button', { name: 'Exit interior', exact: true }),
    ).toBeInViewport();
    await page
      .locator('.interior-banner')
      .getByRole('button', { name: 'Exit interior', exact: true })
      .click();
    await page.locator('.scene-area').scrollIntoViewIfNeeded();
    await expect(page.locator('.camera-toolbar button')).toHaveCount(5);
    await expect(page.getByRole('button', { name: /full.?screen/i })).toHaveCount(0);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Front view', exact: true })).toBeInViewport();
    await page.getByRole('button', { name: 'Front view', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Front view', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Close controls', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Model controls' })).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  });
}
