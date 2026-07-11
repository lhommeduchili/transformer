import type { DateTimeIso } from '../../../shared/domain/date-time';
import type { AudioAssetId, ConversionJobId, PresetId, QueueId } from '../../../shared/domain/ids';
import type { ConversionJobStatus } from '../../conversion/domain/conversion-job';
import type { OutputDestination } from '../../output/application/output-destination';
import type { AudioContainer, AudioCodec } from '../../presets/domain/audio-format';
import type { QueueStatus } from '../../queue/domain/queue-status';

export type ConversionReportStatusSummary = {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly cancelled: number;
  readonly pending: number;
};

export type ConversionReportJob = {
  readonly jobId: ConversionJobId;
  readonly assetId: AudioAssetId;
  readonly sourceName: string;
  readonly outputName: string;
  readonly status: ConversionJobStatus;
  readonly attempts: number;
  readonly progressPercent: number;
  readonly errors: readonly string[];
};

export type ConversionReportPreset = {
  readonly presetId: PresetId;
  readonly name: string;
  readonly targetContainer: AudioContainer;
  readonly targetCodec: AudioCodec;
};

export type ConversionReport = {
  readonly schemaVersion: 1;
  readonly generatedAt: DateTimeIso;
  readonly queueId: QueueId;
  readonly queueStatus: QueueStatus;
  readonly queueCreatedAt: DateTimeIso;
  readonly queueStartedAt?: DateTimeIso;
  readonly queueCompletedAt?: DateTimeIso;
  readonly preset: ConversionReportPreset;
  readonly destination: OutputDestination;
  readonly summary: ConversionReportStatusSummary;
  readonly metadataSummary: {
    readonly complete: number;
    readonly partial: number;
    readonly missing: number;
  };
  readonly jobs: readonly ConversionReportJob[];
};
