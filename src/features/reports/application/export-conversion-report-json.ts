import type { QueueId } from '../../../shared/domain/ids';
import type { ConversionReport } from '../domain/conversion-report';

export type ConversionReportJsonExport = {
  readonly fileName: string;
  readonly mimeType: 'application/json';
  readonly contents: string;
};

export function exportConversionReportJson(report: ConversionReport): ConversionReportJsonExport {
  return {
    fileName: reportFileName(report.queueId),
    mimeType: 'application/json',
    contents: `${JSON.stringify(report, null, 2)}\n`,
  };
}

function reportFileName(queueId: QueueId): string {
  return `conversion-report-${String(queueId).replace(/[^a-zA-Z0-9_-]/g, '-')}.json`;
}
