import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('packaged desktop app converts through the native output bridge', async () => {
  test.setTimeout(120_000);
  const executablePath = process.env.TRANSFORMER_ELECTRON_EXECUTABLE;
  if (executablePath === undefined) {
    throw new Error('TRANSFORMER_ELECTRON_EXECUTABLE must point to the packaged app executable.');
  }

  const outputDirectory = await mkdtemp(join(tmpdir(), 'transformer-electron-test-'));
  const application = await electron.launch({ executablePath });

  try {
    const page = await application.firstWindow();
    await expect(page).toHaveURL(/^transformer:\/\/app\//);
    await expect(page.getByRole('heading', { name: /transformer/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^destination$/i }).locator('..')).toContainText(
      /no folder selected/i,
    );
    await expect(page.getByRole('button', { name: /choose folder/i })).toBeVisible();

    await application.evaluate(({ dialog }, directoryPath) => {
      dialog.showOpenDialog = () =>
        Promise.resolve({ canceled: false, filePaths: [directoryPath] });
    }, outputDirectory);
    await page.getByRole('button', { name: /choose folder/i }).click();
    await expect(page.getByRole('heading', { name: /^destination$/i }).locator('..')).toContainText(
      /transformer-electron-test/i,
    );

    await page.getByLabel(/choose audio files/i).setInputFiles({
      name: 'Desktop Test.wav',
      mimeType: 'audio/wav',
      buffer: createSilentWav(),
    });
    await page.getByRole('button', { name: /create queue/i }).click();
    await page.getByRole('button', { name: /^start$/i }).click();
    await expect(page.getByRole('status')).toContainText(/queue status: completed/i, {
      timeout: 120_000,
    });

    const output = await readFile(join(outputDirectory, 'Desktop Test.aiff'));
    expect(output.byteLength).toBeGreaterThan(54);
    expect(output.subarray(0, 4).toString('ascii')).toBe('FORM');
    expect(output.subarray(8, 12).toString('ascii')).toBe('AIFF');
  } finally {
    await application.close();
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

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
