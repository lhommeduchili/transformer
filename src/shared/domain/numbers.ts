import { brandValue, type Brand } from './brand';
import { err, ok, type Result } from './result';

export type FileSizeBytes = Brand<number, 'FileSizeBytes'>;
export type DurationMs = Brand<number, 'DurationMs'>;
export type BitrateKbps = Brand<number, 'BitrateKbps'>;
export type SampleRateHz = Brand<number, 'SampleRateHz'>;
export type ProgressPercent = Brand<number, 'ProgressPercent'>;

export type NumberConstraintError = {
  readonly type: 'number_out_of_range';
  readonly name: string;
  readonly value: number;
  readonly min: number;
  readonly max?: number;
};

function createConstrainedNumber<Name extends string>(
  name: string,
  value: number,
  min: number,
  max?: number,
): Result<Brand<number, Name>, NumberConstraintError> {
  if (!Number.isFinite(value) || value < min || (max !== undefined && value > max)) {
    return err(
      max === undefined
        ? { type: 'number_out_of_range', name, value, min }
        : { type: 'number_out_of_range', name, value, min, max },
    );
  }

  return ok(brandValue<number, Name>(value));
}

export function createFileSizeBytes(value: number): Result<FileSizeBytes, NumberConstraintError> {
  return createConstrainedNumber<'FileSizeBytes'>('file_size_bytes', value, 0);
}

export function createDurationMs(value: number): Result<DurationMs, NumberConstraintError> {
  return createConstrainedNumber<'DurationMs'>('duration_ms', value, 0);
}

export function createBitrateKbps(value: number): Result<BitrateKbps, NumberConstraintError> {
  return createConstrainedNumber<'BitrateKbps'>('bitrate_kbps', value, 1);
}

export function createSampleRateHz(value: number): Result<SampleRateHz, NumberConstraintError> {
  return createConstrainedNumber<'SampleRateHz'>('sample_rate_hz', value, 1);
}

export function createProgressPercent(
  value: number,
): Result<ProgressPercent, NumberConstraintError> {
  return createConstrainedNumber<'ProgressPercent'>('progress_percent', value, 0, 100);
}
