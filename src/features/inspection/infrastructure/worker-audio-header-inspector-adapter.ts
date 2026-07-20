import type {
  AudioHeaderInspectionInput,
  AudioHeaderInspectorPort,
} from '../application/audio-header-inspector-port';
import type { TrackInspection } from '../domain/track-inspection';
import type { InspectionWorkerRuntime } from './inspection-worker-runtime';

export function createWorkerAudioHeaderInspectorAdapter(
  runtime: InspectionWorkerRuntime,
): AudioHeaderInspectorPort {
  return {
    inspectHeader: (input) => inspectHeader(runtime, input),
    dispose: () => {
      runtime.post({ type: 'Dispose' });
      runtime.terminate();
    },
  };
}

function inspectHeader(
  runtime: InspectionWorkerRuntime,
  input: AudioHeaderInspectionInput,
): Promise<TrackInspection> {
  const requestId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const unsubscribe = runtime.subscribe((event) => {
      if ('requestId' in event && event.requestId !== requestId) return;

      unsubscribe();
      if (event.type === 'InspectionCompleted') {
        resolve(event.inspection);
      } else {
        reject(new Error(event.message));
      }
    });

    runtime.post(
      {
        type: 'InspectAudioHeader',
        requestId,
        assetId: input.assetId,
        extension: input.extension,
        header: input.header,
      },
      [input.header.buffer],
    );
  });
}
