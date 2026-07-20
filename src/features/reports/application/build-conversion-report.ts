import type { DateTimeIso } from '../../../shared/domain/date-time';
import type { AudioAsset } from '../../import/domain/audio-asset';
import type { TrackInspection } from '../../inspection/domain/track-inspection';
import type { OutputDestination } from '../../output/application/output-destination';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type { ConversionQueue } from '../../queue/domain/conversion-queue';
import type { ConversionReport, ConversionReportStatusSummary } from '../domain/conversion-report';

export type BuildConversionReportInput = {
  readonly queue: ConversionQueue;
  readonly assets: readonly AudioAsset[];
  readonly preset: ConversionPreset;
  readonly destination: OutputDestination;
  readonly generatedAt: DateTimeIso;
  readonly inspections?: readonly TrackInspection[];
};

export function buildConversionReport(input: BuildConversionReportInput): ConversionReport {
  const queueAssetIds = new Set(input.queue.jobs.map((job) => job.assetId));
  const queueInspections = (input.inspections ?? []).filter((inspection) =>
    queueAssetIds.has(inspection.assetId),
  );
  const sourceNamesByAssetId = new Map(
    input.assets
      .filter((asset) => queueAssetIds.has(asset.id))
      .map((asset) => [asset.id, asset.sourceName] as const),
  );
  const inspectionsByAssetId = new Map(
    queueInspections.map((inspection) => [inspection.assetId, inspection] as const),
  );

  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt,
    queueId: input.queue.id,
    queueStatus: input.queue.status,
    queueCreatedAt: input.queue.createdAt,
    ...(input.queue.startedAt === undefined ? {} : { queueStartedAt: input.queue.startedAt }),
    ...(input.queue.completedAt === undefined ? {} : { queueCompletedAt: input.queue.completedAt }),
    preset: {
      presetId: input.preset.id,
      name: input.preset.name,
      targetContainer: input.preset.targetContainer,
      targetCodec: input.preset.targetCodec,
    },
    destination: input.destination,
    summary: summarizeJobs(input.queue),
    metadataSummary: summarizeMetadata(queueInspections),
    jobs: input.queue.jobs.map((job) => {
      const inspection = inspectionsByAssetId.get(job.assetId);

      return {
        jobId: job.id,
        assetId: job.assetId,
        sourceName: sourceNamesByAssetId.get(job.assetId) ?? 'Unknown source file',
        outputName: job.outputName,
        status: job.status,
        attempts: job.attempts,
        progressPercent: job.progress.percent,
        errors: job.errors.map((error) => error.message),
        ...(inspection === undefined
          ? {}
          : {
              metadata: {
                completeness: inspection.metadataAssessment.completeness,
                sourceFormat: inspection.metadataAssessment.sourceFormat,
                missingFields: inspection.metadataAssessment.missingFields,
                artwork: inspection.metadataAssessment.artwork,
              },
            }),
      };
    }),
  };
}

function summarizeMetadata(inspections: readonly TrackInspection[]) {
  return inspections.reduce(
    (summary, inspection) => {
      summary[inspection.metadataAssessment.completeness] += 1;
      return summary;
    },
    { complete: 0, partial: 0, missing: 0 },
  );
}

function summarizeJobs(queue: ConversionQueue): ConversionReportStatusSummary {
  return queue.jobs.reduce<ConversionReportStatusSummary>(
    (summary, job) => ({
      total: summary.total + 1,
      completed: summary.completed + (job.status === 'completed' ? 1 : 0),
      failed: summary.failed + (job.status === 'failed' ? 1 : 0),
      skipped: summary.skipped + (job.status === 'skipped' ? 1 : 0),
      cancelled: summary.cancelled + (job.status === 'cancelled' ? 1 : 0),
      pending:
        summary.pending +
        (['pending', 'inspecting', 'ready', 'converting', 'writing', 'cancelling'].includes(
          job.status,
        )
          ? 1
          : 0),
    }),
    { total: 0, completed: 0, failed: 0, skipped: 0, cancelled: 0, pending: 0 },
  );
}
