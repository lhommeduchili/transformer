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
      <details className="report-job-details">
        <summary>job details ({report.jobs.length})</summary>
        <ul className="detail-list" aria-label="report job details">
          {report.jobs.map((job) => (
            <li key={job.jobId}>
              <strong>{job.sourceName}</strong>
              {' → '}
              {job.outputName} · {job.status} · attempts: {job.attempts}
              {job.metadata === undefined
                ? ''
                : ` · metadata: ${job.metadata.completeness}${
                    job.metadata.missingFields.length === 0
                      ? ''
                      : ` · missing ${job.metadata.missingFields.join(', ')}`
                  }`}
              {job.errors.length === 0 ? '' : ` · errors: ${job.errors.join('; ')}`}
            </li>
          ))}
        </ul>
      </details>
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
