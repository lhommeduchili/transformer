import {
  createBitrateKbps,
  createDurationMs,
  createSampleRateHz,
} from '../../../shared/domain/numbers';
import type { AudioAssetId } from '../../../shared/domain/ids';
import type { AudioCodec, AudioContainer } from '../../presets/domain/audio-format';
import type { CompatibilityWarning } from '../../presets/domain/compatibility-profile';
import {
  assessMetadata,
  createTrackInspection,
  type TrackInspection,
  type TrackMetadata,
} from '../domain/track-inspection';
import { parseId3Metadata, parseMp4Metadata, parseVorbisMetadata } from './metadata-parsers';

type HeaderInspection = {
  readonly container?: AudioContainer;
  readonly codec?: AudioCodec;
  readonly sampleRateHz?: number | undefined;
  readonly channels?: number | undefined;
  readonly bitrateKbps?: number | undefined;
  readonly durationMs?: number | undefined;
  readonly complete: boolean;
  readonly metadata?: TrackMetadata;
  readonly metadataFormat?: 'id3' | 'vorbis' | 'mp4' | 'unknown';
};

export function inspectAudioHeader(
  assetId: AudioAssetId,
  extension: string,
  header: Uint8Array,
): TrackInspection {
  const inspection = header.byteLength === 0 ? undefined : inspectHeader(header, extension);
  const fallbackFormat = formatFromExtension(extension);
  const sampleRateHz = createOptionalSampleRate(inspection?.sampleRateHz);
  const bitrateKbps = createOptionalBitrate(inspection?.bitrateKbps);
  const durationMs = createOptionalDuration(inspection?.durationMs);
  const isComplete = inspection?.complete === true;

  return createTrackInspection({
    assetId,
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(bitrateKbps === undefined ? {} : { bitrateKbps }),
    ...(sampleRateHz === undefined ? {} : { sampleRateHz }),
    ...(inspection?.channels === undefined ? {} : { channels: inspection.channels }),
    codec: inspection?.codec ?? fallbackFormat.codec,
    container: inspection?.container ?? fallbackFormat.container,
    metadata: inspection?.metadata ?? {},
    metadataAssessment: assessMetadata(
      inspection?.metadata ?? {},
      inspection?.metadataFormat ?? 'unknown',
    ),
    warnings: warningsForInspection(isComplete),
  });
}

function inspectHeader(header: Uint8Array, extension: string): HeaderInspection {
  if (matchesAscii(header, 0, 'RIFF') && matchesAscii(header, 8, 'WAVE')) {
    return inspectWave(header);
  }

  if (
    matchesAscii(header, 0, 'FORM') &&
    (matchesAscii(header, 8, 'AIFF') || matchesAscii(header, 8, 'AIFC'))
  ) {
    return inspectAiff(header);
  }

  if (matchesAscii(header, 0, 'fLaC')) {
    return inspectFlac(header);
  }

  if (matchesAscii(header, 4, 'ftyp')) {
    return inspectM4a(header);
  }

  if (extension === 'mp3' || matchesAscii(header, 0, 'ID3') || findMp3Frame(header) !== undefined) {
    return inspectMp3(header);
  }

  return { ...formatFromExtension(extension), complete: false };
}

function inspectWave(header: Uint8Array): HeaderInspection {
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  let offset = 12;
  let audioFormat: number | undefined;
  let channels: number | undefined;
  let sampleRateHz: number | undefined;
  let byteRate: number | undefined;
  let bitsPerSample: number | undefined;
  let dataBytes: number | undefined;

  while (offset + 8 <= header.byteLength) {
    const id = asciiAt(header, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;

    if (id === 'fmt ' && size >= 16 && chunkStart + 16 <= header.byteLength) {
      audioFormat = view.getUint16(chunkStart, true);
      channels = view.getUint16(chunkStart + 2, true);
      sampleRateHz = view.getUint32(chunkStart + 4, true);
      byteRate = view.getUint32(chunkStart + 8, true);
      bitsPerSample = view.getUint16(chunkStart + 14, true);
    }

    if (id === 'data') {
      dataBytes = size;
    }

    offset += 8 + size + (size % 2);
  }

  return {
    container: 'wav',
    codec:
      audioFormat === 1 && bitsPerSample === 24
        ? 'pcm_s24le'
        : audioFormat === 1
          ? 'pcm_s16le'
          : 'unknown',
    sampleRateHz,
    channels,
    durationMs:
      dataBytes !== undefined && byteRate !== undefined ? (dataBytes / byteRate) * 1000 : undefined,
    complete: audioFormat !== undefined && sampleRateHz !== undefined && channels !== undefined,
  };
}

function inspectAiff(header: Uint8Array): HeaderInspection {
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  let offset = 12;

  while (offset + 8 <= header.byteLength) {
    const id = asciiAt(header, offset, 4);
    const size = view.getUint32(offset + 4, false);
    const chunkStart = offset + 8;

    if (id === 'COMM' && size >= 18 && chunkStart + 18 <= header.byteLength) {
      const channels = view.getUint16(chunkStart, false);
      const sampleFrames = view.getUint32(chunkStart + 2, false);
      const bitsPerSample = view.getUint16(chunkStart + 6, false);
      const sampleRateHz = readExtended80(view, chunkStart + 8);

      return {
        container: 'aiff',
        codec: bitsPerSample === 24 ? 'unknown' : 'pcm_s16be',
        sampleRateHz,
        channels,
        durationMs: sampleRateHz === undefined ? undefined : (sampleFrames / sampleRateHz) * 1000,
        complete: sampleRateHz !== undefined,
      };
    }

    offset += 8 + size + (size % 2);
  }

  return { container: 'aiff', codec: 'pcm_s16be', complete: false };
}

function inspectFlac(header: Uint8Array): HeaderInspection {
  if (header.byteLength < 42) {
    return { container: 'flac', codec: 'flac', complete: false };
  }

  const blockType = byteAt(header, 4) & 0x7f;
  const blockLength = readUint24(header, 5);

  if (blockType !== 0 || blockLength < 34 || header.byteLength < 8 + blockLength) {
    return { container: 'flac', codec: 'flac', complete: false };
  }

  const streamInfo = 8;
  const sampleRateHz =
    (byteAt(header, streamInfo + 10) << 12) |
    (byteAt(header, streamInfo + 11) << 4) |
    (byteAt(header, streamInfo + 12) >> 4);
  const channels = ((byteAt(header, streamInfo + 12) >> 1) & 0x07) + 1;
  const totalSamples =
    (BigInt(byteAt(header, streamInfo + 13) & 0x0f) << 32n) |
    (BigInt(byteAt(header, streamInfo + 14)) << 24n) |
    (BigInt(byteAt(header, streamInfo + 15)) << 16n) |
    (BigInt(byteAt(header, streamInfo + 16)) << 8n) |
    BigInt(byteAt(header, streamInfo + 17));

  const metadata = parseVorbisMetadata(header);
  return {
    container: 'flac',
    codec: 'flac',
    sampleRateHz,
    channels,
    durationMs:
      sampleRateHz > 0 && totalSamples > 0n
        ? (Number(totalSamples) / sampleRateHz) * 1000
        : undefined,
    metadata,
    metadataFormat: 'vorbis',
    complete: sampleRateHz > 0 && channels > 0,
  };
}

function inspectM4a(header: Uint8Array): HeaderInspection {
  const metadata = parseMp4Metadata(header);

  return {
    container:
      matchesAscii(header, 8, 'M4A ') || matchesAscii(header, 8, 'isom') ? 'm4a' : 'unknown',
    codec: 'aac',
    metadata,
    metadataFormat: 'mp4',
    complete: false,
  };
}

function inspectMp3(header: Uint8Array): HeaderInspection {
  const frameOffset = findMp3Frame(header);
  if (frameOffset === undefined || frameOffset + 4 > header.byteLength) {
    return { container: 'mp3', codec: 'mp3', complete: false };
  }

  const byte1 = byteAt(header, frameOffset + 1);
  const byte2 = byteAt(header, frameOffset + 2);
  const byte3 = byteAt(header, frameOffset + 3);
  const versionBits = (byte1 >> 3) & 0x03;
  const layerBits = (byte1 >> 1) & 0x03;
  const bitrateIndex = byte2 >> 4;
  const sampleRateIndex = (byte2 >> 2) & 0x03;
  const channelMode = byte3 >> 6;
  const sampleRateHz = mp3SampleRate(versionBits, sampleRateIndex);
  const bitrateKbps = mp3Bitrate(versionBits, layerBits, bitrateIndex);

  return {
    container: 'mp3',
    codec: 'mp3',
    sampleRateHz,
    bitrateKbps,
    metadata: parseId3Metadata(header),
    metadataFormat: 'id3',
    channels: channelMode === 3 ? 1 : 2,
    complete: sampleRateHz !== undefined && bitrateKbps !== undefined,
  };
}

function findMp3Frame(header: Uint8Array): number | undefined {
  let offset =
    matchesAscii(header, 0, 'ID3') && header.byteLength >= 10 ? 10 + readId3Size(header) : 0;

  while (offset + 1 < header.byteLength) {
    if (byteAt(header, offset) === 0xff && (byteAt(header, offset + 1) & 0xe0) === 0xe0) {
      return offset;
    }
    offset += 1;
  }

  return undefined;
}

function mp3SampleRate(versionBits: number, sampleRateIndex: number): number | undefined {
  if (sampleRateIndex === 3) return undefined;

  const mpeg1: Record<number, number> = { 0: 44100, 1: 48000, 2: 32000 };
  const mpeg2: Record<number, number> = { 0: 22050, 1: 24000, 2: 16000 };
  const mpeg25: Record<number, number> = { 0: 11025, 1: 12000, 2: 8000 };

  if (versionBits === 3) return mpeg1[sampleRateIndex];
  if (versionBits === 2) return mpeg2[sampleRateIndex];
  if (versionBits === 0) return mpeg25[sampleRateIndex];
  return undefined;
}

function mp3Bitrate(
  versionBits: number,
  layerBits: number,
  bitrateIndex: number,
): number | undefined {
  if (bitrateIndex === 0 || bitrateIndex === 15 || layerBits !== 1) return undefined;

  const mpeg1Layer3 = [undefined, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const mpeg2Layer3 = [undefined, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

  return versionBits === 3 ? mpeg1Layer3[bitrateIndex] : mpeg2Layer3[bitrateIndex];
}

function readId3Size(header: Uint8Array): number {
  return (
    (byteAt(header, 6) << 21) |
    (byteAt(header, 7) << 14) |
    (byteAt(header, 8) << 7) |
    byteAt(header, 9)
  );
}

function readUint24(header: Uint8Array, offset: number): number {
  return (
    (byteAt(header, offset) << 16) | (byteAt(header, offset + 1) << 8) | byteAt(header, offset + 2)
  );
}

function byteAt(bytes: Uint8Array, offset: number): number {
  return bytes[offset] ?? 0;
}

function readExtended80(view: DataView, offset: number): number | undefined {
  const exponent = view.getUint16(offset, false) & 0x7fff;
  const highMantissa = view.getUint32(offset + 2, false);
  const lowMantissa = view.getUint32(offset + 6, false);

  if (exponent === 0 && highMantissa === 0 && lowMantissa === 0) return undefined;

  const mantissa = highMantissa * 2 ** 32 + lowMantissa;
  return Math.round(mantissa * 2 ** (exponent - 16383 - 63));
}

function matchesAscii(bytes: Uint8Array, offset: number, expected: string): boolean {
  return asciiAt(bytes, offset, expected.length) === expected;
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (offset + length > bytes.byteLength) return '';
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function createOptionalSampleRate(value: number | undefined) {
  if (value === undefined) return undefined;
  const sampleRate = createSampleRateHz(Math.round(value));
  return sampleRate.ok ? sampleRate.value : undefined;
}

function createOptionalBitrate(value: number | undefined) {
  if (value === undefined) return undefined;
  const bitrate = createBitrateKbps(Math.round(value));
  return bitrate.ok ? bitrate.value : undefined;
}

function createOptionalDuration(value: number | undefined) {
  if (value === undefined) return undefined;
  const duration = createDurationMs(Math.round(value));
  return duration.ok ? duration.value : undefined;
}

function formatFromExtension(extension: string): {
  readonly container: AudioContainer;
  readonly codec: AudioCodec;
} {
  switch (extension) {
    case 'mp3':
      return { container: 'mp3', codec: 'mp3' };
    case 'wav':
      return { container: 'wav', codec: 'pcm_s16le' };
    case 'aiff':
    case 'aif':
      return { container: 'aiff', codec: 'pcm_s16be' };
    case 'flac':
      return { container: 'flac', codec: 'flac' };
    case 'm4a':
    case 'aac':
      return { container: 'm4a', codec: 'aac' };
    case 'ogg':
      return { container: 'ogg', codec: 'vorbis' };
    default:
      return { container: 'unknown', codec: 'unknown' };
  }
}

function warningsForInspection(complete: boolean): readonly CompatibilityWarning[] {
  return complete
    ? []
    : [
        {
          type: 'inspection_incomplete',
          message: 'local header inspection could not read complete stream details for this file.',
        },
      ];
}
