import type { ConversionPreset } from '../../presets/domain/conversion-preset';

export type FfmpegArgPlan = {
  readonly inputName: string;
  readonly outputName: string;
  readonly args: readonly string[];
  readonly mimeType: string;
};

export function buildFfmpegArgs(
  preset: ConversionPreset,
  inputName: string,
  outputName: string,
): FfmpegArgPlan {
  const args = ['-i', inputName, ...streamSelectionArgs(preset)];

  if (preset.sampleRateHz !== undefined) {
    args.push('-ar', String(preset.sampleRateHz));
  }

  if (preset.channels === 'stereo') {
    args.push('-ac', '2');
  } else if (preset.channels === 'mono') {
    args.push('-ac', '1');
  }

  args.push(...codecArgs(preset));
  args.push(...artworkArgs(preset));
  args.push(...metadataArgs(preset));
  args.push(outputName);

  return {
    inputName,
    outputName,
    args,
    mimeType: mimeTypeForPreset(preset),
  };
}

function streamSelectionArgs(preset: ConversionPreset): readonly string[] {
  if (shouldPreserveEmbeddedArtwork(preset)) {
    return ['-map', '0:a:0', '-map', '0:v?'];
  }

  return ['-vn'];
}

function codecArgs(preset: ConversionPreset): readonly string[] {
  if (preset.targetContainer === 'aiff') {
    return ['-f', 'aiff', '-c:a', 'pcm_s16be'];
  }

  if (preset.targetContainer === 'mp3') {
    return ['-f', 'mp3', '-c:a', 'libmp3lame', '-b:a', `${preset.bitrateKbps ?? 320}k`];
  }

  if (preset.targetContainer === 'wav') {
    return ['-f', 'wav', '-c:a', 'pcm_s16le'];
  }

  return ['-c:a', preset.targetCodec];
}

function artworkArgs(preset: ConversionPreset): readonly string[] {
  if (!shouldPreserveEmbeddedArtwork(preset)) {
    return [];
  }

  return ['-c:v', 'copy', '-disposition:v', 'attached_pic'];
}

function shouldPreserveEmbeddedArtwork(preset: ConversionPreset): boolean {
  return (
    preset.metadataPolicy.mode === 'preserve' &&
    (preset.targetContainer === 'aiff' || preset.targetContainer === 'mp3')
  );
}

function metadataArgs(preset: ConversionPreset): readonly string[] {
  if (preset.metadataPolicy.mode === 'preserve') {
    if (preset.targetContainer === 'aiff') {
      return ['-map_metadata', '0', '-write_id3v2', '1'];
    }

    return ['-map_metadata', '0'];
  }

  return ['-map_metadata', '-1'];
}

function mimeTypeForPreset(preset: ConversionPreset): string {
  switch (preset.targetContainer) {
    case 'aiff':
      return 'audio/aiff';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'flac':
      return 'audio/flac';
    case 'm4a':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    case 'unknown':
      return 'application/octet-stream';
  }
}
