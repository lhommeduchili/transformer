import type { QueueProgressSummary as QueueProgressSummaryModel } from '../application/queue-progress';
import type { ConversionQueue } from '../domain/conversion-queue';

type QueueProgressSummaryProps = {
  readonly queue: ConversionQueue | undefined;
  readonly summary: QueueProgressSummaryModel;
};

const asciiMeterLength = 240;
const emptyMeter = '░'.repeat(asciiMeterLength);
const filledMeter = '█'.repeat(asciiMeterLength);

export function QueueProgressSummary({ queue, summary }: QueueProgressSummaryProps) {
  const status = queue?.status ?? 'no queue';
  const statusText = `queue status: ${status}. ${summary.globalPercent}% processed. ${summary.completed} completed, ${summary.failed} failed, ${summary.pending} pending, ${summary.active} active.`;

  if (queue === undefined) {
    return (
      <div className="queue-progress" role="status" aria-live="polite" aria-atomic="true">
        <span className="visually-hidden">{statusText}</span>
      </div>
    );
  }

  return (
    <div className="queue-progress" role="status" aria-live="polite" aria-atomic="true">
      <p className="meter-line">
        <span className="meter-text" aria-hidden="true">
          <span className="meter-empty">{emptyMeter}</span>
          <span className="meter-filled" style={{ inlineSize: `${summary.globalPercent}%` }}>
            {filledMeter}
          </span>
        </span>
        <span>{summary.globalPercent}%</span>
      </p>
      <p className="meter-counts">
        {summary.completed}/{queue.jobs.length} done · {summary.failed} failed · {summary.active}{' '}
        active
      </p>
      <span className="visually-hidden">{statusText}</span>
    </div>
  );
}
