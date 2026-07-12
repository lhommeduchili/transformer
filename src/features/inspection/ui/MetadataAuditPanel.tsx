import type { TrackInspection } from '../domain/track-inspection';

type Props = {
  readonly inspections: readonly TrackInspection[];
};

export function MetadataAuditPanel({ inspections }: Props) {
  if (inspections.length === 0) return null;

  const missingTitle = inspections.filter((i) =>
    i.metadataAssessment.missingFields.includes('title'),
  ).length;
  const missingArtist = inspections.filter((i) =>
    i.metadataAssessment.missingFields.includes('artist'),
  ).length;
  const missingAlbum = inspections.filter((i) =>
    i.metadataAssessment.missingFields.includes('album'),
  ).length;
  const artworkPresent = inspections.filter(
    (i) => i.metadataAssessment.artwork === 'present',
  ).length;

  return (
    <details className="disclosure-panel">
      <summary id="metadata-audit-title">metadata audit</summary>
      <dl className="disclosure-content" aria-label="metadata audit summary">
        <dt>tracks</dt>
        <dd>{inspections.length}</dd>
        <dt>missing title</dt>
        <dd>{missingTitle}</dd>
        <dt>missing artist</dt>
        <dd>{missingArtist}</dd>
        <dt>missing album</dt>
        <dd>{missingAlbum}</dd>
        <dt>artwork present</dt>
        <dd>{artworkPresent}</dd>
      </dl>
    </details>
  );
}
