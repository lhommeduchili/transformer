import { brandValue, type Brand } from './brand';
import { err, ok, type Result } from './result';

export type DateTimeIso = Brand<string, 'DateTimeIso'>;

export type DateTimeError = {
  readonly type: 'invalid_date_time_iso';
  readonly value: string;
};

export function createDateTimeIso(value: string): Result<DateTimeIso, DateTimeError> {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== value) {
    return err({ type: 'invalid_date_time_iso', value });
  }

  return ok(brandValue<string, 'DateTimeIso'>(value));
}
