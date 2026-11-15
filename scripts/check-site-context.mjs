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
const page = await browser.newPage({ viewport: { width: 1512, height: 945 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const target = process.env.PLAZA_PREVIEW_URL || 'http://localhost:3001';
for (const mobile of [false, true]) {
  if (mobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return ['webgl', 'webgl2'].includes(type) ? null : get.apply(this, [type, ...args]);
      };
    });
  }
  for (const route of ['/', '/explore']) {
    await page.goto(target + route, { waitUntil: 'networkidle', timeout: 120000 });
    if (route === '/')
      await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
    await page.waitForTimeout(1600);
    const suffix = (mobile ? 'mobile' : 'desktop') + (route === '/' ? '-home' : '-explore');
    await page.screenshot({ path: `/tmp/site-${suffix}.png`, fullPage: mobile });
    console.log(
      JSON.stringify({
        suffix,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        ),
        canvas: await page.locator('canvas').count(),
        svg: await page.locator('.compatibility-canvas>svg').count(),
      }),
    );
    if (route === '/explore') {
      await page.getByRole('button', { name: 'Proposed Finished Plaza View', exact: true }).click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/site-${suffix}-proposed.png`, fullPage: mobile });
      await page.getByRole('button', { name: 'Controls', exact: true }).click();
      await page.screenshot({ path: `/tmp/site-${suffix}-controls.png`, fullPage: mobile });
      await page.getByRole('button', { name: 'Close controls', exact: true }).click();
      await page.getByRole('button', { name: 'Opposite side context', exact: true }).click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/site-${suffix}-opposite.png`, fullPage: mobile });
    }
  }
}
console.log(JSON.stringify({ errors }));
await browser.close();
