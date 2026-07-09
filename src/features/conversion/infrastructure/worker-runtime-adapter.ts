import type {
  ConversionWorkerCommand,
  ConversionWorkerEvent,
} from '../workers/conversion-worker-protocol';

export type ConversionWorkerRuntime = {
  readonly post: (command: ConversionWorkerCommand, transfer?: readonly Transferable[]) => void;
  readonly subscribe: (listener: (event: ConversionWorkerEvent) => void) => () => void;
  readonly terminate: () => void;
};

export function createConversionWorkerRuntime(): ConversionWorkerRuntime {
  const worker = new Worker(new URL('../workers/conversion.worker.ts', import.meta.url), {
    type: 'module',
  });
  const listeners = new Set<(event: ConversionWorkerEvent) => void>();

  worker.addEventListener('message', (event: MessageEvent<ConversionWorkerEvent>) => {
    for (const listener of listeners) {
      listener(event.data);
    }
  });

  return {
    post: (command, transfer) =>
      worker.postMessage(command, transfer === undefined ? [] : [...transfer]),
    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    terminate: () => worker.terminate(),
  };
}
