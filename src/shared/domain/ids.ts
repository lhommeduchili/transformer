import { brandValue, type Brand } from './brand';
import { err, ok, type Result } from './result';

export type AudioAssetId = Brand<string, 'AudioAssetId'>;
export type ConversionJobId = Brand<string, 'ConversionJobId'>;
export type QueueId = Brand<string, 'QueueId'>;
export type PresetId = Brand<string, 'PresetId'>;

export type IdError = {
  readonly type: 'invalid_id';
  readonly value: string;
};

function createId<Name extends string>(value: string): Result<Brand<string, Name>, IdError> {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return err({ type: 'invalid_id', value });
  }

  return ok(brandValue<string, Name>(trimmed));
}

export function createAudioAssetId(value: string): Result<AudioAssetId, IdError> {
  return createId<'AudioAssetId'>(value);
}

export function createConversionJobId(value: string): Result<ConversionJobId, IdError> {
  return createId<'ConversionJobId'>(value);
}

export function createQueueId(value: string): Result<QueueId, IdError> {
  return createId<'QueueId'>(value);
}

export function createPresetId(value: string): Result<PresetId, IdError> {
  return createId<'PresetId'>(value);
}
