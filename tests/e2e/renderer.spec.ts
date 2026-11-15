import { test, expect } from '@playwright/test';
test('WebGL-disabled browsers get interactive 3D without a duplicate hero', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  const svg = page.locator('.compatibility-canvas>svg');
  await expect(svg).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.hero-copy')).toHaveCount(1);
  await expect(page.locator('.scene-area img')).toHaveCount(0);
  await expect.poll(() => svg.locator('path').count()).toBeGreaterThan(100);
  const before = await svg.innerHTML();
  await page.mouse.move(850, 490);
  await page.mouse.down();
  await page.mouse.move(965, 520, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => svg.innerHTML()).not.toBe(before);
  await page.getByRole('button', { name: 'Ground Floor', exact: true }).click();
  await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
  await page.locator('[data-unit="S1-01"]').click();
  await expect(page.getByRole('complementary', { name: 'Details for shop S1-01' })).toBeVisible();
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await expect(svg).toBeVisible();
  await page.getByRole('button', { name: 'Explore interior', exact: true }).click();
  await expect(page.getByText('Simplified modeled interior · S1-01')).toBeVisible();
  await page.getByRole('button', { name: 'Exit interior', exact: true }).last().click();
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Explode floors', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assemble floors' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore roof', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hide roof', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('a lost WebGL context switches to the compatibility renderer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  // A canvas element exists before its WebGL context and recovery listener are initialized.
  await expect(page.getByText('Preparing your perspective')).toBeHidden();
  await canvas.evaluate((element) =>
    element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
  );
  await expect(page.locator('.compatibility-canvas>svg')).toBeVisible();
  await expect(page.locator('.hero-copy')).toHaveCount(1);
  await expect(page.locator('.scene-area img')).toHaveCount(0);
});
