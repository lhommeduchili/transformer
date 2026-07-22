import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PwaStatus } from './PwaStatus';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [true, vi.fn()],
    needRefresh: [true, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));

describe('PwaStatus', () => {
  it('does not display any PWA notification even when offlineReady or needRefresh is true', () => {
    const { container } = render(<PwaStatus />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/update is ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to work offline/i)).not.toBeInTheDocument();
  });
});
