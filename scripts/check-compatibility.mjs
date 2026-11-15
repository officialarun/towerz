import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 1512, height: 945 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 120000 });
await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
const svg = page.locator('.compatibility-canvas>svg');
await expect(svg).toBeVisible();
await expect(page.locator('.hero-copy')).toHaveCount(1);
await expect(page.locator('.scene-area img')).toHaveCount(0);
const initial = await svg.innerHTML();
await page.mouse.move(850, 500);
await page.mouse.down();
await page.mouse.move(960, 530, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(350);
const rotated = await svg.innerHTML();
if (initial === rotated) throw new Error('Rotation did not update the software-rendered geometry.');
await page.getByRole('button', { name: '3D model', exact: true }).last().click();
await page.waitForTimeout(1300);
let picked = null;
for (const [x, y] of [
  [1000, 690],
  [1040, 620],
  [1000, 520],
  [900, 460],
]) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  const panel = page.locator('.selected-panel');
  if (await panel.count()) {
    picked = await panel.getAttribute('aria-label');
    break;
  }
}
if (!picked) throw new Error('Could not select a compatibility-model storefront.');
await page.screenshot({ path: '/tmp/plaza-compatibility-desktop.png' });
await page.getByRole('button', { name: 'Controls', exact: true }).click();
await page.getByRole('button', { name: 'Hide roof', exact: true }).click();
await page.getByRole('button', { name: 'Top view', exact: true }).click();
await page.getByRole('button', { name: 'Close controls', exact: true }).click();
await page.waitForTimeout(1300);
await page.screenshot({ path: '/tmp/plaza-compatibility-cutaway.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
await expect(svg).toBeVisible();
await page.screenshot({ path: '/tmp/plaza-compatibility-mobile.png' });
console.log(
  JSON.stringify({
    renderer: 'SVG without WebGL',
    paths: await svg.locator('path').count(),
    rotationChanged: true,
    picked,
    errors,
  }),
);
await browser.close();
if (errors.length) process.exitCode = 1;
