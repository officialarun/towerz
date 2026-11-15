import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-webgl'],
});
const page = await browser.newPage();
for (const size of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1512, height: 945 },
]) {
  await page.setViewportSize(size);
  for (const route of ['/', '/explore']) {
    await page.goto(`http://localhost:3001${route}`, { waitUntil: 'networkidle' });
    if (route === '/')
      await page.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
    await page.locator('.camera-toolbar').waitFor();
    console.log(
      JSON.stringify({
        size,
        route,
        ...(await page.evaluate(() => {
          const phase = document
            .querySelector('[aria-label="Building presentation"]')
            .getBoundingClientRect();
          const nav = document.querySelector('.model-navigation').getBoundingClientRect();
          const tray = document.querySelector('.camera-toolbar').getBoundingClientRect();
          const host = document.querySelector('.explorer').getBoundingClientRect();
          const stage = document.querySelector('.scene-area').getBoundingClientRect();
          return {
            phase: { center: phase.left + phase.width / 2, bottom: phase.bottom },
            nav: { center: nav.left + nav.width / 2, top: nav.top },
            trayCenter: tray.left + tray.width / 2,
            viewerCenter: (Math.max(host.left, stage.left) + Math.min(host.right, stage.right)) / 2,
            buttons: [...document.querySelectorAll('.model-navigation button')].map((button) => {
              const rect = button.getBoundingClientRect();
              const hit = document.elementFromPoint(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
              );
              return {
                name: button.getAttribute('aria-label'),
                clickable: hit?.closest('button') === button,
                blockedBy:
                  hit?.closest('button') === button ? null : `${hit?.tagName}.${hit?.className}`,
              };
            }),
          };
        })),
      }),
    );
  }
}
await browser.close();
