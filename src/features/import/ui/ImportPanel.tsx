import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import type { ImportRejection } from '../application/import-audio-assets';
import type { AudioAsset } from '../domain/audio-asset';

type ImportPanelProps = {
  readonly assets: readonly AudioAsset[];
  readonly rejected: readonly ImportRejection[];
  readonly canRemoveAssets: boolean;
  readonly onRemoveAsset: (assetId: AudioAsset['id']) => void;
  readonly onClearAssets: () => void;
  readonly onFilesSelected: (files: readonly File[]) => void;
  readonly onFilesDropped: (dataTransfer: DataTransfer) => Promise<void>;
  readonly supportsFolderDrop: boolean;
};

export function ImportPanel({
  assets,
  rejected,
  canRemoveAssets,
  onRemoveAsset,
  onClearAssets,
  onFilesSelected,
  onFilesDropped,
  supportsFolderDrop,
}: ImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsDragActive(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragActive(false);
    await onFilesDropped(event.dataTransfer);
  }

  function preventDefault(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return (
    <section className="import-panel" aria-labelledby="import-title">
      <div
        className={isDragActive ? 'drop-zone drop-zone--active' : 'drop-zone'}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={preventDefault}
        onDrop={(event) => {
          void handleDrop(event);
        }}
      >
        {assets.length > 0 || rejected.length > 0 ? (
          <div className="imported-track-region">
            <div
              className={
                assets.length === 0 && rejected.length > 0
                  ? 'panel-heading import-track-heading import-track-heading--rejected'
                  : 'panel-heading import-track-heading'
              }
            >
              <h3>
                tracks <span>({assets.length})</span>
              </h3>
              <button
                className="clear-track-action"
                type="button"
                onClick={onClearAssets}
                disabled={!canRemoveAssets || (assets.length === 0 && rejected.length === 0)}
              >
                clear
              </button>
            </div>

            {assets.length > 0 ? (
              <ul className="track-list" aria-label="imported audio files">
                {assets.map((asset) => (
                  <li className="track-row" key={asset.id}>
                    <strong>{asset.sourceName}</strong>
                    <div className="row-actions">
                      <button
                        className="inline-x-action"
                        type="button"
                        onClick={() => onRemoveAsset(asset.id)}
                        disabled={!canRemoveAssets}
                        aria-label={`remove ${asset.sourceName}`}
                      >
                        x
                      </button>
                    </div>
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
          </div>
        ) : null}

        <div className="import-actions">
          <div>
            <h2 id="import-title">drop audio</h2>
            <p className="format-line">
              {supportsFolderDrop ? 'files or folders' : 'files'} · flac / wav / aiff / mp3 / m4a /
              aac / ogg
            </p>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            choose files
          </button>
        </div>
        <input
          ref={inputRef}
          id="audio-file-input"
          className="visually-hidden"
          type="file"
          tabIndex={-1}
          multiple
          aria-label="choose audio files"
          accept="audio/*,.mp3,.wav,.aiff,.aif,.flac,.m4a,.aac,.ogg"
          onChange={handleFileInputChange}
        />
      </div>
    </section>
  );
}
