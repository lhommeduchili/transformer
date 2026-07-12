import type { TrackMetadata } from '../domain/track-inspection';

export function parseId3Metadata(header: Uint8Array): TrackMetadata {
  const frames = parseId3Frames(header);

  return {
    ...(frames.get('TIT2') ? { title: frames.get('TIT2') } : {}),
    ...(frames.get('TPE1') ? { artist: frames.get('TPE1') } : {}),
    ...(frames.get('TALB') ? { album: frames.get('TALB') } : {}),
    ...(frames.get('TCON') ? { genre: frames.get('TCON') } : {}),
    ...(frames.get('TRCK') ? { trackNumber: frames.get('TRCK') } : {}),
    ...(frames.get('TDRC') ? { year: frames.get('TDRC') } : {}),
    artworkPresent: frames.has('APIC'),
  };
}

export function parseVorbisMetadata(header: Uint8Array): TrackMetadata {
  const text = new TextDecoder().decode(header);
  return buildMetadata({
    title: extractValue(text, 'TITLE='),
    artist: extractValue(text, 'ARTIST='),
    album: extractValue(text, 'ALBUM='),
    genre: extractValue(text, 'GENRE='),
    trackNumber: extractValue(text, 'TRACKNUMBER='),
  });
}

export function parseMp4Metadata(header: Uint8Array): TrackMetadata {
  const text = new TextDecoder().decode(header);

  return buildMetadata({
    title: extractMp4Value(text, '©nam'),
    artist: extractMp4Value(text, '©ART'),
    album: extractMp4Value(text, '©alb'),
  });
}

function parseId3Frames(header: Uint8Array): Map<string, string> {
  const frames = new Map<string, string>();

  if (header.byteLength < 10 || String.fromCharCode(...header.slice(0, 3)) !== 'ID3') {
    return frames;
  }

  const version = header[3] ?? 0;
  const tagSize = readSyncSafeInteger(header, 6);
  const tagEnd = Math.min(header.byteLength, 10 + tagSize);
  let offset = 10;

  while (offset + 10 <= tagEnd) {
    const frameId = String.fromCharCode(...header.slice(offset, offset + 4));

    if (!/^[A-Z0-9]{4}$/.test(frameId)) {
      break;
    }

    const frameSize =
      version >= 4 ? readSyncSafeInteger(header, offset + 4) : readUint32(header, offset + 4);

    if (frameSize <= 0 || offset + 10 + frameSize > tagEnd) {
      break;
    }

    const payload = header.slice(offset + 10, offset + 10 + frameSize);

    if (frameId === 'APIC') {
      frames.set('APIC', 'present');
    } else if (frameId.startsWith('T')) {
      const value = decodeTextFrame(payload);
      if (value) {
        frames.set(frameId, value);
      }
    }

    offset += 10 + frameSize;
  }

  return frames;
}

function decodeTextFrame(payload: Uint8Array): string | undefined {
  if (payload.byteLength === 0) return undefined;

  const encoding = payload[0];
  const data = payload.slice(1);

  const text =
    encoding === 1
      ? new TextDecoder('utf-16').decode(data)
      : new TextDecoder(encoding === 3 ? 'utf-8' : 'latin1').decode(data);

  const normalized = text.replace(/\0/g, '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function buildMetadata(values: Record<string, string | undefined>): TrackMetadata {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}

function readSyncSafeInteger(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 21) |
    ((bytes[offset + 1] ?? 0) << 14) |
    ((bytes[offset + 2] ?? 0) << 7) |
    (bytes[offset + 3] ?? 0)
  );
}

function extractValue(text: string, key: string): string | undefined {
  return text.match(new RegExp(`${key}([^\u0000\r\n]+)`))?.[1]?.trim();
}

function extractMp4Value(text: string, atom: string): string | undefined {
  const index = text.indexOf(atom);

  if (index < 0) {
    return undefined;
  }

  return text
    .slice(index + atom.length, index + atom.length + 128)
    .replace(/[^\x20-\x7E]+/g, ' ')
    .trim()
    .split('  ')[0]
    ?.trim();
}
