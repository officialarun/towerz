import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    });
    await page.goto('http://localhost:3001/');
    await page.getByRole('button', { name: 'Final Look', exact: true }).click();
    await page.locator('.final-look img').waitFor();
    await page.waitForFunction(() => document.querySelector('.final-look img')?.naturalWidth > 0);
    await page.screenshot({
      path: `/tmp/plaza-final-${mobile ? 'mobile' : 'desktop'}.png`,
      fullPage: mobile,
    });
    console.log(
      JSON.stringify({
        mobile,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        image: await page.locator('.final-image-stage').boundingBox(),
      }),
    );
    await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
    await page.locator('.scene-labels[data-label-zoom]').waitFor();
    await page.waitForTimeout(1600);
    await page.screenshot({
      path: `/tmp/plaza-basement-${mobile ? 'mobile' : 'desktop'}.png`,
      fullPage: mobile,
    });
    await page.getByRole('button', { name: 'Proposed Finished Plaza View', exact: true }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `/tmp/plaza-proposed-${mobile ? 'mobile' : 'desktop'}.png`,
      fullPage: mobile,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
