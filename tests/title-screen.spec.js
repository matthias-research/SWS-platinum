import { test, expect } from '@playwright/test';

test('opening table loads, switches artwork and exposes real menu controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1186, height: 867 });
  await page.goto('/');
  const table = page.getByRole('img');
  await expect(table).toHaveAttribute('data-ready', 'true');
  await expect(table).toHaveAttribute('data-artwork', 'enhanced');
  await page.screenshot({ path: 'test-results/title-enhanced.png' });
  await page.getByRole('button', { name: 'Ansicht', exact: true }).click();
  await page.getByRole('button', { name: 'Originalgrafik', exact: true }).click();
  await expect(table).toHaveAttribute('data-artwork', 'original');
  await page.screenshot({ path: 'test-results/title-original.png' });
  await page.getByRole('button', { name: 'Hilfe', exact: true }).click();
  await page.getByRole('button', { name: 'Über Stöck Wyys Stich…' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('fit, display scale and high-DPI backing size remain independent', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1800, height: 1300 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('/');
  const table = page.getByRole('img');
  await expect(table).toHaveAttribute('data-ready', 'true');
  await expect(table).toHaveAttribute('width', '3072');
  await page.getByRole('button', { name: 'Ansicht', exact: true }).click();
  await page.getByRole('button', { name: 'An Fenster anpassen' }).click();
  for (const scale of [1, 2, 3]) {
    await page.getByRole('button', { name: 'Ansicht', exact: true }).click();
    await page.getByRole('button', { name: `${scale}× Vergrösserung` }).click();
    await expect(table).toHaveAttribute('data-scale', String(scale));
    await expect(table).toHaveAttribute('width', String(768 * scale * 2));
    expect((await table.boundingBox()).width).toBe(768 * scale);
  }
  await page.getByRole('button', { name: 'Ansicht', exact: true }).click();
  await page.getByRole('button', { name: 'An Fenster anpassen' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await table.boundingBox()).width).toBeLessThanOrEqual(374);
  await page.screenshot({ path: 'test-results/title-mobile.png' });
  await context.close();
});
