import { describe, expect, it, vi } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createFileSizeBytes, createProgressPercent } from '../../../shared/domain/numbers';
import type { AudioConversionPort } from '../../conversion/application/audio-conversion-port';
import type { AudioConversionCommand } from '../../conversion/application/conversion-command';
import { createImportedFileRegistry } from '../../import/application/imported-file-registry';
import type { AudioAsset } from '../../import/domain/audio-asset';
import type { OutputWriterPort } from '../../output/application/output-writer-port';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { previewOutputFilenames } from '../../presets/domain/output-filename-preview';
import { planConversionQueue } from '../application/plan-conversion-queue';
import { startQueue } from '../domain/conversion-queue';
import { createConversionOutputQueueExecutor } from '../infrastructure/conversion-output-queue-executor';

function clock(): ClockPort {
  const now = createDateTimeIso('2026-06-24T00:00:00.000Z');
  if (!now.ok) throw new Error('Invalid fixture.');
  return { now: () => now.value };
}

function asset(): AudioAsset {
  const id = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1000);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');
  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');
  return {
    id: id.value,
    sourceName: 'Track.flac',
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

function assetAt(index: number): AudioAsset {
  const id = createAudioAssetId(`asset-${index}`);
  const sizeBytes = createFileSizeBytes(1000 + index);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');
  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');
  return {
    id: id.value,
    sourceName: `Track ${index}.flac`,
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

function runningQueue(sourceAsset: AudioAsset) {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  if (!queueId.ok || !jobId.ok) throw new Error('Invalid fixture.');
  const preset = getDefaultPreset();
  const planned = planConversionQueue(previewOutputFilenames([sourceAsset], preset), preset, {
    queueIdGenerator: { nextId: () => queueId.value },
    jobIdGenerator: { nextId: () => jobId.value },
    clock: clock(),
  });
  if (!planned.ok) throw new Error('Invalid fixture.');
  const running = startQueue(planned.value, clock().now());
  if (!running.ok) throw new Error('Invalid fixture.');
  return { queue: running.value, preset };
}

function runningQueueForAssets(sourceAssets: readonly AudioAsset[]) {
  let nextJobId = 0;
  const queueId = createQueueId('queue-1');
  if (!queueId.ok) throw new Error('Invalid fixture.');
  const preset = getDefaultPreset();
  const planned = planConversionQueue(previewOutputFilenames(sourceAssets, preset), preset, {
    queueIdGenerator: { nextId: () => queueId.value },
    jobIdGenerator: {
      nextId: () => {
        nextJobId += 1;
        const jobId = createConversionJobId(`job-${nextJobId}`);
        if (!jobId.ok) throw new Error('Invalid fixture.');
        return jobId.value;
      },
    },
    clock: clock(),
  });
  if (!planned.ok) throw new Error('Invalid fixture.');
  const running = startQueue(planned.value, clock().now());
  if (!running.ok) throw new Error('Invalid fixture.');
  return { queue: running.value, preset };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

describe('conversion output queue executor', () => {
  it('reads the active file, converts it, writes output, and completes', async () => {
    const sourceAsset = asset();
    const registry = createImportedFileRegistry();
    const progress = createProgressPercent(100);
    if (!progress.ok) throw new Error('Invalid fixture.');
    registry.register(sourceAsset.id, new File(['fake audio'], 'Track.flac'));

    const converter: AudioConversionPort = {
      convert: (command, _input, onProgress) => {
        onProgress({ assetId: command.assetId, percent: progress.value });
        return Promise.resolve({
          assetId: command.assetId,
          outputName: command.outputName,
          data: new Uint8Array([1, 2, 3]),
          mimeType: 'audio/aiff',
        });
      },
      cancel: () => undefined,
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: (file) =>
        Promise.resolve({
          outputName: file.name,
          destination: { type: 'download_fallback', name: 'Browser downloads' },
        }),
    };
    const { queue, preset } = runningQueue(sourceAsset);

    const completed = await new Promise<string>((resolve, reject) => {
      createConversionOutputQueueExecutor(converter, clock(), {
        preset,
        fileRegistry: registry,
        outputWriter: writer,
      }).execute(queue, {
        onSnapshot: () => undefined,
        onComplete: (snapshot) => resolve(snapshot.queue.status),
        onError: reject,
      });
    });

    expect(completed).toBe('completed');
  });

  it('records the filename resolved by the output writer', async () => {
    const sourceAsset = asset();
    const registry = createImportedFileRegistry();
    registry.register(sourceAsset.id, new File(['fake audio'], 'Track.flac'));
    const converter: AudioConversionPort = {
      convert: (command) =>
        Promise.resolve({
          assetId: command.assetId,
          outputName: command.outputName,
          data: new Uint8Array([1, 2, 3]),
          mimeType: 'audio/aiff',
        }),
      cancel: () => undefined,
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: () =>
        Promise.resolve({
          outputName: 'Track-2.aiff',
          destination: { type: 'download_fallback', name: 'Browser downloads' },
        }),
    };
    const { queue, preset } = runningQueue(sourceAsset);

    const outputName = await new Promise<string>((resolve, reject) => {
      createConversionOutputQueueExecutor(converter, clock(), {
        preset,
        fileRegistry: registry,
        outputWriter: writer,
      }).execute(queue, {
        onSnapshot: () => undefined,
        onComplete: (snapshot) => resolve(snapshot.queue.jobs[0]?.outputName ?? ''),
        onError: reject,
      });
    });

    expect(outputName).toBe('Track-2.aiff');
  });

  it('does not read the next file until the active conversion finishes', async () => {
    const firstAsset = assetAt(1);
    const secondAsset = assetAt(2);
    const registry = createImportedFileRegistry();
    const reads = new Map<string, number>();
    const firstConversion = deferred<{
      readonly assetId: typeof firstAsset.id;
      readonly outputName: string;
      readonly data: Uint8Array;
      readonly mimeType: string;
    }>();

    function readTrackedFile(name: string): File {
      return {
        name,
        arrayBuffer: () => {
          reads.set(name, (reads.get(name) ?? 0) + 1);
          return Promise.resolve(new Uint8Array([1, 2, 3]).buffer);
        },
      } as File;
    }

    registry.register(firstAsset.id, readTrackedFile('Track 1.flac'));
    registry.register(secondAsset.id, readTrackedFile('Track 2.flac'));

    const converter: AudioConversionPort = {
      convert: (command) => {
        if (command.assetId === firstAsset.id) {
          return firstConversion.promise;
        }

        return Promise.resolve({
          assetId: command.assetId,
          outputName: command.outputName,
          data: new Uint8Array([4, 5, 6]),
          mimeType: 'audio/aiff',
        });
      },
      cancel: () => undefined,
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: (file) =>
        Promise.resolve({
          outputName: file.name,
          destination: { type: 'download_fallback', name: 'Browser downloads' },
        }),
    };
    const { queue, preset } = runningQueueForAssets([firstAsset, secondAsset]);
    const completed = new Promise<string>((resolve, reject) => {
      createConversionOutputQueueExecutor(converter, clock(), {
        preset,
        fileRegistry: registry,
        outputWriter: writer,
      }).execute(queue, {
        onSnapshot: () => undefined,
        onComplete: (snapshot) => resolve(snapshot.queue.status),
        onError: reject,
      });
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(reads.get('Track 1.flac')).toBe(1);
    expect(reads.get('Track 2.flac')).toBeUndefined();

    firstConversion.resolve({
      assetId: firstAsset.id,
      outputName: 'Track 1.aiff',
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/aiff',
    });

    await expect(completed).resolves.toBe('completed');
    expect(reads.get('Track 2.flac')).toBe(1);
  });

  it('pauses after the active job without starting a concurrent run', async () => {
    const firstAsset = assetAt(1);
    const secondAsset = assetAt(2);
    const registry = createImportedFileRegistry();
    const firstConversion = deferred<{
      readonly assetId: typeof firstAsset.id;
      readonly outputName: string;
      readonly data: Uint8Array;
      readonly mimeType: string;
    }>();
    const conversionStarted = deferred<void>();
    const convertedAssetIds: string[] = [];

    registry.register(firstAsset.id, new File(['first'], 'Track 1.flac'));
    registry.register(secondAsset.id, new File(['second'], 'Track 2.flac'));

    const convert = (command: AudioConversionCommand) => {
      convertedAssetIds.push(command.assetId);
      if (command.assetId === firstAsset.id) {
        conversionStarted.resolve();
        return firstConversion.promise;
      }

      return Promise.resolve({
        assetId: command.assetId,
        outputName: command.outputName,
        data: new Uint8Array([4, 5, 6]),
        mimeType: 'audio/aiff',
      });
    };
    const converter: AudioConversionPort = {
      convert: vi.fn(convert),
      cancel: () => undefined,
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: (file) =>
        Promise.resolve({
          outputName: file.name,
          destination: { type: 'download_fallback', name: 'Browser downloads' },
        }),
    };
    const { queue, preset } = runningQueueForAssets([firstAsset, secondAsset]);
    let completed = false;
    const completion = deferred<readonly string[]>();
    const statuses: string[] = [];
    const controls = createConversionOutputQueueExecutor(converter, clock(), {
      preset,
      fileRegistry: registry,
      outputWriter: writer,
    }).execute(queue, {
      onSnapshot: (snapshot) => statuses.push(snapshot.queue.status),
      onComplete: (snapshot) => {
        completed = true;
        completion.resolve(snapshot.queue.jobs.map((job) => job.status));
      },
      onError: completion.reject,
    });

    await conversionStarted.promise;
    controls.pause();
    firstConversion.resolve({
      assetId: firstAsset.id,
      outputName: 'Track 1.aiff',
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/aiff',
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(statuses).toContain('paused');
    expect(convertedAssetIds).toEqual([firstAsset.id]);
    expect(completed).toBe(false);

    controls.resume();

    await expect(completion.promise).resolves.toEqual(['completed', 'completed']);
    expect(convertedAssetIds).toEqual([firstAsset.id, secondAsset.id]);
  });

  it('cancels the active job and continues with the next job', async () => {
    const firstAsset = assetAt(1);
    const secondAsset = assetAt(2);
    const registry = createImportedFileRegistry();
    const conversionStarted = deferred<void>();
    const firstConversion = deferred<{
      readonly assetId: typeof firstAsset.id;
      readonly outputName: string;
      readonly data: Uint8Array;
      readonly mimeType: string;
    }>();

    registry.register(firstAsset.id, new File(['first'], 'Track 1.flac'));
    registry.register(secondAsset.id, new File(['second'], 'Track 2.flac'));

    const converter: AudioConversionPort = {
      convert: (command) => {
        if (command.assetId === firstAsset.id) {
          conversionStarted.resolve();
          return firstConversion.promise;
        }

        return Promise.resolve({
          assetId: command.assetId,
          outputName: command.outputName,
          data: new Uint8Array([4, 5, 6]),
          mimeType: 'audio/aiff',
        });
      },
      cancel: () => firstConversion.reject(new Error('cancelled')),
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: (file) =>
        Promise.resolve({
          outputName: file.name,
          destination: { type: 'download_fallback', name: 'Browser downloads' },
        }),
    };
    const { queue, preset } = runningQueueForAssets([firstAsset, secondAsset]);
    let resolveCompleted!: (statuses: readonly string[]) => void;
    let rejectCompleted!: (error: unknown) => void;
    const completed = new Promise<readonly string[]>((resolve, reject) => {
      resolveCompleted = resolve;
      rejectCompleted = reject;
    });
    const controls = createConversionOutputQueueExecutor(converter, clock(), {
      preset,
      fileRegistry: registry,
      outputWriter: writer,
    }).execute(queue, {
      onSnapshot: () => undefined,
      onComplete: (snapshot) => resolveCompleted(snapshot.queue.jobs.map((job) => job.status)),
      onError: rejectCompleted,
    });

    await conversionStarted.promise;
    controls.cancelJob(queue.jobs[0]?.id ?? queue.jobs[1]!.id);

    await expect(completed).resolves.toEqual(['cancelled', 'completed']);
  });

  it('cancels unstarted jobs when the whole queue is cancelled', async () => {
    const firstAsset = assetAt(1);
    const secondAsset = assetAt(2);
    const registry = createImportedFileRegistry();
    const started = deferred<void>();
    const activeConversion = deferred<never>();
    registry.register(firstAsset.id, new File(['first'], 'Track 1.flac'));
    registry.register(secondAsset.id, new File(['second'], 'Track 2.flac'));
    const converter: AudioConversionPort = {
      convert: () => {
        started.resolve();
        return activeConversion.promise;
      },
      cancel: () => activeConversion.reject(new Error('cancelled')),
      dispose: () => undefined,
    };
    const writer: OutputWriterPort = {
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      chooseDestination: () =>
        Promise.resolve({ destination: { type: 'download_fallback', name: 'Browser downloads' } }),
      writeFile: () => Promise.reject(new Error('should not write')),
    };
    const { queue, preset } = runningQueueForAssets([firstAsset, secondAsset]);
    const completion = deferred<readonly string[]>();
    const controls = createConversionOutputQueueExecutor(converter, clock(), {
      preset,
      fileRegistry: registry,
      outputWriter: writer,
    }).execute(queue, {
      onSnapshot: () => undefined,
      onComplete: (snapshot) => completion.resolve(snapshot.queue.jobs.map((job) => job.status)),
      onError: completion.reject,
    });

    await started.promise;
    controls.cancel();

    await expect(completion.promise).resolves.toEqual(['cancelled', 'cancelled']);
  });
});
