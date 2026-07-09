import type { ConversionQueue } from '../domain/conversion-queue';

type QueueControlsProps = {
  readonly queue: ConversionQueue | undefined;
  readonly canPlan: boolean;
  readonly onPlan: () => void;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onCancel: () => void;
  readonly onRetryFailed: () => void;
  readonly onReset: () => void;
};

export function QueueControls({
  queue,
  canPlan,
  onPlan,
  onStart,
  onPause,
  onResume,
  onCancel,
  onRetryFailed,
  onReset,
}: QueueControlsProps) {
  const status = queue?.status;
  const hasFailedJobs = queue?.jobs.some((job) => job.status === 'failed') ?? false;
  const guidance = controlGuidance(queue, canPlan, hasFailedJobs);

  return (
    <div>
      <p id="queue-control-guidance" className="control-guidance">
        {guidance}
      </p>
      <div className="queue-actions" aria-label="queue controls">
        {queue === undefined ? (
          <button
            className="primary-action"
            type="button"
            onClick={onPlan}
            disabled={!canPlan}
            aria-describedby="queue-control-guidance"
          >
            create queue
          </button>
        ) : null}

        {status === 'idle' ? (
          <>
            <button
              className="primary-action"
              type="button"
              onClick={onStart}
              aria-describedby="queue-control-guidance"
            >
              start
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={onReset}
              aria-describedby="queue-control-guidance"
            >
              reset
            </button>
          </>
        ) : null}

        {status === 'running' ? (
          <>
            <button
              className="primary-action"
              type="button"
              onClick={onPause}
              aria-describedby="queue-control-guidance"
            >
              pause
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={onCancel}
              aria-describedby="queue-control-guidance"
            >
              cancel
            </button>
          </>
        ) : null}

        {status === 'paused' ? (
          <>
            <button
              className="primary-action"
              type="button"
              onClick={onResume}
              aria-describedby="queue-control-guidance"
            >
              resume
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={onCancel}
              aria-describedby="queue-control-guidance"
            >
              cancel
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={onReset}
              aria-describedby="queue-control-guidance"
            >
              reset
            </button>
          </>
        ) : null}

        {queue !== undefined &&
        ['completed', 'completed_with_errors', 'cancelled', 'failed'].includes(status ?? '') ? (
          <>
            {hasFailedJobs ? (
              <button
                className="primary-action"
                type="button"
                onClick={onRetryFailed}
                aria-describedby="queue-control-guidance"
              >
                retry failed
              </button>
            ) : null}
            <button
              className={hasFailedJobs ? 'secondary-action' : 'primary-action'}
              type="button"
              onClick={onPlan}
              disabled={!canPlan}
              aria-describedby="queue-control-guidance"
            >
              create queue
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={onReset}
              aria-describedby="queue-control-guidance"
            >
              reset
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function controlGuidance(
  queue: ConversionQueue | undefined,
  canPlan: boolean,
  hasFailedJobs: boolean,
): string {
  if (!canPlan) {
    return 'import tracks first';
  }

  if (queue === undefined) {
    return 'ready to build';
  }

  if (queue.status === 'idle') {
    return 'queue ready';
  }

  if (queue.status === 'running') {
    return 'running';
  }

  if (queue.status === 'paused') {
    return 'paused';
  }

  if (hasFailedJobs) {
    return 'retry or reset';
  }

  return 'queue closed';
}
