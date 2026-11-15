import { test, expect, type Page } from '@playwright/test';

async function expectPinnedActions(page: Page) {
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Submission coming soon' })).toBeInViewport();
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`mobile enquiry keeps actions visible while entering details at ${viewport.width}×${viewport.height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto('/shops');
    await page.getByRole('button', { name: 'Enquire now' }).click();
    await expectPinnedActions(page);
    await page.getByRole('textbox', { name: 'Full name' }).fill('Mobile Visitor');
    await page.getByRole('textbox', { name: 'Mobile number' }).fill('+91 9876543210');
    await page.getByRole('textbox', { name: 'Email address' }).fill('mobile@example.com');
    await page.getByRole('combobox', { name: 'Business category' }).selectOption('Retail');
    await page.getByLabel(/Preferred visit date/).fill('2099-01-02');
    await page
      .getByRole('textbox', { name: /A little about your plans/ })
      .fill('Looking for a retail space.');
    await page.getByRole('checkbox').check();
    await expectPinnedActions(page);
    expect(
      await page.locator('.enquiry-fields').evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0);
    expect(
      await page
        .getByRole('dialog')
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Mobile Visitor');
    await expect(page.getByRole('button', { name: 'Submission coming soon' })).toBeDisabled();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Enquire now' }).click();
    await expect(page.getByRole('textbox', { name: 'Full name' })).toBeEmpty();
    await context.close();
  });
}

test('mobile enquiry fits a reduced viewport while a field is focused', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('/shops');
  await page.getByRole('button', { name: 'Enquire now' }).click();
  const email = page.getByRole('textbox', { name: 'Email address' });
  await email.fill('mobile@example.com');
  await page.setViewportSize({ width: 390, height: 420 });
  await expect(page.locator('.enquiry-dialog')).toHaveAttribute('data-compact-height', '');
  await expectPinnedActions(page);
  await expect(email).toBeFocused();
  await expect(email).toBeInViewport();
  const field = await email.boundingBox();
  const heading = await page.locator('.enquiry-dialog .dialog-heading').boundingBox();
  const footer = await page.locator('.enquiry-submit-area').boundingBox();
  expect(field!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
  expect(field!.y + field!.height).toBeLessThanOrEqual(footer!.y);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.enquiry-dialog')).not.toHaveAttribute('data-compact-height');
  await expectPinnedActions(page);
  await expect(email).toHaveValue('mobile@example.com');
  await context.close();
});
