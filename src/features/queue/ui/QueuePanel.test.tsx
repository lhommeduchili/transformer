import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createConversionJob } from '../../conversion/domain/conversion-job';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { createQueue } from '../domain/conversion-queue';
import { QueuePanel } from './QueuePanel';

function idleQueue() {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const presetId = createPresetId('preset-1');
  const createdAt = createDateTimeIso('2026-07-08T00:00:00.000Z');

  if (!queueId.ok || !jobId.ok || !assetId.ok || !presetId.ok || !createdAt.ok) {
    throw new Error('Invalid fixture.');
  }

  const job = createConversionJob({
    id: jobId.value,
    assetId: assetId.value,
    presetId: presetId.value,
    outputName: 'Track.aiff',
  });
  if (!job.ok) throw new Error('Invalid fixture.');

  return createQueue({ id: queueId.value, jobs: [job.value], createdAt: createdAt.value });
}

describe('QueuePanel', () => {
  it('renders queue controls and empty state', () => {
    render(
      <QueuePanel
        assets={[]}
        previews={[]}
        selectedPreset={getDefaultPreset()}
        queue={undefined}
        error={undefined}
        onPlanQueue={vi.fn()}
        onStartQueue={vi.fn()}
        onPauseQueue={vi.fn()}
        onResumeQueue={vi.fn()}
        onCancelQueue={vi.fn()}
        onRetryFailed={vi.fn()}
        onResetQueue={vi.fn()}
        onSkipJob={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /convert/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create queue/i })).toBeDisabled();
    expect(screen.getByText(/import tracks first/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/global queue progress/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/no queue/i);
  });

  it('uses a compact x action for queued jobs', () => {
    const onSkipJob = vi.fn();
    const queue = idleQueue();

    render(
      <QueuePanel
        assets={[]}
        previews={[]}
        selectedPreset={getDefaultPreset()}
        queue={queue}
        error={undefined}
        onPlanQueue={vi.fn()}
        onStartQueue={vi.fn()}
        onPauseQueue={vi.fn()}
        onResumeQueue={vi.fn()}
        onCancelQueue={vi.fn()}
        onRetryFailed={vi.fn()}
        onResetQueue={vi.fn()}
        onSkipJob={onSkipJob}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /skip track.aiff/i }));

    expect(onSkipJob).toHaveBeenCalledWith(queue.jobs[0]?.id);
  });
});
