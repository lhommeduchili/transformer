import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the import and inspection shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /transformer/i })).toBeInTheDocument();
    const signatureLink = screen.getByRole('link', { name: /made with ♥ by alφ/i });
    expect(signatureLink).toBeInTheDocument();
    expect(signatureLink).toHaveAttribute('href', 'https://lhommeduchili.xyz');
    expect(signatureLink).toHaveAttribute('target', '_blank');
    expect(signatureLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
