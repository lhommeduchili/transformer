import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('loads the import and inspection shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /transformer/i })).toBeVisible();
  await expect(page.locator('.signature-line .visually-hidden')).toHaveText('made with ♥ by alφ');
  await expect(page.locator('a.signature-line')).toHaveAttribute(
    'href',
    'https://lhommeduchili.xyz',
  );
  await expect(page.getByRole('heading', { name: /drop audio/i })).toBeVisible();
});

test('uses browser download output when direct folder access is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /^destination$/i }).locator('..')).toContainText(
    /browser downloads/i,
  );
  await expect(page.getByRole('button', { name: /choose folder/i })).toHaveCount(0);
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

  await page.getByRole('button', { name: /^clear$/i }).click();
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

test('converts a real wav locally and exports its report through download fallback', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByLabel(/choose audio files/i).setInputFiles({
    name: 'Local Test.wav',
    mimeType: 'audio/wav',
    buffer: createSilentWav(),
  });

  await page.getByRole('button', { name: /create queue/i }).click();
  const outputDownload = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: /^start$/i }).click();
  const output = await outputDownload;

  expect(output.suggestedFilename()).toBe('Local Test.aiff');
  const outputPath = await output.path();
  if (outputPath === null) throw new Error('Expected a downloaded conversion.');
  const outputBytes = await readFile(outputPath);
  expect(outputBytes.byteLength).toBeGreaterThan(54);
  expect(outputBytes.subarray(0, 4).toString('ascii')).toBe('FORM');
  expect(outputBytes.subarray(8, 12).toString('ascii')).toBe('AIFF');
  await expect(page.getByRole('status')).toContainText(/queue status: completed/i, {
    timeout: 120_000,
  });
  await expect(page.getByRole('heading', { name: /^report$/i })).toBeVisible();

  const reportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /export json/i }).click();
  const report = await reportDownload;
  const reportPath = await report.path();
  if (reportPath === null) throw new Error('Expected a downloaded report.');
  const reportContents = JSON.parse(await readFile(reportPath, 'utf8')) as {
    readonly queueStatus: string;
    readonly jobs: readonly { readonly outputName: string; readonly status: string }[];
  };

  expect(reportContents.queueStatus).toBe('completed');
  expect(reportContents.jobs).toContainEqual(
    expect.objectContaining({ outputName: 'Local Test.aiff', status: 'completed' }),
  );
});

test('loads and converts after the PWA has been cached and the network is offline', async ({
  context,
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          navigator as Navigator & {
            serviceWorker: { readonly ready: Promise<unknown> };
          }
        ).serviceWorker.ready.then(() => true),
      ),
    )
    .toBe(true);

  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /transformer/i })).toBeVisible();

  await page.getByLabel(/choose audio files/i).setInputFiles({
    name: 'Offline Test.wav',
    mimeType: 'audio/wav',
    buffer: createSilentWav(),
  });
  await page.getByRole('button', { name: /create queue/i }).click();
  const outputDownload = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: /^start$/i }).click();
  const output = await outputDownload;

  expect(output.suggestedFilename()).toBe('Offline Test.aiff');
  await expect(page.getByRole('status')).toContainText(/queue status: completed/i, {
    timeout: 120_000,
  });
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

test('supports keyboard access to imported track removal and clear', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel(/choose audio files/i).setInputFiles([
    {
      name: 'Artist - Song.flac',
      mimeType: 'audio/flac',
      buffer: Buffer.from('placeholder'),
    },
    {
      name: 'Another - Track.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('placeholder'),
    },
  ]);

  const clearButton = page.getByRole('button', { name: /^clear$/i });
  const removeButton = page.getByRole('button', { name: /remove artist - song.flac/i });
  await expect(clearButton).toBeEnabled();
  await expect(removeButton).toBeVisible();

  await tabUntilFocused(page, clearButton);
  await expect(clearButton).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(removeButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByLabel('imported audio files').getByText('Artist - Song.flac')).toHaveCount(
    0,
  );
  await expect(
    page.getByLabel('imported audio files').getByText('Another - Track.wav'),
  ).toBeVisible();

  await page.keyboard.press('Shift+Tab');
  await expect(clearButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByLabel('imported audio files')).toHaveCount(0);
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

function createSilentWav(): Buffer {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = 800;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = sampleCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}
