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

  it('parses ID3v2.4 extended headers and UTF-16BE text', () => {
    const title = createFrame('TIT2', new Uint8Array([2, 0, 83, 0, 111, 0, 110, 0, 103]), true);
    const extendedHeader = new Uint8Array([0, 0, 0, 6, 1, 0]);
    const body = concat(extendedHeader, title);
    const header = concat(
      new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x40]),
      syncSafe(body.length),
      body,
    );

    expect(parseId3Metadata(header).title).toBe('Song');
  });

  it('parses vorbis comment fields', () => {
    const metadata = parseVorbisMetadata(createFlacWithVorbisComments());
    expect(metadata.title).toBe('Song');
    expect(metadata.artist).toBe('Artist');
  });

  it('parses mp4 metadata fields', () => {
    const metadata = parseMp4Metadata(
      createContainerAtom(
        'ilst',
        concat(
          createMp4TextAtom('©nam', 'Song'),
          createMp4TextAtom('©ART', 'Artist'),
          createMp4TextAtom('©alb', 'Album'),
        ),
      ),
    );

    expect(metadata.title).toBe('Song');
    expect(metadata.artist).toBe('Artist');
    expect(metadata.album).toBe('Album');
  });

  it('does not treat atom-like bytes inside unknown payloads as metadata', () => {
    const marker = createMp4TextAtom('©nam', 'False title');
    const unknown = concat(uint32BigEndian(8 + marker.length), ascii('free'), marker);

    expect(parseMp4Metadata(unknown).title).toBeUndefined();
  });

  it('parses metadata through the expected nested MP4 atom hierarchy', () => {
    const title = createMp4TextAtom('©nam', 'Nested title');
    const ilst = createContainerAtom('ilst', title);
    const meta = createContainerAtom('meta', concat(new Uint8Array(4), ilst));
    const udta = createContainerAtom('udta', meta);
    const moov = createContainerAtom('moov', udta);

    expect(parseMp4Metadata(moov).title).toBe('Nested title');
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

function createFrame(id: string, payload: Uint8Array, syncSafeSize = false): Uint8Array {
  return concat(
    new TextEncoder().encode(id),
    syncSafeSize
      ? concat(syncSafe(payload.length), new Uint8Array([0, 0]))
      : new Uint8Array([0, 0, 0, payload.length, 0, 0]),
    payload,
  );
}

function syncSafe(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 21) & 0x7f,
    (value >>> 14) & 0x7f,
    (value >>> 7) & 0x7f,
    value & 0x7f,
  ]);
}

function createFlacWithVorbisComments(): Uint8Array {
  const vendor = new TextEncoder().encode('transformer');
  const comments = ['TITLE=Song', 'ARTIST=Artist', 'ALBUM=Album'].map((comment) =>
    new TextEncoder().encode(comment),
  );
  const block = concat(
    uint32LittleEndian(vendor.length),
    vendor,
    uint32LittleEndian(comments.length),
    ...comments.flatMap((comment) => [uint32LittleEndian(comment.length), comment]),
  );

  return concat(
    new TextEncoder().encode('fLaC'),
    new Uint8Array([
      0x84,
      (block.length >>> 16) & 0xff,
      (block.length >>> 8) & 0xff,
      block.length & 0xff,
    ]),
    block,
  );
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

function uint32LittleEndian(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
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
