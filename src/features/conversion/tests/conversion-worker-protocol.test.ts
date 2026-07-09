import { describe, expect, it } from 'vitest';

import { isTerminalWorkerEvent } from '../workers/conversion-worker-protocol';

describe('conversion worker protocol', () => {
  it('identifies terminal worker events', () => {
    expect(isTerminalWorkerEvent({ type: 'ConversionCancelled', commandId: 'command-1' })).toBe(
      true,
    );
    expect(
      isTerminalWorkerEvent({ type: 'ConversionProgressed', commandId: 'command-1', ratio: 0.5 }),
    ).toBe(false);
  });
});
