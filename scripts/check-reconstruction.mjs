import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const directory = 'artifacts/reconstruction';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const base = process.env.PLAZA_PREVIEW_URL || 'http://localhost:3001';
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1512, height: 945 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (mobile)
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return ['webgl', 'webgl2', 'experimental-webgl'].includes(type)
            ? null
            : original.apply(this, [type, ...args]);
        };
      });
    await page.goto(`${base}/explore`);
    await expect(page.locator(mobile ? '.compatibility-canvas>svg' : 'canvas')).toBeVisible();
    await expect(page.locator('.scene-labels')).toHaveAttribute('data-label-zoom', /1\.0/);
    async function camera(name) {
      await page.getByRole('button', { name: 'Controls', exact: true }).click();
      await page.getByRole('button', { name, exact: true }).click();
      await page.getByRole('button', { name: 'Close controls', exact: true }).click();
      await page.waitForTimeout(250);
    }
    async function capture(name, sceneOnly = false) {
      const style = sceneOnly
        ? await page.addStyleTag({
            content:
              '.scene-viewport::after{display:none!important}.explorer-title,.view-switch,.site-context-controls,.model-navigation,.floor-navigation,.unit-panel,.interaction-hint,.availability-legend,.scene-disclaimer,.scene-labels{visibility:hidden!important}',
          })
        : null;
      await (sceneOnly ? page.locator('.scene-viewport') : page).screenshot({
        path: `${directory}/${mobile ? 'mobile-svg' : 'desktop-webgl'}-${name}.png`,
        ...(!sceneOnly ? { fullPage: mobile } : {}),
      });
      await style?.evaluate((element) => element.remove());
    }
    await capture('structure-ui');
    await camera('Front view');
    await capture('frame-front', true);
    await page.getByRole('button', { name: 'Proposed Finished Plaza View', exact: true }).click();
    await camera('Front view');
    await capture('proposed-front', true);
    await page.getByRole('button', { name: 'First Floor', exact: true }).click();
    await camera('Isometric');
    await capture('turning-stairs', true);
    await page.getByRole('button', { name: 'Semi-basement', exact: true }).click();
    await capture('semi-basement', true);
    await page.getByRole('button', { name: 'Ground Floor', exact: true }).click();
    await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
    await page
      .locator('.plan-area')
      .screenshot({
        path: `${directory}/${mobile ? 'mobile-svg' : 'desktop-webgl'}-ground-plan.png`,
      });
    await page.getByRole('button', { name: 'Second Floor', exact: true }).click();
    await page
      .locator('.plan-area')
      .screenshot({
        path: `${directory}/${mobile ? 'mobile-svg' : 'desktop-webgl'}-second-plan.png`,
      });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow || errors.length) throw new Error(JSON.stringify({ mobile, overflow, errors }));
    console.log(JSON.stringify({ mobile, renderer: mobile ? 'SVG' : 'WebGL', overflow, errors }));
    await page.close();
  }
} finally {
  await browser.close();
}
