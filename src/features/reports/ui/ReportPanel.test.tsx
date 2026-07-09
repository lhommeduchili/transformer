import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createQueueId } from '../../../shared/domain/ids';
import type { ConversionReport } from '../domain/conversion-report';
import { ReportPanel } from './ReportPanel';

function fixtureReport(): ConversionReport {
  const queueId = createQueueId('queue-1');
  const generatedAt = createDateTimeIso('2026-06-26T00:00:00.000Z');
  if (!queueId.ok || !generatedAt.ok) throw new Error('Invalid fixture.');

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
    jobs: [],
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
    fireEvent.click(screen.getByRole('button', { name: /export json/i }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });
});
