import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { createImportedFileRegistry } from '../../import/application/imported-file-registry';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { createBrowserLocalAudioInspectionAdapter } from '../infrastructure/browser-local-audio-inspection-adapter';

function asset(extension: string): AudioAsset {
  const id = createAudioAssetId(`asset-${extension}`);
  const sizeBytes = createFileSizeBytes(1234);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: `track.${extension}`,
    sizeBytes: sizeBytes.value,
    extension,
    importedAt: importedAt.value,
  };
}

describe('browser local audio inspection adapter', () => {
  it('inspects local wav headers without decoding the full file', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('wav');

    registry.register(
      audioAsset.id,
      new File([blobPart(wavHeader())], audioAsset.sourceName, { type: 'audio/wav' }),
    );

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(registry).inspect([
      audioAsset,
    ]);

    expect(inspection?.container).toBe('wav');
    expect(inspection?.codec).toBe('pcm_s16le');
    expect(inspection?.sampleRateHz).toBe(44100);
    expect(inspection?.channels).toBe(2);
    expect(inspection?.durationMs).toBe(1000);
    expect(inspection?.warnings).toEqual([]);
  });

  it('inspects local mp3 frame headers for stream details', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('mp3');

    registry.register(
      audioAsset.id,
      new File([blobPart(mp3Header())], audioAsset.sourceName, { type: 'audio/mpeg' }),
    );

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(registry).inspect([
      audioAsset,
    ]);

    expect(inspection?.container).toBe('mp3');
    expect(inspection?.codec).toBe('mp3');
    expect(inspection?.sampleRateHz).toBe(44100);
    expect(inspection?.bitrateKbps).toBe(128);
    expect(inspection?.channels).toBe(2);
    expect(inspection?.warnings).toEqual([]);
  });

  it('falls back to the asset extension when the original file is unavailable', async () => {
    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      createImportedFileRegistry(),
    ).inspect([asset('flac')]);

    expect(inspection?.container).toBe('flac');
    expect(inspection?.codec).toBe('flac');
    expect(inspection?.warnings).toContainEqual(
      expect.objectContaining({ type: 'inspection_incomplete' }),
    );
  });
});

function wavHeader(): Uint8Array {
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const dataBytes = byteRate;
  const bytes = new Uint8Array(44);
  const view = new DataView(bytes.buffer);

  writeAscii(bytes, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(bytes, 8, 'WAVE');
  writeAscii(bytes, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, channels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(bytes, 36, 'data');
  view.setUint32(40, dataBytes, true);

  return bytes;
}

function mp3Header(): Uint8Array {
  return new Uint8Array([0xff, 0xfb, 0x90, 0x64]);
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    bytes[offset + index] = text.charCodeAt(index);
  }
}

function blobPart(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
