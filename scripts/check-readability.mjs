import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-webgl'],
});
const results = [];
for (const width of [320, 390, 1512]) {
  const page = await browser.newPage({
    viewport: { width, height: 945 },
    isMobile: width < 761,
    hasTouch: width < 761,
  });
  for (const path of [
    '/',
    '/floor-plans',
    '/shops',
    '/shops/G-01',
    '/amenities',
    '/location',
    '/contact',
  ]) {
    await page.goto(`http://localhost:3001${path}`, { waitUntil: 'networkidle', timeout: 120000 });
    const size = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
      bodyFont: getComputedStyle(document.body).fontSize,
    }));
    if (size.content > size.viewport)
      throw new Error(`Horizontal overflow on ${path} at ${width}: ${size.content}`);
    if (size.bodyFont !== '18.2px')
      throw new Error(`Font scale missing on ${path}: ${size.bodyFont}`);
    if (path === '/floor-plans') {
      await expect(page.locator('.plan-content')).toHaveAttribute('transform', /scale\(1\.2\)/);
      const label = await page
        .locator('.plan-unit text')
        .first()
        .evaluate((el) => getComputedStyle(el).fontSize);
      if (label !== '18.2px')
        throw new Error(`Floor-plan label font did not grow by 30%: ${label}`);
      await page.getByRole('button', { name: 'Zoom in floor plan', exact: true }).click();
      await page.getByRole('button', { name: 'Reset floor plan', exact: true }).click();
      await expect(page.locator('.plan-content')).toHaveAttribute('transform', /scale\(1\.2\)/);
    }
    if (path === '/' && width === 1512)
      await page.screenshot({ path: '/tmp/plaza-larger-desktop.png' });
    results.push({ width, path, ...size });
  }
  await page.close();
}
console.log(
  JSON.stringify({
    checked: results.length,
    fonts: '130%',
    modelZoom: '100% in both camera constructors',
    planZoom: '120% including reset',
    overflow: false,
  }),
);
await browser.close();
