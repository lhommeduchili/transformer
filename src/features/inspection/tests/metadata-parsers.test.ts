import { describe, expect, it } from 'vitest';
import {
  parseId3Metadata,
  parseMp4Metadata,
  parseVorbisMetadata,
} from '../infrastructure/metadata-parsers';

describe('metadata parsers', () => {
  it('parses id3 metadata fields', () => {
    const metadata = parseId3Metadata(createId3Tag());

    expect(metadata.title).toBe('Song');
    expect(metadata.artist).toBe('Artist');
    expect(metadata.album).toBe('Album');
    expect(metadata.artworkPresent).toBe(true);
  });

  it('parses vorbis comment fields', () => {
    const metadata = parseVorbisMetadata(
      new TextEncoder().encode('TITLE=Song\nARTIST=Artist\nALBUM=Album'),
    );
    expect(metadata.title).toBe('Song');
    expect(metadata.artist).toBe('Artist');
  });

  it('parses mp4 metadata fields', () => {
    const metadata = parseMp4Metadata(new TextEncoder().encode('©nam Song ©ART Artist ©alb Album'));

    expect(metadata.title).toContain('Song');
    expect(metadata.artist).toContain('Artist');
  });
});

function createId3Tag(): Uint8Array {
  const title = createTextFrame('TIT2', 'Song');
  const artist = createTextFrame('TPE1', 'Artist');
  const album = createTextFrame('TALB', 'Album');
  const apic = createFrame('APIC', new Uint8Array([0, 1, 2]));

  const body = concat(title, artist, album, apic);
  const header = new Uint8Array([
    0x49,
    0x44,
    0x33,
    0x03,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    body.length,
  ]);

  return concat(header, body);
}

function createTextFrame(id: string, value: string): Uint8Array {
  return createFrame(id, new Uint8Array([3, ...new TextEncoder().encode(value)]));
}

function createFrame(id: string, payload: Uint8Array): Uint8Array {
  return concat(
    new TextEncoder().encode(id),
    new Uint8Array([0, 0, 0, payload.length, 0, 0]),
    payload,
  );
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}
