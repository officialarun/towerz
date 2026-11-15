import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage({
  viewport: { width: 1512, height: 945 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 120000 });
await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
await page.waitForTimeout(5000);
await page.screenshot({ path: '/tmp/plaza-desktop.png', fullPage: false });
let picked = null;
for (const [x, y] of [
  [1000, 690],
  [1040, 620],
  [1000, 520],
  [900, 460],
]) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  const panel = page.locator('.selected-panel');
  if (await panel.count()) {
    picked = await panel.getAttribute('aria-label');
    break;
  }
}
await page.screenshot({ path: '/tmp/plaza-selected.png', fullPage: false });
console.log(
  JSON.stringify({
    title: await page.title(),
    canvas: await page.locator('canvas').count(),
    picked,
    errors,
  }),
);
if (await page.locator('.selected-panel').count())
  await page.getByRole('button', { name: 'Close unit details' }).click();
await page.goto('http://localhost:3001/explore', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Controls', exact: true }).click();
await page.getByRole('button', { name: 'Hide roof', exact: true }).click();
await page.getByRole('button', { name: 'Top view', exact: true }).click();
await page.getByRole('button', { name: 'Close controls', exact: true }).click();
await page.waitForTimeout(1600);
await page.screenshot({ path: '/tmp/plaza-cutaway.png', fullPage: false });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/plaza-mobile.png', fullPage: false });
await browser.close();
