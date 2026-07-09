import { describe, expect, it } from 'vitest';

import { getDefaultPreset, builtInPresets } from '../../presets/domain/built-in-presets';
import { buildFfmpegArgs } from '../application/build-ffmpeg-args';

describe('buildFfmpegArgs', () => {
  it('builds CDJ/Rekordbox-safe AIFF args with big-endian PCM', () => {
    const plan = buildFfmpegArgs(getDefaultPreset(), 'input.flac', 'output.aiff');

    expect(plan.args).toEqual([
      '-i',
      'input.flac',
      '-map',
      '0:a:0',
      '-map',
      '0:v?',
      '-ar',
      '44100',
      '-ac',
      '2',
      '-f',
      'aiff',
      '-c:a',
      'pcm_s16be',
      '-c:v',
      'copy',
      '-disposition:v',
      'attached_pic',
      '-map_metadata',
      '0',
      '-write_id3v2',
      '1',
      'output.aiff',
    ]);
    expect(plan.mimeType).toBe('audio/aiff');
  });

  it('builds MP3 320 args for the secondary DJ preset', () => {
    const preset = builtInPresets.find((candidate) => candidate.targetContainer === 'mp3');
    if (preset === undefined) throw new Error('Missing MP3 preset.');

    const plan = buildFfmpegArgs(preset, 'input.wav', 'output.mp3');

    expect(plan.args).toContain('libmp3lame');
    expect(plan.args).toContain('320k');
    expect(plan.args).toContain('0:v?');
    expect(plan.args).toContain('attached_pic');
    expect(plan.args).toContain('-map_metadata');
    expect(plan.args).toContain('0');
    expect(plan.mimeType).toBe('audio/mpeg');
  });
});
