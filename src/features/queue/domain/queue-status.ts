export type QueueStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'completed_with_errors'
  | 'failed';
