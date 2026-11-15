import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-webgl'],
});
const findings = [];
for (const width of [320, 390, 430]) {
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 120000 });
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await expect(page.locator('.compatibility-canvas>svg')).toBeVisible();
  await page.screenshot({ path: `/tmp/plaza-mobile-home-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
  await page.locator('.floor-tabs').getByRole('button', { name: '1F', exact: true }).click();
  await page.locator('[data-unit="S2-05"]').click();
  await expect(page.locator('.selected-panel')).toBeVisible();
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await page.locator('.selected-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/plaza-mobile-selected-${width}.png`, fullPage: true });
  findings.push(
    await page.evaluate(() => {
      const rect = (selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top + scrollY,
          bottom: r.bottom + scrollY,
          width: r.width,
          height: r.height,
        };
      };
      return {
        width: innerWidth,
        document: document.documentElement.scrollWidth,
        panel: rect('.selected-panel'),
        floor: rect('.floor-navigation'),
        stage: rect('.scene-area'),
        toolbar: rect('.camera-toolbar'),
        view: rect('.view-switch'),
        buttons: [...document.querySelectorAll('.selected-panel .unit-actions button')].map(
          (b) => ({
            text: b.innerText,
            visible: b.clientWidth,
            content: b.scrollWidth,
            height: b.clientHeight,
          }),
        ),
      };
    }),
  );
  findings[findings.length - 1].errors = errors;
  await page.close();
}
console.log(JSON.stringify(findings));
await browser.close();
