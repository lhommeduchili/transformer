import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OutputDestinationPanel } from './OutputDestinationPanel';

describe('OutputDestinationPanel', () => {
  it('shows folder selection when supported', () => {
    render(
      <OutputDestinationPanel
        destination={{ type: 'directory', name: 'No folder selected' }}
        supportsFolderSelection={true}
        error={undefined}
        onChooseDestination={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /choose folder/i })).toBeInTheDocument();
    expect(screen.getByText(/folder required/i)).toBeInTheDocument();
  });

  it('shows fallback messaging when folder selection is unsupported', () => {
    render(
      <OutputDestinationPanel
        destination={{ type: 'download_fallback', name: 'Browser downloads' }}
        supportsFolderSelection={false}
        error={undefined}
        onChooseDestination={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/browser downloads/i)).toHaveLength(1);
  });
});
