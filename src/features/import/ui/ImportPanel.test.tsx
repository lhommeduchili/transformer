import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { AudioAsset } from '../domain/audio-asset';
import { ImportPanel } from './ImportPanel';

function fixtureAsset(): AudioAsset {
  const id = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1024);
  const importedAt = createDateTimeIso('2026-07-08T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: 'Artist - Song.flac',
    sizeBytes: sizeBytes.value,
    mimeType: 'audio/flac',
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

describe('ImportPanel', () => {
  it('provides a keyboard-accessible file picker', () => {
    render(
      <ImportPanel
        assets={[]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={() => undefined}
        onClearAssets={() => undefined}
        onFilesSelected={() => undefined}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    expect(screen.getByLabelText(/choose audio files/i)).toBeInTheDocument();
  });

  it('emits selected files from the file input', () => {
    const onFilesSelected = vi.fn();
    const file = new File(['placeholder'], 'track.mp3', { type: 'audio/mpeg' });

    render(
      <ImportPanel
        assets={[]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={() => undefined}
        onClearAssets={() => undefined}
        onFilesSelected={onFilesSelected}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    fireEvent.change(screen.getByLabelText(/choose audio files/i), { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('renders imported tracks inside the drop surface', () => {
    render(
      <ImportPanel
        assets={[fixtureAsset()]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={() => undefined}
        onClearAssets={() => undefined}
        onFilesSelected={() => undefined}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    expect(screen.getByLabelText(/imported audio files/i)).toHaveTextContent('Artist - Song.flac');
    expect(screen.getByRole('button', { name: /choose files/i })).toBeInTheDocument();
  });

  it('emits imported track removals', () => {
    const asset = fixtureAsset();
    const onRemoveAsset = vi.fn();

    render(
      <ImportPanel
        assets={[asset]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={onRemoveAsset}
        onClearAssets={() => undefined}
        onFilesSelected={() => undefined}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove artist - song.flac/i }));

    expect(onRemoveAsset).toHaveBeenCalledWith(asset.id);
  });

  it('emits clear all for imported tracks', () => {
    const onClearAssets = vi.fn();

    render(
      <ImportPanel
        assets={[fixtureAsset()]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={() => undefined}
        onClearAssets={onClearAssets}
        onFilesSelected={() => undefined}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClearAssets).toHaveBeenCalledTimes(1);
  });

  it('marks the drop surface active during drag', () => {
    render(
      <ImportPanel
        assets={[]}
        rejected={[]}
        canRemoveAssets={true}
        onRemoveAsset={() => undefined}
        onClearAssets={() => undefined}
        onFilesSelected={() => undefined}
        onFilesDropped={() => Promise.resolve()}
        supportsFolderDrop={false}
      />,
    );

    const dropZone = screen.getByRole('heading', { name: /drop audio/i }).closest('.drop-zone');
    if (dropZone === null) throw new Error('Expected drop zone.');

    fireEvent.dragEnter(dropZone);

    expect(dropZone).toHaveClass('drop-zone--active');
  });
});
