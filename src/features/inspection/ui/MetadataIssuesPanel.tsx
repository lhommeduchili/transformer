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
      <summary>metadata issues ({issues.length})</summary>
      <ul className="disclosure-content detail-list" aria-label="metadata issues">
        {issues.map((inspection) => (
          <li key={inspection.assetId}>
            {inspection.metadata.artist ?? 'unknown artist'} -{' '}
            {inspection.metadata.title ?? 'unknown title'}
            {' · missing: '}
            {inspection.metadataAssessment.missingFields.join(', ')}
          </li>
        ))}
      </ul>
    </details>
  );
}
