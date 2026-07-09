export const supportedAudioExtensions = [
  'mp3',
  'wav',
  'aiff',
  'aif',
  'flac',
  'm4a',
  'aac',
  'ogg',
] as const;

export type SupportedAudioExtension = (typeof supportedAudioExtensions)[number];

export function extensionFromName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');

  if (lastDot < 0 || lastDot === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDot + 1).toLowerCase();
}

export function isSupportedAudioExtension(extension: string): extension is SupportedAudioExtension {
  return supportedAudioExtensions.includes(extension.toLowerCase() as SupportedAudioExtension);
}
