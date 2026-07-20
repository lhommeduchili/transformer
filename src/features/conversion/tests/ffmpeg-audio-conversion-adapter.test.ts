import { describe, expect, it, vi } from 'vitest';

import { createAudioAssetId } from '../../../shared/domain/ids';
import type { AudioConversionProgressEvent } from '../application/conversion-progress-events';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { createFfmpegAudioConversionAdapter } from '../infrastructure/ffmpeg-audio-conversion-adapter';
import type { ConversionWorkerRuntime } from '../infrastructure/worker-runtime-adapter';
import type {
  ConversionWorkerCommand,
  ConversionWorkerEvent,
} from '../workers/conversion-worker-protocol';

describe('FFmpeg audio conversion adapter', () => {
  it('correlates progress independently for consecutive conversions', async () => {
    const listeners = new Set<(event: ConversionWorkerEvent) => void>();
    const commands: ConversionWorkerCommand[] = [];
    const runtime: ConversionWorkerRuntime = {
      post: (command) => commands.push(command),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      terminate: vi.fn(),
    };
    const emit = (event: ConversionWorkerEvent) => {
      for (const listener of listeners) listener(event);
    };
    const adapter = createFfmpegAudioConversionAdapter(runtime);
    const assetId = createAudioAssetId('asset-1');
    if (!assetId.ok) throw new Error('Invalid fixture.');
    const progressEvents: AudioConversionProgressEvent[] = [];
    const progress = (event: AudioConversionProgressEvent) => progressEvents.push(event);
    const command = {
      assetId: assetId.value,
      inputName: 'Track.flac',
      outputName: 'Track.aiff',
      preset: getDefaultPreset(),
    };

    const first = adapter.convert(command, new Uint8Array([1]), progress);
    const firstCommand = commands[0];
    if (firstCommand?.type !== 'ConvertAudio') throw new Error('Expected conversion command.');
    emit({ type: 'ConversionProgressed', commandId: firstCommand.commandId, ratio: 0.25 });
    emit({
      type: 'ConversionCompleted',
      commandId: firstCommand.commandId,
      outputName: 'Track.aiff',
      outputData: new Uint8Array([2]),
      mimeType: 'audio/aiff',
    });
    await first;

    const second = adapter.convert(command, new Uint8Array([3]), progress);
    const secondCommand = commands[1];
    if (secondCommand?.type !== 'ConvertAudio') throw new Error('Expected conversion command.');
    emit({ type: 'ConversionProgressed', commandId: firstCommand.commandId, ratio: 0.5 });
    emit({ type: 'ConversionProgressed', commandId: secondCommand.commandId, ratio: 0.75 });
    emit({
      type: 'ConversionCompleted',
      commandId: secondCommand.commandId,
      outputName: 'Track.aiff',
      outputData: new Uint8Array([4]),
      mimeType: 'audio/aiff',
    });
    await second;

    expect(progressEvents.map((event) => event.ratio)).toEqual([0.25, 0.75]);

    adapter.cancel();
    expect(commands).toHaveLength(2);
  });

  it('posts cancellation only while a conversion is active', async () => {
    const listeners = new Set<(event: ConversionWorkerEvent) => void>();
    const commands: ConversionWorkerCommand[] = [];
    const runtime: ConversionWorkerRuntime = {
      post: (command) => commands.push(command),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      terminate: vi.fn(),
    };
    const adapter = createFfmpegAudioConversionAdapter(runtime);
    const assetId = createAudioAssetId('asset-1');
    if (!assetId.ok) throw new Error('Invalid fixture.');
    const pending = adapter.convert(
      {
        assetId: assetId.value,
        inputName: 'Track.flac',
        outputName: 'Track.aiff',
        preset: getDefaultPreset(),
      },
      new Uint8Array([1]),
      () => undefined,
    );
    const convertCommand = commands[0];
    if (convertCommand?.type !== 'ConvertAudio') throw new Error('Expected conversion command.');

    adapter.cancel();

    expect(commands[1]).toEqual({
      type: 'CancelConversion',
      commandId: convertCommand.commandId,
    });
    for (const listener of listeners) {
      listener({ type: 'ConversionCancelled', commandId: convertCommand.commandId });
    }
    await expect(pending).rejects.toThrow('Conversion cancelled.');

    adapter.cancel();
    expect(commands).toHaveLength(2);
  });
});
