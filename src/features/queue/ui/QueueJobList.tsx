import type { AudioAsset } from '../../import/domain/audio-asset';
import type { ConversionJobId } from '../../../shared/domain/ids';
import type { ConversionQueue } from '../domain/conversion-queue';

type QueueJobListProps = {
  readonly queue: ConversionQueue | undefined;
  readonly assets: readonly AudioAsset[];
  readonly onSkipJob: (jobId: ConversionJobId) => void;
};

export function QueueJobList({ queue, assets, onSkipJob }: QueueJobListProps) {
  if (queue === undefined) {
    return null;
  }

  return (
    <ul className="job-list" aria-label="queue jobs">
      {queue.jobs.map((job) => {
        const asset = assets.find((candidate) => candidate.id === job.assetId);

        return (
          <li className="job-row" key={job.id}>
            <div>
              <strong>{asset?.sourceName ?? job.assetId}</strong>
              <span>{job.outputName}</span>
            </div>
            <div className="row-actions">
              {canDismissJob(queue.status, job.status) ? (
                <button
                  className="inline-x-action"
                  type="button"
                  onClick={() => onSkipJob(job.id)}
                  aria-label={`${dismissVerb(job.status)} ${job.outputName}`}
                >
                  x
                </button>
              ) : null}
              <span className={`job-status job-status--${job.status}`}>
                {job.status} · {job.progress.percent}%
              </span>
            </div>
            <progress
              aria-label={`progress for ${job.outputName}`}
              max={100}
              value={job.progress.percent}
            />
          </li>
        );
      })}
    </ul>
  );
}

function canDismissJob(queueStatus: ConversionQueue['status'], jobStatus: string): boolean {
  if (!['idle', 'running', 'paused'].includes(queueStatus)) return false;
  return ['pending', 'inspecting', 'ready', 'converting', 'writing'].includes(jobStatus);
}

function dismissVerb(jobStatus: string): 'cancel' | 'skip' {
  return ['inspecting', 'converting', 'writing'].includes(jobStatus) ? 'cancel' : 'skip';
}
