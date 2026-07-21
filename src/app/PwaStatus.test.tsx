import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PwaStatus } from './PwaStatus';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [true, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

describe('PwaStatus', () => {
  it('does not display ready to work offline notification even when offlineReady is true', () => {
    render(<PwaStatus />);
    expect(screen.queryByText(/ready to work offline/i)).not.toBeInTheDocument();
  });
});
