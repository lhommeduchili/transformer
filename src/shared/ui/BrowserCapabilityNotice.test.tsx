import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrowserCapabilityNotice } from './BrowserCapabilityNotice';

describe('BrowserCapabilityNotice', () => {
  it('explains local processing and browser fallbacks', () => {
    render(
      <BrowserCapabilityNotice
        capabilities={{
          filePicker: true,
          dragAndDrop: true,
          folderDrop: false,
          fileSystemAccess: false,
        }}
      />,
    );

    expect(screen.getByText(/audio stays on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/folder drop: unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/output: browser downloads/i)).toBeInTheDocument();
  });
});
