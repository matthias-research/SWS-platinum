import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const generated = existsSync(new URL('../artifacts/m1/manifest.json', import.meta.url));
test.skip(!generated, 'Generate the local M1 collection with npm run reference:extract first');

test('recovered assets remain traceable and the reference-build filter works', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/artifacts/m1/gallery.html');
  await expect(page.locator('article')).toHaveCount(586);
  await page.getByRole('searchbox', { name: 'Filter assets' }).fill('reference original/schiebpl.exe');
  await expect(page.locator('article:visible')).toHaveCount(85);
  const first = page.locator('article:visible').first();
  await expect(first.getByRole('link', { name: 'Original payload' })).toBeVisible();
  await expect.poll(() => first.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/reference-gallery.png' });
  expect(errors).toEqual([]);
});

test('sprite gallery exposes actual masks and all five card sets', async ({ page }) => {
  await page.goto('/artifacts/m1/mappings-gallery.html');
  await expect(page.getByRole('heading', { name: 'Schieber pieces (121)', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Differ pieces (128)', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Card set / })).toHaveCount(5);
  const pencilMask = page.locator('figure').filter({ hasText: '85 AND/OR 86' }).first();
  await pencilMask.scrollIntoViewIfNeeded();
  await expect.poll(() => pencilMask.locator('img').evaluate(img => img.naturalWidth)).toBe(177);
  await page.screenshot({ path: 'test-results/reference-masks.png' });
});
