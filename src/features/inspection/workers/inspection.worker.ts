import { inspectAudioHeader } from '../infrastructure/audio-header-inspector';
import type { InspectionWorkerCommand, InspectionWorkerEvent } from './inspection-worker-protocol';

function post(event: InspectionWorkerEvent) {
  self.postMessage(event);
}

self.addEventListener('message', (event: MessageEvent<InspectionWorkerCommand>) => {
  const command = event.data;

  if (command.type === 'Dispose') {
    self.close();
    return;
  }

  try {
    post({
      type: 'InspectionCompleted',
      requestId: command.requestId,
      inspection: inspectAudioHeader(command.assetId, command.extension, command.header),
    });
  } catch (error) {
    post({
      type: 'InspectionFailed',
      requestId: command.requestId,
      message: error instanceof Error ? error.message : 'Unknown inspection failure.',
    });
  }
});
