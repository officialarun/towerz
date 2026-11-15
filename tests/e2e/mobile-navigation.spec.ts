import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`app navigation stays visible and opens every destination at ${viewport.width}×${viewport.height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
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
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(page.getByRole('button', { name: /open menu|close menu/i })).toHaveCount(0);
    await expect(navigation.getByRole('link')).toHaveCount(6);
    for (const [name, route] of [
      ['Explore 3D', '/explore'],
      ['Floor Plans', '/floor-plans'],
      ['Shops', '/shops'],
      ['Amenities', '/amenities'],
      ['Location', '/location'],
      ['Home', '/'],
    ]) {
      const link = navigation.getByRole('link', { name, exact: true });
      await link.click();
      await expect.poll(() => new URL(page.url()).pathname.replace(/\/$/, '') || '/').toBe(route);
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(navigation).toBeInViewport({ ratio: 1 });
    }
    const layout = await navigation.evaluate((nav) => {
      const rect = nav.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        width: rect.width,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        targets: [...nav.querySelectorAll('a')].map((link) => ({
          width: link.getBoundingClientRect().width,
          height: link.getBoundingClientRect().height,
        })),
      };
    });
    expect(layout.bottom).toBeCloseTo(layout.viewportHeight, 0);
    expect(layout.width).toBeCloseTo(layout.viewportWidth, 0);
    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
    for (const target of layout.targets) {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Final Look', exact: true }).click();
    const final = page.locator('.final-look');
    await expect(final).toBeVisible();
    const actionsClearNavigation = await final
      .locator('.final-look-actions')
      .evaluate((actions) => {
        const navigation = document.querySelector('.app-navigation')!.getBoundingClientRect();
        return actions.getBoundingClientRect().bottom <= navigation.top;
      });
    expect(actionsClearNavigation).toBe(true);
    await page.goto('/shops/G-01/');
    await expect(navigation.getByRole('link', { name: 'Shops', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await context.close();
  });
}
