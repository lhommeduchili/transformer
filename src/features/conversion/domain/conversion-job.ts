import type { AudioAssetId, ConversionJobId, PresetId } from '../../../shared/domain/ids';
import { createProgressPercent } from '../../../shared/domain/numbers';
import type { ProgressPercent } from '../../../shared/domain/numbers';
import { err, ok, type Result } from '../../../shared/domain/result';
import { invalidJobTransition, type ConversionError } from './conversion-error';
import type { JobProgress } from './conversion-progress';

export type ConversionJobStatus =
  | 'pending'
  | 'inspecting'
  | 'ready'
  | 'converting'
  | 'writing'
  | 'completed'
  | 'skipped'
  | 'cancelling'
  | 'cancelled'
  | 'failed';

export type ConversionJob = {
  readonly id: ConversionJobId;
  readonly assetId: AudioAssetId;
  readonly presetId: PresetId;
  readonly outputName: string;
  readonly status: ConversionJobStatus;
  readonly progress: JobProgress;
  readonly attempts: number;
  readonly errors: readonly ConversionError[];
};

export type ConversionJobInput = Pick<ConversionJob, 'id' | 'assetId' | 'presetId' | 'outputName'>;

export type ConversionJobError =
  | ConversionError
  | { readonly type: 'empty_output_name'; readonly recoverable: false; readonly message: string };

function trustedProgress(value: 0 | 100): ProgressPercent {
  const progress = createProgressPercent(value);

  if (!progress.ok) {
    throw new Error(`Internal progress constant ${value} is invalid.`);
  }

  return progress.value;
}

const zeroProgress = trustedProgress(0);
const completeProgress = trustedProgress(100);

export function createConversionJob(
  input: ConversionJobInput,
): Result<ConversionJob, ConversionJobError> {
  if (input.outputName.trim().length === 0) {
    return err({
      type: 'empty_output_name',
      recoverable: false,
      message: 'Output name is required.',
    });
  }

  return ok({
    ...input,
    outputName: input.outputName.trim(),
    status: 'pending',
    progress: { percent: zeroProgress, phase: 'not_started' },
    attempts: 0,
    errors: [],
  });
}

function transition(
  job: ConversionJob,
  to: ConversionJobStatus,
  allowedFrom: readonly ConversionJobStatus[],
  patch: Partial<ConversionJob> = {},
): Result<ConversionJob, ConversionJobError> {
  if (!allowedFrom.includes(job.status)) {
    return err(invalidJobTransition(job.status, to, job.id));
  }

  return ok({ ...job, ...patch, status: to });
}

export function startInspection(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'inspecting', ['pending'], {
    progress: { percent: zeroProgress, phase: 'inspecting' },
  });
}

export function markReady(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'ready', ['inspecting']);
}

export function startConversion(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'converting', ['ready'], {
    attempts: job.attempts + 1,
    progress: { percent: zeroProgress, phase: 'converting' },
  });
}

export function updateProgress(
  job: ConversionJob,
  percent: ProgressPercent,
): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'converting', ['converting'], {
    progress: { percent, phase: 'converting' },
  });
}

export function startWriting(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'writing', ['converting'], {
    progress: { percent: completeProgress, phase: 'writing' },
  });
}

export function completeJob(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'completed', ['writing'], {
    progress: { percent: completeProgress, phase: 'completed' },
  });
}

export function skipJob(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'skipped', ['pending', 'ready']);
}

export function requestCancel(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'cancelling', ['inspecting', 'converting', 'writing']);
}

export function markCancelled(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'cancelled', ['cancelling']);
}

export function failJob(
  job: ConversionJob,
  errorValue: ConversionError,
): Result<ConversionJob, ConversionJobError> {
  if (!['converting', 'writing', 'inspecting'].includes(job.status)) {
    return err(invalidJobTransition(job.status, 'failed', job.id));
  }

  return ok({ ...job, status: 'failed', errors: [...job.errors, errorValue] });
}

export function retryJob(job: ConversionJob): Result<ConversionJob, ConversionJobError> {
  return transition(job, 'pending', ['failed'], {
    progress: { percent: zeroProgress, phase: 'not_started' },
  });
}
