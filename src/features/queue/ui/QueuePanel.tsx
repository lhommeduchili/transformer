import type { AudioAsset } from '../../import/domain/audio-asset';
import type { OutputFilenamePreview } from '../../presets/domain/output-filename-preview';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type { ConversionJobId } from '../../../shared/domain/ids';
import { calculateQueueProgress } from '../application/queue-progress';
import type { ConversionQueue } from '../domain/conversion-queue';
import { QueueControls } from './QueueControls';
import { QueueJobList } from './QueueJobList';
import { QueueProgressSummary } from './QueueProgressSummary';

type QueuePanelProps = {
  readonly assets: readonly AudioAsset[];
  readonly previews: readonly OutputFilenamePreview[];
  readonly selectedPreset: ConversionPreset;
  readonly queue: ConversionQueue | undefined;
  readonly error: string | undefined;
  readonly onPlanQueue: (
    previews: readonly OutputFilenamePreview[],
    preset: ConversionPreset,
  ) => void;
  readonly onStartQueue: () => void;
  readonly onPauseQueue: () => void;
  readonly onResumeQueue: () => void;
  readonly onCancelQueue: () => void;
  readonly onRetryFailed: () => void;
  readonly onResetQueue: () => void;
  readonly onSkipJob: (jobId: ConversionJobId) => void;
};

export function QueuePanel({
  assets,
  previews,
  selectedPreset,
  queue,
  error,
  onPlanQueue,
  onStartQueue,
  onPauseQueue,
  onResumeQueue,
  onCancelQueue,
  onRetryFailed,
  onResetQueue,
  onSkipJob,
}: QueuePanelProps) {
  const summary = calculateQueueProgress(queue);

  return (
    <section className="queue-panel" aria-labelledby="queue-title">
      <div className="panel-heading">
        <h2 id="queue-title">convert</h2>
        <span>{queue?.status ?? 'no queue'}</span>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <QueueProgressSummary queue={queue} summary={summary} />
      <QueueControls
        queue={queue}
        canPlan={previews.length > 0}
        onPlan={() => onPlanQueue(previews, selectedPreset)}
        onStart={onStartQueue}
        onPause={onPauseQueue}
        onResume={onResumeQueue}
        onCancel={onCancelQueue}
        onRetryFailed={onRetryFailed}
        onReset={onResetQueue}
      />
      <QueueJobList queue={queue} assets={assets} onSkipJob={onSkipJob} />
    </section>
  );
}
