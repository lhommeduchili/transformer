import type {
  InspectionWorkerCommand,
  InspectionWorkerEvent,
} from '../workers/inspection-worker-protocol';

export type InspectionWorkerRuntime = {
  readonly post: (command: InspectionWorkerCommand, transfer?: readonly Transferable[]) => void;
  readonly subscribe: (listener: (event: InspectionWorkerEvent) => void) => () => void;
  readonly terminate: () => void;
};

export function createInspectionWorkerRuntime(): InspectionWorkerRuntime {
  const listeners = new Set<(event: InspectionWorkerEvent) => void>();

  let worker: Worker | undefined;
  const publishFailure = (message: string) => {
    for (const listener of listeners) listener({ type: 'WorkerFailed', message });
    listeners.clear();
  };
  function getWorker(): Worker {
    if (worker !== undefined) return worker;
    const created = new Worker(new URL('../workers/inspection.worker.ts', import.meta.url), {
      type: 'module',
    });
    created.addEventListener('message', (event: MessageEvent<InspectionWorkerEvent>) => {
      for (const listener of listeners) listener(event.data);
    });
    created.addEventListener('error', (event) => {
      created.terminate();
      if (worker === created) worker = undefined;
      publishFailure(event.message || 'Inspection worker crashed.');
    });
    created.addEventListener('messageerror', () => {
      created.terminate();
      if (worker === created) worker = undefined;
      publishFailure('Inspection worker returned an unreadable message.');
    });
    worker = created;
    return created;
  }

  return {
    post: (command, transfer) =>
      getWorker().postMessage(command, transfer === undefined ? [] : [...transfer]),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    terminate: () => {
      worker?.terminate();
      worker = undefined;
      listeners.clear();
    },
  };
}
