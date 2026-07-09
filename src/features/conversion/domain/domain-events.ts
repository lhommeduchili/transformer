import type { DateTimeIso } from '../../../shared/domain/date-time';
import type { AudioAssetId, ConversionJobId, QueueId } from '../../../shared/domain/ids';
import type { ProgressPercent } from '../../../shared/domain/numbers';
import type { ConversionError } from './conversion-error';

export type DomainEventBase<Type extends string> = {
  readonly type: Type;
  readonly occurredAt: DateTimeIso;
};

export type DomainEvent =
  | (DomainEventBase<'AudioAssetsImported'> & { readonly assetIds: readonly AudioAssetId[] })
  | (DomainEventBase<'TrackInspectionStarted'> & { readonly assetId: AudioAssetId })
  | (DomainEventBase<'TrackInspectionCompleted'> & { readonly assetId: AudioAssetId })
  | (DomainEventBase<'TrackInspectionFailed'> & {
      readonly assetId: AudioAssetId;
      readonly error: ConversionError;
    })
  | (DomainEventBase<'ConversionJobQueued'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobStarted'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobProgressed'> & {
      readonly jobId: ConversionJobId;
      readonly progress: ProgressPercent;
    })
  | (DomainEventBase<'ConversionJobPaused'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobResumed'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobCancelled'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobCompleted'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'ConversionJobFailed'> & {
      readonly jobId: ConversionJobId;
      readonly error: ConversionError;
    })
  | (DomainEventBase<'ConversionJobRetried'> & { readonly jobId: ConversionJobId })
  | (DomainEventBase<'QueueStarted'> & { readonly queueId: QueueId })
  | (DomainEventBase<'QueuePaused'> & { readonly queueId: QueueId })
  | (DomainEventBase<'QueueResumed'> & { readonly queueId: QueueId })
  | (DomainEventBase<'QueueCompleted'> & { readonly queueId: QueueId })
  | (DomainEventBase<'QueueFailed'> & {
      readonly queueId: QueueId;
      readonly error: ConversionError;
    })
  | (DomainEventBase<'ReportGenerated'> & { readonly queueId: QueueId });
