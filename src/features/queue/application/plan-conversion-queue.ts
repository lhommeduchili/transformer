import type { ClockPort } from '../../../shared/application/clock-port';
import type { IdGeneratorPort } from '../../../shared/application/id-generator-port';
import type { ConversionJobId, QueueId } from '../../../shared/domain/ids';
import { err, ok, type Result } from '../../../shared/domain/result';
import { createConversionJob, type ConversionJob } from '../../conversion/domain/conversion-job';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type { OutputFilenamePreview } from '../../presets/domain/output-filename-preview';
import { createQueue, type ConversionQueue } from '../domain/conversion-queue';

export type PlanConversionQueueError =
  | { readonly type: 'empty_plan'; readonly message: string }
  | { readonly type: 'invalid_job'; readonly message: string };

export type PlanConversionQueueDependencies = {
  readonly queueIdGenerator: IdGeneratorPort<QueueId>;
  readonly jobIdGenerator: IdGeneratorPort<ConversionJobId>;
  readonly clock: ClockPort;
};

export function planConversionQueue(
  previews: readonly OutputFilenamePreview[],
  preset: ConversionPreset,
  dependencies: PlanConversionQueueDependencies,
): Result<ConversionQueue, PlanConversionQueueError> {
  if (previews.length === 0) {
    return err({ type: 'empty_plan', message: 'Import at least one supported audio file first.' });
  }

  const jobs: ConversionJob[] = [];

  for (const preview of previews) {
    const job = createConversionJob({
      id: dependencies.jobIdGenerator.nextId(),
      assetId: preview.asset.id,
      presetId: preset.id,
      outputName: preview.outputName,
    });

    if (!job.ok) {
      return err({ type: 'invalid_job', message: job.error.message });
    }

    jobs.push(job.value);
  }

  return ok(
    createQueue({
      id: dependencies.queueIdGenerator.nextId(),
      jobs,
      createdAt: dependencies.clock.now(),
    }),
  );
}
