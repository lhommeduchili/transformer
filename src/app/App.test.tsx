import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the import and inspection shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /transformer/i })).toBeInTheDocument();
    expect(screen.getAllByText(/made with ♥ by alφ/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /drop audio/i })).toBeInTheDocument();
    expect(screen.getByText(/cdj \/ rekordbox safe aiff/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /destination/i })).toBeInTheDocument();
  });
});
