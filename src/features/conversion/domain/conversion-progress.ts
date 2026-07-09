import type { ProgressPercent } from '../../../shared/domain/numbers';

export type JobProgress = {
  readonly percent: ProgressPercent;
  readonly phase: 'not_started' | 'inspecting' | 'converting' | 'writing' | 'completed';
};
