export type AudioContainer = 'mp3' | 'wav' | 'aiff' | 'flac' | 'm4a' | 'ogg' | 'unknown';

export type AudioCodec =
  | 'mp3'
  | 'pcm_s16le'
  | 'pcm_s16be'
  | 'pcm_s24le'
  | 'aac'
  | 'flac'
  | 'vorbis'
  | 'unknown';

export type ChannelMode = 'mono' | 'stereo' | 'source';
