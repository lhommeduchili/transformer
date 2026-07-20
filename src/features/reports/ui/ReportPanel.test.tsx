import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
} from '../../../shared/domain/ids';
import type { ConversionReport } from '../domain/conversion-report';
import { ReportPanel } from './ReportPanel';

function fixtureReport(): ConversionReport {
  const queueId = createQueueId('queue-1');
  const generatedAt = createDateTimeIso('2026-06-26T00:00:00.000Z');
  const jobId = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  if (!queueId.ok || !jobId.ok || !assetId.ok || !generatedAt.ok) {
    throw new Error('Invalid fixture.');
  }

  return {
    schemaVersion: 1,
    generatedAt: generatedAt.value,
    queueId: queueId.value,
    queueStatus: 'completed',
    queueCreatedAt: generatedAt.value,
    preset: {
      presetId: 'preset-1' as ConversionReport['preset']['presetId'],
      name: 'preset',
      targetContainer: 'aiff',
      targetCodec: 'pcm_s16be',
    },
    destination: { type: 'directory', name: 'prepared aiff' },
    summary: { total: 2, completed: 1, failed: 1, skipped: 0, cancelled: 0, pending: 0 },
    metadataSummary: { complete: 0, partial: 0, missing: 0 },
    jobs: [
      {
        jobId: jobId.value,
        assetId: assetId.value,
        sourceName: 'Track.flac',
        outputName: 'Track.aiff',
        status: 'completed',
        attempts: 1,
        progressPercent: 100,
        errors: [],
        metadata: {
          completeness: 'partial',
          sourceFormat: 'vorbis',
          missingFields: ['album'],
          artwork: 'unknown',
        },
      },
    ],
  };
}

describe('ReportPanel', () => {
  it('stays hidden until a report exists', () => {
    render(<ReportPanel report={undefined} onExportJson={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /export json/i })).not.toBeInTheDocument();
  });

  it('shows report totals and calls export', () => {
    const onExportJson = vi.fn();

    render(<ReportPanel report={fixtureReport()} onExportJson={onExportJson} />);

    expect(screen.getByText('total')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/job details/i));
    expect(screen.getByText(/track.flac/i)).toBeInTheDocument();
    expect(screen.getByText(/missing album/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /export json/i }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });
});
