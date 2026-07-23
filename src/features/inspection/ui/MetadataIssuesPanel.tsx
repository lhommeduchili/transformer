import type { TrackInspection } from '../domain/track-inspection';

type Props = {
  readonly inspections: readonly TrackInspection[];
};

export function MetadataIssuesPanel({ inspections }: Props) {
  const issues = inspections.filter(
    (inspection) => inspection.metadataAssessment.completeness !== 'complete',
  );

  if (issues.length === 0) return null;

  return (
    <details className="disclosure-panel">
      <summary id="metadata-issues-title">
        <span>
          metadata issues <span>({issues.length})</span>
        </span>
      </summary>
      <ul className="disclosure-content detail-list" aria-label="metadata issues">
        {issues.map((inspection) => (
          <li key={inspection.assetId}>
            <strong>
              {[inspection.metadata.artist, inspection.metadata.title]
                .filter(Boolean)
                .join(' - ') || 'unknown track'}
            </strong>
            <span>missing: {inspection.metadataAssessment.missingFields.join(', ')}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
