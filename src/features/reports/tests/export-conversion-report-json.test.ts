import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createQueueId } from '../../../shared/domain/ids';
import type { ConversionReport } from '../domain/conversion-report';
import { exportConversionReportJson } from '../application/export-conversion-report-json';

describe('exportConversionReportJson', () => {
  it('serializes a report as formatted local JSON', () => {
    const queueId = createQueueId('queue/unsafe');
    const generatedAt = createDateTimeIso('2026-06-26T00:00:00.000Z');
    if (!queueId.ok || !generatedAt.ok) throw new Error('Invalid fixture.');

    const report: ConversionReport = {
      schemaVersion: 1,
      generatedAt: generatedAt.value,
      queueId: queueId.value,
      queueStatus: 'completed',
      queueCreatedAt: generatedAt.value,
      preset: {
        presetId: 'preset-1' as ConversionReport['preset']['presetId'],
        name: 'Preset',
        targetContainer: 'aiff',
        targetCodec: 'pcm_s16be',
      },
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      summary: { total: 0, completed: 0, failed: 0, skipped: 0, cancelled: 0, pending: 0 },
      jobs: [],
    };

    const exported = exportConversionReportJson(report);

    expect(exported.fileName).toBe('conversion-report-queue-unsafe.json');
    expect(exported.mimeType).toBe('application/json');
    expect(JSON.parse(exported.contents)).toMatchObject({
      schemaVersion: 1,
      queueStatus: 'completed',
    });
  });
});
