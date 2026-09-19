import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

const pattern = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627"><defs><pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#1f4e55"/><rect width="12" height="32" fill="#f5ead5"/><rect y="14" width="32" height="4" fill="#b96c42"/></pattern></defs><rect width="1200" height="627" fill="url(#p)"/></svg>`;

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const maps = Array.from(document.querySelectorAll('feImage'));
    await Promise.all(maps.map(async (map) => {
      const image = new Image();
      image.src = map.getAttribute('href') || '';
      await image.decode();
    }));
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test.beforeEach(async ({ page }) => {
  // Deterministic image pixels avoid false differences from network/font loading.
  await page.route('https://images.unsplash.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: pattern }));
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://unpkg.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://code.jquery.com/**', async (route) => route.fulfill({
    contentType: 'text/javascript',
    body: await readFile(new URL('../node_modules/jquery/dist/jquery.min.js', import.meta.url), 'utf8'),
  }));
  await page.goto('/');
  await expect(page.locator('.liquid-glass.lg-image-ready')).toBeVisible();
});

test('uses the same working reflection and image filter in each engine', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const material = await page.locator('.liquid-glass').evaluate((el) => ({
    filter: getComputedStyle(el.querySelector('.liquid-glass__image')!).filter,
    tint: getComputedStyle(el, '::before').backgroundColor,
    reflection: getComputedStyle(el, '::after').backgroundImage,
    rim: getComputedStyle(el, '::after').boxShadow,
    shadow: getComputedStyle(el).boxShadow,
    backdrop: getComputedStyle(el).backdropFilter,
  }));
  expect(material.filter).toContain('lg-optics-');
  expect(material.tint).toContain('0.14');
  expect(material.reflection).not.toBe('none');
  expect(material.rim).not.toBe('none');
  expect(material.shadow).not.toBe('none');
  expect(material.backdrop).not.toContain('url(');
  await expect(page.locator('feDisplacementMap')).toHaveCount(3);

  const glass = page.locator('.liquid-glass');
  await glass.evaluate((el: HTMLElement) => {
    el.style.setProperty('--lg-blur', '0px');
    el.style.setProperty('--lg-saturate', '1');
    el.style.setProperty('--lg-specular', '0');
    el.style.setProperty('--lg-tint-opacity', '0');
  });
  await expect(page.locator('feGaussianBlur')).toHaveAttribute('stdDeviation', '0');
  await expect(page.locator('feColorMatrix[type="saturate"]')).toHaveAttribute('values', '1');
  await settle(page);
  const refracted = await glass.screenshot();
  await glass.locator('.liquid-glass__image').evaluate((el: HTMLElement) => {
    el.style.filter = 'none';
    el.style.setProperty('-webkit-filter', 'none');
  });
  await settle(page);
  const unfiltered = await glass.screenshot();
  expect(refracted.equals(unfiltered), 'Displacement must visibly bend pixels, not merely parse as CSS.').toBe(false);

  await glass.evaluate((el: HTMLElement) => el.style.setProperty('--lg-specular', '1'));
  await settle(page);
  const glossy = await glass.screenshot();
  expect(glossy.equals(unfiltered), 'Specular light must be visible without any refraction.').toBe(false);
  expect(errors).toEqual([]);
});

test('keeps the scene aligned when dragged and reuses the filter', async ({ page }) => {
  const glass = page.locator('.liquid-glass');
  const scene = glass.locator('.liquid-glass__scene');
  const before = await scene.evaluate((el: HTMLElement) => parseFloat(el.style.left));
  const filterId = await page.locator('filter').getAttribute('id');
  await glass.evaluate((el: HTMLElement) => { el.style.transform = 'translateX(45px)'; });
  await expect.poll(() => scene.evaluate((el: HTMLElement) => parseFloat(el.style.left))).toBeLessThan(before - 44);
  await expect(page.locator('filter')).toHaveAttribute('id', filterId!);
  await expect(page.locator('filter')).toHaveCount(1);

  await page.getByRole('spinbutton', { name: 'Refraction value', exact: true }).fill('170');
  await page.getByRole('spinbutton', { name: 'Refraction value', exact: true }).press('Enter');
  await expect(page.locator('feDisplacementMap').nth(1)).toHaveAttribute('scale', '-170');
  await expect(page.locator('filter')).toHaveCount(1);
});

test('works with multiple elements and cleans up removed subtrees', async ({ page }) => {
  await page.evaluate(() => {
    const scene = document.querySelector('.liquid-glass-scene')!;
    const group = document.createElement('div');
    group.id = 'extra-glasses';
    group.innerHTML = '<div class="liquid-glass" style="width:120px;height:80px">One</div><div class="liquid-glass" style="width:140px;height:90px">Two</div>';
    scene.appendChild(group);
  });
  await expect(page.locator('.lg-image-ready')).toHaveCount(3);
  await expect(page.locator('filter')).toHaveCount(3);
  const ids = await page.locator('filter').evaluateAll((filters) => filters.map((filter) => filter.id));
  expect(new Set(ids).size).toBe(3);
  await page.locator('#extra-glasses').evaluate((el) => el.remove());
  await expect(page.locator('filter')).toHaveCount(1);
});

test('exports the live dimensions, shared stylesheet, and photo into working files', async ({ page }) => {
  await page.getByRole('tab', { name: 'Button', exact: true }).click();
  await page.getByRole('button', { name: 'Export code', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const html = (await dialog.locator('pre code').textContent())!;
  expect(html).toContain('<div class="liquid-glass">');
  expect(html).toContain('background-image: url(');
  expect(html).not.toContain('data-lg-');

  await dialog.getByRole('button', { name: 'CSS', exact: true }).click();
  const css = (await dialog.locator('pre code').textContent())!;
  const shared = await readFile(new URL('../src/vendor/liquid-glass.css', import.meta.url), 'utf8');
  expect(css).toContain('width: 220px');
  expect(css).toContain('height: 52px');
  expect(css).toContain('--lg-radius: 9999px');
  expect(css.split('/* The same surface')[1].split('\n.liquid-glass {\n  width:')[0]).toBe(shared.split('/* The same surface')[1]);
  expect(css).not.toMatch(/png\(|rgba\(var\(--lg-tint\),|circle\s+\d+%\s+\d+%/);

  await dialog.getByRole('button', { name: 'jQuery', exact: true }).click();
  const js = (await dialog.locator('pre code').textContent())!;
  expect(js).not.toContain('navigator.userAgent');
  expect(js).not.toContain('lg-soft');
  expect(js).toContain('image-refraction');
  const fileDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await fileDownload;
  expect(saved.suggestedFilename()).toBe('liquid-glass.js');
  expect(await saved.failure()).toBeNull();

  const zipDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download all (.zip)', exact: true }).click();
  const zipped = await zipDownload;
  const archive = await JSZip.loadAsync(await readFile((await zipped.path())!));
  expect(Object.keys(archive.files).sort()).toEqual(['index.html', 'liquid-glass-demo.html', 'liquid-glass.css', 'liquid-glass.js']);

  await page.route('**/export-check.html', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/liquid-glass.css', (route) => route.fulfill({ contentType: 'text/css', body: css }));
  await page.route('**/liquid-glass.js', (route) => route.fulfill({ contentType: 'text/javascript', body: js }));
  await page.goto('/export-check.html');
  await expect(page.locator('.liquid-glass.lg-image-ready')).toBeVisible();
  await expect(page.locator('feDisplacementMap')).toHaveCount(3);
});

test('keeps gloss when there is no image, and exposes Export at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeInViewport();
  await page.locator('.liquid-glass').evaluate((el: HTMLElement) => {
    el.style.setProperty('--lg-source', 'none');
  });
  await expect(page.locator('.liquid-glass')).not.toHaveClass(/lg-image-ready/);
  const gloss = await page.locator('.liquid-glass').evaluate((el) => ({
    rim: getComputedStyle(el, '::after').boxShadow,
    reflection: getComputedStyle(el, '::after').backgroundImage,
  }));
  expect(gloss.rim).not.toBe('none');
  expect(gloss.reflection).not.toBe('none');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Single HTML file', exact: true })).toBeVisible();
});