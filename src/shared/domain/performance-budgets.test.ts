import { describe, expect, it } from 'vitest';

import { performanceBudgets } from './performance-budgets';

describe('performanceBudgets', () => {
  it('keeps large-batch and conversion concurrency assumptions explicit', () => {
    expect(performanceBudgets.minimumUsableQueueSize).toBeGreaterThanOrEqual(1000);
    expect(performanceBudgets.defaultConversionConcurrency).toBe(1);
    expect(performanceBudgets.maxMainThreadTaskMsBeforeReview).toBe(50);
  });
});
