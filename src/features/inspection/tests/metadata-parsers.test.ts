import { describe, expect, it } from 'vitest';
import { parseId3Metadata, parseVorbisMetadata } from '../infrastructure/metadata-parsers';

describe('metadata parsers', () => {
  it('parses id3 metadata fields', () => {
    const metadata = parseId3Metadata(
      new TextEncoder().encode('ID3 TIT2 Song TPE1 Artist TALB Album APIC'),
    );
    expect(metadata.artist).toContain('Artist');
    expect(metadata.artworkPresent).toBe(true);
  });

  it('parses vorbis comment fields', () => {
    const metadata = parseVorbisMetadata(
      new TextEncoder().encode('TITLE=Song\nARTIST=Artist\nALBUM=Album'),
    );
    expect(metadata.title).toBe('Song');
    expect(metadata.artist).toBe('Artist');
  });
});
