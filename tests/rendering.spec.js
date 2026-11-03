import { test, expect } from '@playwright/test';

test('legacy masks preserve RGB bits, scaled atlas coordinates and clipping', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { drawMaskedSprite } = await import('/src/raster.js');
    const results = [];
    for (const scale of [0.75, 1, 2, 3, 6]) for (const assetScale of [1, 2]) {
      const atlas = document.createElement('canvas');
      atlas.width = 4 * assetScale; atlas.height = 2 * assetScale;
      const a = atlas.getContext('2d');
      a.fillStyle = '#ff0000'; a.fillRect(0, 0, atlas.width, atlas.height);
      a.fillStyle = 'rgb(16,1,2)'; a.fillRect(0, 0, assetScale, assetScale);
      a.fillStyle = 'rgb(15,240,85)'; a.fillRect(2 * assetScale, 0, assetScale, assetScale);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 24;
      const c = canvas.getContext('2d', { willReadFrequently: true });
      c.fillStyle = 'rgb(170,85,240)'; c.fillRect(0, 0, 24, 24);
      c.scale(scale, scale);
      // A clip remains active when the composited pixels are drawn back.
      c.beginPath(); c.rect(0, 0, 2, 24); c.clip();
      drawMaskedSprite(c, atlas, { x: 0, y: 0, width: 1, height: 1 },
        { x: 2, y: 0, width: 1, height: 1 }, 0, 0, assetScale);
      results.push({ scale, assetScale,
        inside: [...c.getImageData(Math.floor(0.5 * scale), Math.floor(0.5 * scale), 1, 1).data],
        outside: [...c.getImageData(23, 23, 1, 1).data] });
      // A second draw crossing the clip must leave pixels beyond x=2*scale untouched.
      drawMaskedSprite(c, atlas, { x: 0, y: 0, width: 1, height: 1 },
        { x: 2, y: 0, width: 1, height: 1 }, 2, 1, assetScale);
      results.at(-1).clipped = [...c.getImageData(Math.ceil(2 * scale), Math.floor(1.5 * scale), 1, 1).data];
    }
    return results;
  });
  for (const result of results) {
    expect(result.inside, JSON.stringify(result)).toEqual([26, 81, 82, 255]);
    expect(result.outside).toEqual([170, 85, 240, 255]);
    expect(result.clipped).toEqual([170, 85, 240, 255]);
  }
});

test('card review loads all sheet variants and retains original card IDs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?review=cards');
  const table = page.getByRole('img');
  await expect(table).toHaveAttribute('data-ready', 'true');
  for (const set of [1, 2, 3, 4, 5]) for (const size of [1, 2]) for (const orientation of ['V', 'H']) {
    await page.getByRole('combobox', { name: 'Kartensatz', exact: true }).selectOption(String(set));
    await page.getByRole('combobox', { name: 'Kartengrösse', exact: true }).selectOption(String(size));
    await page.getByRole('combobox', { name: 'Ausrichtung', exact: true }).selectOption(orientation);
    await expect(table).toHaveAttribute('data-ready', 'true');
    await expect(page.getByRole('group', { name: 'Kartenhand' }).getByRole('button')).toHaveCount(9);
  }
  await page.getByRole('combobox', { name: 'Karten', exact: true }).selectOption('28');
  await page.getByRole('button', { name: 'Karte 36', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Karte 36', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('card hit targets track 1x/2x/3x, high DPI, horizontal overlap and mobile fit', async ({ browser }) => {
  for (const dpr of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 2500, height: 1900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    await page.goto('/?review=cards');
    const table = page.getByRole('img');
    await expect(table).toHaveAttribute('data-ready', 'true');
    for (const scale of [1, 2, 3]) {
      await page.getByRole('button', { name: 'Ansicht', exact: true }).click();
      await page.getByRole('button', { name: `${scale}× Vergrösserung` }).click();
      await expect(table).toHaveAttribute('data-scale', String(scale));
      await expect(table).toHaveAttribute('width', String(768 * scale * dpr));
      for (const id of [1, 5, 9]) {
        await page.getByRole('button', { name: `Karte ${id}`, exact: true }).click();
        await expect(page.getByRole('button', { name: `Karte ${id}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
      }
    }
    await page.getByRole('combobox', { name: 'Ausrichtung', exact: true }).selectOption('H');
    await expect(table).toHaveAttribute('data-ready', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await table.boundingBox()).width).toBeLessThanOrEqual(374);
    for (const id of [1, 5, 9]) {
      await page.getByRole('button', { name: `Karte ${id}`, exact: true }).click();
      await expect(page.getByRole('button', { name: `Karte ${id}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    await page.screenshot({ path: `test-results/cards-mobile-dpr-${dpr}.png` });
    await page.setViewportSize({ width: 1186, height: 1000 });
    await page.getByRole('combobox', { name: 'Ausrichtung', exact: true }).selectOption('V');
    await expect(table).toHaveAttribute('data-ready', 'true');
    await page.screenshot({ path: `test-results/cards-desktop-dpr-${dpr}.png` });
    await context.close();
  }
});
