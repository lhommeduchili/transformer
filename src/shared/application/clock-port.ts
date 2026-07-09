import type { DateTimeIso } from '../domain/date-time';

export type ClockPort = {
  readonly now: () => DateTimeIso;
};
