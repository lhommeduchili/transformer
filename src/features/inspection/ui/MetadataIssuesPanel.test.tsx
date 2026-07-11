import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessMetadata } from '../domain/track-inspection';
import { MetadataIssuesPanel } from './MetadataIssuesPanel';

describe('MetadataIssuesPanel', () => {
  it('lists tracks with metadata gaps', () => {
    render(
      <MetadataIssuesPanel
        inspections={[
          {
            assetId: 'a',
            metadata: {},
            metadataAssessment: assessMetadata({}, 'unknown'),
          } as never,
        ]}
      />,
    );

    expect(screen.getByText(/missing:/i)).toBeInTheDocument();
  });
});
