import type { ClockPort } from '../../application/clock-port';
import { createDateTimeIso } from '../../domain/date-time';

export function createSystemClock(): ClockPort {
  return {
    now: () => {
      const dateTime = createDateTimeIso(new Date().toISOString());

      if (!dateTime.ok) {
        throw new Error('System clock produced invalid ISO date-time.');
      }

      return dateTime.value;
    },
  };
}
