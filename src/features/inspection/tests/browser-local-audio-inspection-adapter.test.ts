import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { createImportedFileRegistry } from '../../import/application/imported-file-registry';
import type { AudioAsset } from '../../import/domain/audio-asset';
import type { AudioHeaderInspectorPort } from '../application/audio-header-inspector-port';
import { inspectAudioHeader } from '../infrastructure/audio-header-inspector';
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
  function createHeaderInspector(): AudioHeaderInspectorPort {
    return {
      inspectHeader: ({ assetId, extension, header }) =>
        Promise.resolve(inspectAudioHeader(assetId, extension, header)),
      dispose: () => undefined,
    };
  }

  it('inspects local wav headers without decoding the full file', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('wav');

    registry.register(
      audioAsset.id,
      new File([blobPart(wavHeader())], audioAsset.sourceName, { type: 'audio/wav' }),
    );

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      registry,
      createHeaderInspector,
    ).inspect([audioAsset]);

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

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      registry,
      createHeaderInspector,
    ).inspect([audioAsset]);

    expect(inspection?.container).toBe('mp3');
    expect(inspection?.codec).toBe('mp3');
    expect(inspection?.sampleRateHz).toBe(44100);
    expect(inspection?.bitrateKbps).toBe(128);
    expect(inspection?.channels).toBe(2);
    expect(inspection?.warnings).toEqual([]);
  });

  it('extracts basic id3 metadata when present', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('mp3');
    const apicFrame = new Uint8Array([
      0x41, 0x50, 0x49, 0x43, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x02,
    ]);
    const bytes = new Uint8Array(10 + apicFrame.length + 4);
    bytes.set([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, apicFrame.length], 0);
    bytes.set(apicFrame, 10);
    bytes.set([0xff, 0xfb, 0x90, 0x64], 10 + apicFrame.length);
    registry.register(audioAsset.id, new File([blobPart(bytes)], audioAsset.sourceName));
    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      registry,
      createHeaderInspector,
    ).inspect([audioAsset]);
    expect(inspection?.metadata.artworkPresent).toBe(true);
  });

  it('falls back to the asset extension when the original file is unavailable', async () => {
    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      createImportedFileRegistry(),
      createHeaderInspector,
    ).inspect([asset('flac')]);

    expect(inspection?.container).toBe('flac');
    expect(inspection?.codec).toBe('flac');
    expect(inspection?.warnings).toContainEqual(
      expect.objectContaining({ type: 'inspection_incomplete' }),
    );
  });

  it('extracts basic mp4 metadata when present', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('m4a');

    registry.register(
      audioAsset.id,
      new File(
        [
          blobPart(
            concat(
              new Uint8Array([0, 0, 0, 12]),
              new TextEncoder().encode('ftypM4A '),
              createContainerAtom(
                'ilst',
                concat(createMp4TextAtom('©nam', 'Song'), createMp4TextAtom('©ART', 'Artist')),
              ),
            ),
          ),
        ],
        audioAsset.sourceName,
      ),
    );

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      registry,
      createHeaderInspector,
    ).inspect([audioAsset]);

    expect(inspection?.metadata.title).toBe('Song');
    expect(inspection?.metadataAssessment.sourceFormat).toBe('mp4');
  });

  it('reads and inspects headers sequentially', async () => {
    const registry = createImportedFileRegistry();
    const first = asset('wav');
    const secondId = createAudioAssetId('asset-wav-2');
    if (!secondId.ok) throw new Error('Invalid fixture.');
    const second = { ...asset('wav'), id: secondId.value, sourceName: 'track-2.wav' };
    registry.register(first.id, new File([blobPart(wavHeader())], first.sourceName));
    registry.register(second.id, new File([blobPart(wavHeader())], second.sourceName));
    let active = 0;
    let maximumActive = 0;
    const headerInspector: AudioHeaderInspectorPort = {
      inspectHeader: async ({ assetId, extension, header }) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve();
        active -= 1;
        return inspectAudioHeader(assetId, extension, header);
      },
      dispose: () => undefined,
    };

    const inspections = await createBrowserLocalAudioInspectionAdapter(
      registry,
      () => headerInspector,
    ).inspect([first, second]);

    expect(inspections).toHaveLength(2);
    expect(maximumActive).toBe(1);
  });

  it('marks malformed wav chunks incomplete instead of throwing', async () => {
    const registry = createImportedFileRegistry();
    const audioAsset = asset('wav');
    const malformed = wavHeader();
    new DataView(malformed.buffer).setUint32(16, 4, true);
    registry.register(audioAsset.id, new File([blobPart(malformed)], audioAsset.sourceName));

    const [inspection] = await createBrowserLocalAudioInspectionAdapter(
      registry,
      createHeaderInspector,
    ).inspect([audioAsset]);

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

function createMp4TextAtom(type: string, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  const dataPayload = concat(new Uint8Array(8), valueBytes);
  const dataAtom = concat(uint32BigEndian(8 + dataPayload.length), ascii('data'), dataPayload);
  return concat(uint32BigEndian(8 + dataAtom.length), latin1(type), dataAtom);
}

function createContainerAtom(type: string, contents: Uint8Array): Uint8Array {
  return concat(uint32BigEndian(8 + contents.length), ascii(type), contents);
}

function uint32BigEndian(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function ascii(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function latin1(value: string): Uint8Array {
  return Uint8Array.from([...value].map((character) => character.charCodeAt(0)));
}

function concat(...arrays: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(arrays.reduce((total, array) => total + array.length, 0));
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}
