import { describe, expect, it, vi } from 'vitest';

import { createAudioAssetId } from '../../../shared/domain/ids';
import { assessMetadata, createTrackInspection } from '../domain/track-inspection';
import type { InspectionWorkerRuntime } from '../infrastructure/inspection-worker-runtime';
import { createWorkerAudioHeaderInspectorAdapter } from '../infrastructure/worker-audio-header-inspector-adapter';
import type {
  InspectionWorkerCommand,
  InspectionWorkerEvent,
} from '../workers/inspection-worker-protocol';

describe('worker audio header inspector adapter', () => {
  it('correlates worker results and transfers header ownership', async () => {
    const listeners = new Set<(event: InspectionWorkerEvent) => void>();
    const commands: InspectionWorkerCommand[] = [];
    const transfers: Transferable[][] = [];
    const runtime: InspectionWorkerRuntime = {
      post: (command, transfer = []) => {
        commands.push(command);
        transfers.push([...transfer]);
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      terminate: vi.fn(),
    };
    const assetId = createAudioAssetId('asset-1');
    if (!assetId.ok) throw new Error('Invalid fixture.');
    const header = new Uint8Array([1, 2, 3]);
    const adapter = createWorkerAudioHeaderInspectorAdapter(runtime);

    const pending = adapter.inspectHeader({ assetId: assetId.value, extension: 'flac', header });
    const command = commands[0];
    if (command?.type !== 'InspectAudioHeader') throw new Error('Expected inspection command.');
    const inspection = createTrackInspection({
      assetId: assetId.value,
      container: 'flac',
      codec: 'flac',
      metadata: {},
      metadataAssessment: assessMetadata({}, 'unknown'),
      warnings: [],
    });

    for (const listener of listeners) {
      listener({ type: 'InspectionCompleted', requestId: command.requestId, inspection });
    }

    await expect(pending).resolves.toEqual(inspection);
    expect(transfers[0]).toEqual([header.buffer]);
    expect(listeners).toHaveLength(0);
  });

  it('rejects serialized worker failures', async () => {
    const listeners = new Set<(event: InspectionWorkerEvent) => void>();
    const commands: InspectionWorkerCommand[] = [];
    const runtime: InspectionWorkerRuntime = {
      post: (command) => commands.push(command),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      terminate: vi.fn(),
    };
    const assetId = createAudioAssetId('asset-1');
    if (!assetId.ok) throw new Error('Invalid fixture.');
    const adapter = createWorkerAudioHeaderInspectorAdapter(runtime);
    const pending = adapter.inspectHeader({
      assetId: assetId.value,
      extension: 'flac',
      header: new Uint8Array([1]),
    });
    const command = commands[0];
    if (command?.type !== 'InspectAudioHeader') throw new Error('Expected inspection command.');

    for (const listener of listeners) {
      listener({ type: 'InspectionFailed', requestId: command.requestId, message: 'Bad header.' });
    }

    await expect(pending).rejects.toThrow('Bad header.');
  });

  it('rejects when the inspection worker crashes', async () => {
    const listeners = new Set<(event: InspectionWorkerEvent) => void>();
    const runtime: InspectionWorkerRuntime = {
      post: () => undefined,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      terminate: vi.fn(),
    };
    const assetId = createAudioAssetId('asset-1');
    if (!assetId.ok) throw new Error('Invalid fixture.');
    const pending = createWorkerAudioHeaderInspectorAdapter(runtime).inspectHeader({
      assetId: assetId.value,
      extension: 'flac',
      header: new Uint8Array([1]),
    });

    for (const listener of listeners) {
      listener({ type: 'WorkerFailed', message: 'Worker crashed.' });
    }

    await expect(pending).rejects.toThrow('Worker crashed.');
  });
});
