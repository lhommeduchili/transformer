import type { TrackInspection } from '../domain/track-inspection';

type InspectionSummaryProps = {
  readonly inspections: readonly TrackInspection[];
};

export function InspectionSummary({ inspections }: InspectionSummaryProps) {
  if (inspections.length === 0) {
    return null;
  }

  return (
    <details className="disclosure-panel">
      <summary id="inspection-title">
        <span>checks</span>
        <span>{inspections.length}</span>
      </summary>

      <ul className="detail-list" aria-label="inspection results">
        {inspections.map((inspection) => (
          <li key={inspection.assetId}>
            <strong>
              {inspection.container ?? 'unknown'} / {inspection.codec ?? 'unknown'}
            </strong>
            <span>
              {inspection.bitrateKbps ? `${inspection.bitrateKbps}kbps` : 'bitrate unknown'} ·
              {inspection.sampleRateHz ? ` ${inspection.sampleRateHz}hz` : ' sample rate unknown'} ·{' '}
              {inspection.channels ? `${inspection.channels} channels` : 'channels unknown'}
            </span>
            {inspection.warnings.length > 0 ? (
              <span>{inspection.warnings.map((warning) => warning.message).join(' ')}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
