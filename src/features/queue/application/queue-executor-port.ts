import type { ConversionQueue } from '../domain/conversion-queue';
import type { ConversionJobId } from '../../../shared/domain/ids';

export type QueueExecutionSnapshot = {
  readonly queue: ConversionQueue;
};

export type QueueExecutorControls = {
  readonly pause: () => void;
  readonly resume: () => void;
  readonly cancel: () => void;
  readonly cancelJob: (jobId: ConversionJobId) => void;
};

export type QueueExecutorOptions = {
  readonly onSnapshot: (snapshot: QueueExecutionSnapshot) => void;
  readonly onComplete: (snapshot: QueueExecutionSnapshot) => void;
  readonly onError: (error: Error) => void;
};

export type QueueExecutorPort = {
  readonly execute: (
    queue: ConversionQueue,
    options: QueueExecutorOptions,
  ) => QueueExecutorControls;
};
