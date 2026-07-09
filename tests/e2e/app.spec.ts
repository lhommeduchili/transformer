import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads the import and inspection shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /transformer/i })).toBeVisible();
  await expect(page.locator('.signature-line .visually-hidden')).toHaveText('made with ♥ by alφ');
  await expect(page.getByRole('heading', { name: /drop audio/i })).toBeVisible();
});

test('imports a supported audio file through the picker', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel(/choose audio files/i).setInputFiles({
    name: 'Artist - Song.flac',
    mimeType: 'audio/flac',
    buffer: Buffer.from('placeholder'),
  });

  await expect(
    page.getByLabel('imported audio files').getByText('Artist - Song.flac'),
  ).toBeVisible();

  await page.getByText(/^checks\b/i).click();
  await expect(page.getByText(/flac \/ flac/i)).toBeVisible();

  await page.getByText(/^filenames\b/i).click();
  await expect(
    page.getByLabel('output filename previews').getByText('Artist - Song.aiff'),
  ).toBeVisible();
  await expect(page.getByLabel(/preset/i)).toHaveValue(/cdj_rekordbox_safe_aiff/);
  await expect(page.getByRole('heading', { name: /^report$/i })).toHaveCount(0);

  await page.getByRole('button', { name: /remove artist - song.flac/i }).click();
  await expect(page.getByLabel('imported audio files')).toHaveCount(0);
});

test('requires an output destination before planning a real conversion queue', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel(/choose audio files/i).setInputFiles({
    name: 'club-track.flac',
    mimeType: 'audio/flac',
    buffer: Buffer.from('placeholder'),
  });

  await page.getByRole('button', { name: /create queue/i }).click();
  await expect(page.getByRole('alert')).toContainText(/choose an output folder/i);
});

test('supports keyboard access to primary controls', async ({ page }) => {
  await page.goto('/');
  const importButton = page.locator('button', { hasText: 'choose files' });
  const presetSelector = page.getByLabel(/preset/i);

  await tabUntilFocused(page, importButton);
  await expect(importButton).toBeFocused();

  await tabUntilFocused(page, presetSelector);
  await expect(presetSelector).toBeFocused();
});

test('has no detectable accessibility violations on the app shell', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

async function tabUntilFocused(page: Page, locator: Locator) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.keyboard.press('Tab');

    try {
      await expect(locator).toBeFocused({ timeout: 100 });
      return;
    } catch {
      continue;
    }
  }
}
