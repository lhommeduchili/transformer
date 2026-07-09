import type { ImportRejection } from '../application/import-audio-assets';
import type { AudioAsset } from '../domain/audio-asset';

type ImportedAssetsListProps = {
  readonly assets: readonly AudioAsset[];
  readonly rejected: readonly ImportRejection[];
};

export function ImportedAssetsList({ assets, rejected }: ImportedAssetsListProps) {
  if (assets.length === 0 && rejected.length === 0) {
    return null;
  }

  return (
    <section className="asset-panel" aria-labelledby="import-results-title">
      <div className="panel-heading">
        <h2 id="import-results-title">tracks</h2>
        <span>{assets.length}</span>
      </div>

      {assets.length > 0 ? (
        <ul className="track-list" aria-label="imported audio files">
          {assets.map((asset) => (
            <li className="track-row" key={asset.id}>
              <strong>{asset.sourceName}</strong>
              <span>{asset.extension}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {rejected.length > 0 ? (
        <div className="rejected-files" role="status" aria-live="polite">
          <h3>rejected</h3>
          <ul className="detail-list" aria-label="rejected files">
            {rejected.map((file) => (
              <li key={`${file.name}-${file.extension}`}>
                <strong>{file.name}</strong>
                <span>{file.reason.replaceAll('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
