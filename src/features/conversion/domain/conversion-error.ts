import type { ConversionJobId } from '../../../shared/domain/ids';

export type ConversionError =
  | {
      readonly type: 'unsupported_source';
      readonly message: string;
      readonly recoverable: true;
    }
  | {
      readonly type: 'inspection_failed';
      readonly message: string;
      readonly recoverable: true;
    }
  | {
      readonly type: 'conversion_failed';
      readonly message: string;
      readonly recoverable: true;
    }
  | {
      readonly type: 'write_failed';
      readonly message: string;
      readonly recoverable: true;
    }
  | {
      readonly type: 'cancelled';
      readonly message: string;
      readonly recoverable: true;
    }
  | InvalidTransitionError;

export type InvalidTransitionError = {
  readonly type: 'invalid_transition';
  readonly message: string;
  readonly recoverable: false;
  readonly jobId?: ConversionJobId;
  readonly from: string;
  readonly to: string;
};

export function invalidJobTransition(
  from: string,
  to: string,
  jobId?: ConversionJobId,
): InvalidTransitionError {
  const error: Omit<InvalidTransitionError, 'jobId'> = {
    type: 'invalid_transition',
    message: `Cannot transition conversion job from ${from} to ${to}.`,
    recoverable: false,
    from,
    to,
  };

  return jobId === undefined ? error : { ...error, jobId };
}
