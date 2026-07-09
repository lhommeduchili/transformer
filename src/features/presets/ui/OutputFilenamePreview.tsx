import type { OutputFilenamePreview as OutputFilenamePreviewModel } from '../domain/output-filename-preview';

type OutputFilenamePreviewProps = {
  readonly previews: readonly OutputFilenamePreviewModel[];
};

export function OutputFilenamePreview({ previews }: OutputFilenamePreviewProps) {
  if (previews.length === 0) {
    return null;
  }

  return (
    <details className="disclosure-panel">
      <summary id="filename-preview-title">
        <span>filenames</span>
        <span>{previews.length}</span>
      </summary>

      <ul className="detail-list" aria-label="output filename previews">
        {previews.map((preview) => (
          <li key={preview.asset.id}>
            <strong>{preview.asset.sourceName}</strong>
            <span>{preview.outputName}</span>
            {preview.changed ? <span>changed</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
