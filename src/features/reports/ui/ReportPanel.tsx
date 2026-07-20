import type { ConversionReport } from '../domain/conversion-report';

type ReportPanelProps = {
  readonly report: ConversionReport | undefined;
  readonly onExportJson: () => void;
};

export function ReportPanel({ report, onExportJson }: ReportPanelProps) {
  if (report === undefined) {
    return null;
  }

  return (
    <section className="panel setup-panel report-panel" aria-labelledby="report-title">
      <h2 id="report-title">report</h2>
      <dl aria-label="report summary">
        <dt>status</dt>
        <dd>{report.queueStatus}</dd>
        <dt>total</dt>
        <dd>{report.summary.total}</dd>
        <dt>done</dt>
        <dd>{report.summary.completed}</dd>
        <dt>failed</dt>
        <dd>{report.summary.failed}</dd>
        <dt>skipped</dt>
        <dd>{report.summary.skipped}</dd>
      </dl>
      <p id="report-export-guidance" className="control-guidance">
        local json
      </p>
      <button
        className="secondary-action"
        type="button"
        onClick={onExportJson}
        aria-describedby="report-export-guidance"
      >
        export json
      </button>
    </section>
  );
}
