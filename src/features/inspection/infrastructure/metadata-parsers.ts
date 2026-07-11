import type { TrackMetadata } from '../domain/track-inspection';

export function parseId3Metadata(header: Uint8Array): TrackMetadata {
  const frames = parseId3Frames(header);
  return {
    title: frames.get('TIT2'),
    artist: frames.get('TPE1'),
    album: frames.get('TALB'),
    genre: frames.get('TCON'),
    trackNumber: frames.get('TRCK'),
    artworkPresent: frames.has('APIC'),
  };
}

export function parseVorbisMetadata(header: Uint8Array): TrackMetadata {
  const text = new TextDecoder().decode(header);
  return {
    title: extractValue(text, 'TITLE='),
    artist: extractValue(text, 'ARTIST='),
    album: extractValue(text, 'ALBUM='),
    genre: extractValue(text, 'GENRE='),
    trackNumber: extractValue(text, 'TRACKNUMBER='),
  };
}

function parseId3Frames(header: Uint8Array): Map<string, string> {
  const text = new TextDecoder().decode(header);
  const frames = new Map<string, string>();

  for (const frame of ['TIT2', 'TPE1', 'TALB', 'TCON', 'TRCK', 'APIC']) {
    const index = text.indexOf(frame);
    if (index < 0) continue;

    frames.set(
      frame,
      text.slice(index + frame.length + 1, index + frame.length + 64).replace(/\0/g, '').trim(),
    );
  }

  return frames;
}

function extractValue(text: string, key: string): string | undefined {
  return text.match(new RegExp(`${key}([^\u0000\r\n]+)`))?.[1]?.trim();
}
