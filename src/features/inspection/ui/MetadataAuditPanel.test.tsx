import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessMetadata } from '../domain/track-inspection';
import { MetadataAuditPanel } from './MetadataAuditPanel';

describe('MetadataAuditPanel', () => {
  it('summarizes metadata gaps', () => {
    render(
      <MetadataAuditPanel
        inspections={[{ metadataAssessment: assessMetadata({}, 'unknown') } as never]}
      />,
    );

    expect(screen.getByText(/missing title/i)).toBeInTheDocument();
  });
});
