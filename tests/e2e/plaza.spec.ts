import { test, expect } from '@playwright/test';
test('3D controls, floor isolation, roof, exploded mode, synchronized plan selection, interior and shortlist', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('Preparing your perspective')).toBeHidden();
  const tray = page.locator('.camera-toolbar');
  await expect(tray.getByRole('button')).toHaveCount(5);
  expect(
    await tray
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label'))),
  ).toEqual(['Reset 3D model', 'Rotate', 'Zoom in', 'Zoom out', 'Opposite side context']);
  await expect(page.getByRole('button', { name: /full.?screen/i })).toHaveCount(0);
  const reset = tray.getByRole('button', { name: 'Reset 3D model', exact: true });
  await page.keyboard.press('Tab');
  await reset.focus();
  expect(await reset.evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');
  await expect(page.getByRole('button', { name: 'Rear view', exact: true })).toHaveCount(0);
  const controls = page.getByRole('button', { name: 'Controls', exact: true });
  await controls.click();
  await expect(controls).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('dialog', { name: 'Model controls' })).toBeVisible();
  await expect(page.getByRole('button', { name: /full.?screen/i })).toHaveCount(0);
  const rear = page.getByRole('button', { name: 'Rear view', exact: true });
  await rear.click();
  await expect(rear).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1400);
  await page.getByRole('button', { name: 'Hide roof', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Restore roof' })).toBeVisible();
  await page.getByRole('button', { name: 'Explode floors', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assemble floors' })).toBeVisible();
  await page.getByRole('button', { name: 'Assemble floors' }).click();
  await page.getByRole('button', { name: 'Architecture mode', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Leasing mode', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close controls', exact: true }).click();
  await expect(controls).toBeFocused();
  await controls.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Model controls' })).toHaveCount(0);
  await expect(controls).toBeFocused();
  await page.getByRole('button', { name: 'Ground Floor', exact: true }).click();
  await page.getByRole('button', { name: 'Floor Plan', exact: true }).click();
  const polygon = page.locator('[data-unit="S1-01"]');
  await expect(polygon).toBeVisible();
  await polygon.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Details for shop S1-01' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to shortlist', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Added to shortlist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await page.getByRole('button', { name: 'Explore interior', exact: true }).click();
  await expect(page.getByText('Simplified modeled interior · S1-01')).toBeVisible();
  await page.getByRole('button', { name: 'Exit interior', exact: true }).last().click();
  await page.reload();
  await page
    .getByRole('button', { name: /Shortlist.*1/ })
    .first()
    .click();
  await expect(page.getByRole('columnheader', { name: /S1-01/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('shop filtering and enquiry form stay entirely in the browser', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' || new URL(request.url()).pathname.startsWith('/api/'))
      writes.push(request.url());
  });
  await page.goto('/shops');
  await page.getByRole('combobox', { name: 'Filter by availability' }).selectOption('available');
  await expect(page.locator('.shop-card')).toHaveCount(21);
  await page.getByRole('combobox', { name: 'Filter by floor' }).selectOption('2');
  await expect(page.locator('.shop-card')).toHaveCount(5);
  await page.getByRole('textbox', { name: 'Search shops' }).fill('S2-05');
  await expect(page.locator('.shop-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Discover the space' }).click();
  await expect(page.getByRole('heading', { name: 'Shop S2-05' })).toBeVisible();
  await page.getByRole('button', { name: 'Enquire about this space' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('Browser QA Visitor');
  await page.getByRole('textbox', { name: 'Mobile number' }).fill('+91 9876543210');
  await page.getByRole('textbox', { name: 'Email address' }).fill('visitor@example.com');
  await page.getByRole('combobox', { name: 'Business category' }).selectOption('Retail');
  await page.getByLabel(/Preferred visit date/).fill('2099-01-02');
  await page
    .getByRole('textbox', { name: /A little about your plans/ })
    .fill('Browser verification of the leasing and visit workflow.');
  await page.getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: 'Submission coming soon' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('not sent or saved');
  await page.getByRole('textbox', { name: 'Email address' }).press('Enter');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Enquire about this space' }).click();
  await expect(page.getByRole('textbox', { name: 'Full name' })).toBeEmpty();
  expect(writes).toEqual([]);
});
test('shop pages work as direct static links and backend routes are absent', async ({
  page,
  request,
}) => {
  for (const id of ['S2-05', 'S3-05']) {
    await page.goto(`/shops/${id}/`);
    await expect(page.getByRole('heading', { name: `Shop ${id}` })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: `Shop ${id}` })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Administrator', exact: true })).toHaveCount(0);
  expect((await request.get('/admin/')).status()).toBe(404);
  expect((await request.get('/api/units/')).status()).toBe(404);
  expect((await request.post('/api/enquiries/', { data: {} })).status()).toBe(405);
});
test('mobile navigation, floor plans, selections and layout fit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '3D Model', exact: true }).first().click();
  await expect(page.locator('canvas')).toBeVisible();
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.window);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Floor Plans', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Semi-basement', exact: true })).toBeVisible();
  await page.locator('[data-unit="G-01"]').click();
  await expect(page.getByRole('complementary', { name: 'Details for shop G-01' })).toBeVisible();
  await page.getByRole('button', { name: 'Enquire about this space' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
});
