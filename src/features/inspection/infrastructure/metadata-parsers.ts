import type { TrackMetadata } from '../domain/track-inspection';

export function parseId3Metadata(header: Uint8Array): TrackMetadata {
  const frames = parseId3Frames(header);

  return buildMetadata({
    title: frames.get('TIT2'),
    artist: frames.get('TPE1'),
    album: frames.get('TALB'),
    genre: frames.get('TCON'),
    trackNumber: frames.get('TRCK'),
    year: frames.get('TDRC'),
    artworkPresent: frames.has('APIC'),
  });
}

export function parseVorbisMetadata(header: Uint8Array): TrackMetadata {
  const comments = parseFlacVorbisComments(header);
  return buildMetadata({
    title: comments.get('TITLE'),
    artist: comments.get('ARTIST'),
    album: comments.get('ALBUM'),
    genre: comments.get('GENRE'),
    trackNumber: comments.get('TRACKNUMBER'),
    year: comments.get('DATE'),
  });
}

export function parseMp4Metadata(header: Uint8Array): TrackMetadata {
  return buildMetadata({
    title: findMp4TextValue(header, '©nam'),
    artist: findMp4TextValue(header, '©ART'),
    album: findMp4TextValue(header, '©alb'),
    genre: findMp4TextValue(header, '©gen'),
    year: findMp4TextValue(header, '©day'),
    artworkPresent: findAtom(header, 'covr') !== undefined ? true : undefined,
  });
}

function parseId3Frames(header: Uint8Array): Map<string, string> {
  const frames = new Map<string, string>();

  if (header.byteLength < 10 || String.fromCharCode(...header.slice(0, 3)) !== 'ID3') {
    return frames;
  }

  const version = header[3] ?? 0;
  if (version !== 3 && version !== 4) return frames;
  const flags = header[5] ?? 0;
  const tagSize = readSyncSafeInteger(header, 6);
  const tagEnd = Math.min(header.byteLength, 10 + tagSize);
  let offset = 10;

  if ((flags & 0x40) !== 0) {
    if (offset + 4 > tagEnd) return frames;
    const extendedSize =
      version === 4 ? readSyncSafeInteger(header, offset) : readUint32(header, offset);
    const bytesToSkip = version === 4 ? extendedSize : 4 + extendedSize;
    if (bytesToSkip < 4 || offset + bytesToSkip > tagEnd) return frames;
    offset += bytesToSkip;
  }

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

    const rawPayload = header.slice(offset + 10, offset + 10 + frameSize);
    const payload = (flags & 0x80) !== 0 ? removeUnsynchronization(rawPayload) : rawPayload;

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

  const text = decodeId3Text(data, encoding);
  if (text === undefined) return undefined;

  const normalized = text.replace(/\0/g, '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function decodeId3Text(data: Uint8Array, encoding: number | undefined): string | undefined {
  switch (encoding) {
    case 0:
      return new TextDecoder('windows-1252').decode(data);
    case 1:
      if (data.byteLength < 2) return undefined;
      if (data[0] === 0xfe && data[1] === 0xff) return decodeUtf16BigEndian(data.slice(2));
      if (data[0] === 0xff && data[1] === 0xfe) {
        return new TextDecoder('utf-16le').decode(data.slice(2));
      }
      return new TextDecoder('utf-16le').decode(data);
    case 2:
      return decodeUtf16BigEndian(data);
    case 3:
      return new TextDecoder('utf-8').decode(data);
    default:
      return undefined;
  }
}

function decodeUtf16BigEndian(data: Uint8Array): string {
  const evenLength = data.byteLength - (data.byteLength % 2);
  const littleEndian = new Uint8Array(evenLength);
  for (let offset = 0; offset < evenLength; offset += 2) {
    littleEndian[offset] = data[offset + 1] ?? 0;
    littleEndian[offset + 1] = data[offset] ?? 0;
  }
  return new TextDecoder('utf-16le').decode(littleEndian);
}

function removeUnsynchronization(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  for (let index = 0; index < data.byteLength; index += 1) {
    const value = data[index] ?? 0;
    result.push(value);
    if (value === 0xff && data[index + 1] === 0x00) index += 1;
  }
  return Uint8Array.from(result);
}

function buildMetadata(values: Record<string, string | boolean | undefined>): TrackMetadata {
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

function parseFlacVorbisComments(header: Uint8Array): Map<string, string> {
  const comments = new Map<string, string>();
  let offset = 0;
  if (header.byteLength >= 4 && new TextDecoder().decode(header.slice(0, 4)) === 'fLaC') {
    offset = 4;
  }
  while (offset + 4 <= header.byteLength) {
    const blockHeader = header[offset] ?? 0;
    const blockType = blockHeader & 0x7f;
    const blockLength = readUint24(header, offset + 1);
    const blockStart = offset + 4;
    const blockEnd = blockStart + blockLength;

    if (blockEnd > header.byteLength) return comments;
    if (blockType === 4) {
      parseVorbisCommentBlock(header.slice(blockStart, blockEnd), comments);
      return comments;
    }

    offset = blockEnd;
    if ((blockHeader & 0x80) !== 0) return comments;
  }

  parseVorbisCommentBlock(header, comments);

  return comments;
}

function parseVorbisCommentBlock(block: Uint8Array, comments: Map<string, string>) {
  let offset = 0;
  const vendorLength = readUint32LittleEndian(block, offset);
  offset += 4 + vendorLength;
  if (offset + 4 > block.byteLength) return;

  const count = readUint32LittleEndian(block, offset);
  offset += 4;
  for (let index = 0; index < count && offset + 4 <= block.byteLength; index += 1) {
    const length = readUint32LittleEndian(block, offset);
    offset += 4;
    if (offset + length > block.byteLength) return;

    const comment = new TextDecoder().decode(block.slice(offset, offset + length));
    offset += length;
    const separator = comment.indexOf('=');
    if (separator <= 0) continue;

    const key = comment.slice(0, separator).toUpperCase();
    const value = comment.slice(separator + 1).trim();
    if (value.length > 0 && !comments.has(key)) comments.set(key, value);
  }
}

function findMp4TextValue(bytes: Uint8Array, atomType: string): string | undefined {
  const atom = findAtom(bytes, atomType);
  if (atom === undefined) return undefined;
  const dataAtom = findAtom(bytes.slice(atom.start, atom.end), 'data');
  if (dataAtom === undefined) return undefined;
  const dataStart = atom.start + dataAtom.start + 16;
  const dataEnd = atom.start + dataAtom.end;
  if (dataStart > dataEnd || dataEnd > bytes.byteLength) return undefined;

  const value = new TextDecoder().decode(bytes.slice(dataStart, dataEnd)).replace(/\0/g, '').trim();
  return value.length > 0 ? value : undefined;
}

function findAtom(
  bytes: Uint8Array,
  atomType: string,
): { readonly start: number; readonly end: number } | undefined {
  const pending: { start: number; end: number }[] = [{ start: 0, end: bytes.byteLength }];

  while (pending.length > 0) {
    const range = pending.pop();
    if (range === undefined) break;

    for (const atom of atomsInRange(bytes, range.start, range.end)) {
      if (atom.type === atomType) return { start: atom.start, end: atom.end };
      if (containerAtomTypes.has(atom.type) || metadataItemAtomTypes.has(atom.type)) {
        const contentOffset = atom.type === 'meta' ? 4 : 0;
        pending.push({ start: atom.contentStart + contentOffset, end: atom.end });
      }
    }
  }

  return undefined;
}

const containerAtomTypes = new Set(['moov', 'udta', 'meta', 'ilst']);
const metadataItemAtomTypes = new Set(['©nam', '©ART', '©alb', '©gen', '©day', 'covr']);

function atomsInRange(
  bytes: Uint8Array,
  start: number,
  end: number,
): readonly {
  readonly type: string;
  readonly start: number;
  readonly contentStart: number;
  readonly end: number;
}[] {
  const atoms = [];
  let offset = start;

  while (offset + 8 <= end) {
    const size32 = readUint32(bytes, offset);
    const type = latin1At(bytes, offset + 4, 4);
    let headerSize = 8;
    let size = size32;

    if (size32 === 1) {
      if (offset + 16 > end) break;
      const extendedSize = readUint64(bytes, offset + 8);
      if (extendedSize === undefined) break;
      size = extendedSize;
      headerSize = 16;
    } else if (size32 === 0) {
      size = end - offset;
    }

    if (size < headerSize || offset + size > end) break;
    atoms.push({
      type,
      start: offset,
      contentStart: offset + headerSize,
      end: offset + size,
    });
    offset += size;
  }

  return atoms;
}

function readUint64(bytes: Uint8Array, offset: number): number | undefined {
  const high = readUint32(bytes, offset);
  const low = readUint32(bytes, offset + 4);
  const value = high * 2 ** 32 + low;
  return Number.isSafeInteger(value) ? value : undefined;
}

function latin1At(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readUint24(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 16) | ((bytes[offset + 1] ?? 0) << 8) | (bytes[offset + 2] ?? 0);
}

function readUint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}
