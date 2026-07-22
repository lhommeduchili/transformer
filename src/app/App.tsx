import { useEffect, useRef, useState } from 'react';

import {
  importAudioAssets,
  type ImportRejection,
} from '../features/import/application/import-audio-assets';
import type { AudioAsset } from '../features/import/domain/audio-asset';
import { ImportPanel } from '../features/import/ui/ImportPanel';
import { inspectAudioAssets } from '../features/inspection/application/inspect-audio-assets';
import type { TrackInspection } from '../features/inspection/domain/track-inspection';
import { InspectionSummary } from '../features/inspection/ui/InspectionSummary';
import { MetadataAuditPanel } from '../features/inspection/ui/MetadataAuditPanel';
import { MetadataIssuesPanel } from '../features/inspection/ui/MetadataIssuesPanel';
import type { OutputDestination } from '../features/output/domain/output-destination';
import { OutputDestinationPanel } from '../features/output/ui/OutputDestinationPanel';
import {
  getAvailablePresets,
  getInitialPreset,
} from '../features/presets/application/get-built-in-presets';
import { previewFilenamesForPreset } from '../features/presets/application/preview-output-filenames';
import { validateAssetsForPreset } from '../features/presets/application/validate-assets-for-preset';
import type { ConversionPreset } from '../features/presets/domain/conversion-preset';
import { CompatibilitySummary } from '../features/presets/ui/CompatibilitySummary';
import { OutputFilenamePreview } from '../features/presets/ui/OutputFilenamePreview';
import { PresetSelector } from '../features/presets/ui/PresetSelector';
import { QueuePanel } from '../features/queue/ui/QueuePanel';
import { buildConversionReport } from '../features/reports/application/build-conversion-report';
import { exportConversionReportJson } from '../features/reports/application/export-conversion-report-json';
import { ReportPanel } from '../features/reports/ui/ReportPanel';
import { defaultServices, type CompositionServices } from './composition-root';
import { PwaStatus } from './PwaStatus';

const presets = getAvailablePresets();
const signatureText = 'made with ♥ by alφ';

export function App({ services = defaultServices }: { readonly services?: CompositionServices }) {
  useEffect(() => {
    services.analyticsAdapter.init();
  }, [services.analyticsAdapter]);

  const importChainRef = useRef(Promise.resolve());
  const importGenerationRef = useRef(0);
  const [assets, setAssets] = useState<readonly AudioAsset[]>([]);
  const [rejected, setRejected] = useState<readonly ImportRejection[]>([]);
  const [inspections, setInspections] = useState<readonly TrackInspection[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset>(() => {
    const preferredPresetId = services.preferences.load().presetId;
    return presets.find((preset) => preset.id === preferredPresetId) ?? getInitialPreset();
  });
  const [outputDestination, setOutputDestination] = useState<OutputDestination>(
    services.outputWriter.destination,
  );
  const [queueDestination, setQueueDestination] = useState<OutputDestination | undefined>();
  const [outputError, setOutputError] = useState<string | undefined>(undefined);
  const queue = services.useQueueStore((state) => state.queue);
  const queueError = services.useQueueStore((state) => state.error);
  const planQueue = services.useQueueStore((state) => state.planQueue);
  const startQueue = services.useQueueStore((state) => state.startQueue);
  const pauseQueue = services.useQueueStore((state) => state.pauseQueue);
  const resumeQueue = services.useQueueStore((state) => state.resumeQueue);
  const cancelQueue = services.useQueueStore((state) => state.cancelQueue);
  const retryFailedJobs = services.useQueueStore((state) => state.retryFailedJobs);
  const resetQueue = services.useQueueStore((state) => state.resetQueue);
  const skipQueueJob = services.useQueueStore((state) => state.skipJob);
  const filenamePreviews = previewFilenamesForPreset(assets, selectedPreset);
  const validations = validateAssetsForPreset(inspections, selectedPreset);
  const canRemoveImportedAssets =
    queue === undefined || !['running', 'paused', 'cancelling'].includes(queue.status);
  const report =
    queue === undefined
      ? undefined
      : buildConversionReport({
          queue,
          assets,
          preset: presetForQueue(queue) ?? selectedPreset,
          destination: queueDestination ?? outputDestination,
          generatedAt: queue.completedAt ?? services.clock.now(),
          inspections,
        });

  function handleFilesSelected(files: readonly File[]): Promise<void> {
    const queuedImport = importChainRef.current.then(() => importSelectedFiles(files));
    importChainRef.current = queuedImport.catch(() => undefined);
    return queuedImport;
  }

  async function importSelectedFiles(files: readonly File[]) {
    const generation = importGenerationRef.current;
    const references = services.fileImportAdapter.fromFileList(files);
    const imported = importAudioAssets(references, {
      idGenerator: services.idGenerator,
      clock: services.clock,
    });

    for (const { asset, file } of imported.accepted) {
      if (file.original instanceof File) {
        services.fileRegistry.register(asset.id, file.original);
      }
    }

    const importedInspections = await inspectAudioAssets(
      imported.assets,
      services.inspectionAdapter,
    );
    if (generation !== importGenerationRef.current) {
      for (const asset of imported.assets) services.fileRegistry.unregister(asset.id);
      return;
    }
    setAssets((current) => [...current, ...imported.assets]);
    setRejected((current) => [...current, ...imported.rejected]);
    setInspections((current) => [...current, ...importedInspections]);
  }

  function handleRemoveAsset(assetId: AudioAsset['id']) {
    if (!canRemoveImportedAssets) return;

    setAssets(assets.filter((asset) => asset.id !== assetId));
    setInspections(inspections.filter((inspection) => inspection.assetId !== assetId));
    services.fileRegistry.unregister(assetId);

    if (queue !== undefined) {
      resetQueue();
      setQueueDestination(undefined);
    }
  }

  function handleClearAssets() {
    if (!canRemoveImportedAssets) return;

    importGenerationRef.current += 1;
    setAssets([]);
    setInspections([]);
    services.fileRegistry.clear();

    if (queue !== undefined) {
      resetQueue();
      setQueueDestination(undefined);
    }
  }

  async function handleChooseOutputDestination() {
    try {
      const selected = await services.outputWriter.chooseDestination();
      setOutputDestination(selected.destination);
      setOutputError(undefined);
    } catch (error) {
      setOutputError(
        error instanceof Error ? error.message : 'Unable to choose output destination.',
      );
    }
  }

  function configureRealExecutor(preset: ConversionPreset): boolean {
    if (outputDestination.type === 'directory' && outputDestination.name === 'No folder selected') {
      setOutputError('choose an output folder before creating the conversion queue.');
      return false;
    }

    const configured = services.configureRealExecutor(preset);
    if (configured) {
      setQueueDestination(outputDestination);
    }
    return configured;
  }

  function handleExportReportJson() {
    if (queue === undefined) return;

    const exported = exportConversionReportJson(
      buildConversionReport({
        queue,
        assets,
        preset: presetForQueue(queue) ?? selectedPreset,
        destination: queueDestination ?? outputDestination,
        generatedAt: services.clock.now(),
        inspections,
      }),
    );
    const url = URL.createObjectURL(new Blob([exported.contents], { type: exported.mimeType }));
    const link = document.createElement('a');

    link.href = url;
    link.download = exported.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <PwaStatus />
      <header className="app-bar" aria-labelledby="app-title">
        <h1 id="app-title">transformer</h1>
      </header>

      <section className="workbench" aria-label="conversion workbench">
        <div className="workbench-primary">
          <ImportPanel
            assets={assets}
            rejected={rejected}
            canRemoveAssets={canRemoveImportedAssets}
            onRemoveAsset={handleRemoveAsset}
            onClearAssets={handleClearAssets}
            onFilesSelected={(files) => {
              void handleFilesSelected(files);
            }}
            onFilesDropped={async (dataTransfer) => {
              await handleFilesSelected(
                await services.fileImportAdapter.fromDataTransfer(dataTransfer),
              );
            }}
            supportsFolderDrop={services.browserCapabilities.folderDrop}
          />
          <div className="queue-panel-slot">
            <QueuePanel
              assets={assets}
              previews={filenamePreviews}
              selectedPreset={selectedPreset}
              queue={queue}
              error={queueError}
              onPlanQueue={(previews, preset) => {
                if (configureRealExecutor(preset)) {
                  planQueue(previews, preset);
                }
              }}
              onStartQueue={startQueue}
              onPauseQueue={pauseQueue}
              onResumeQueue={resumeQueue}
              onCancelQueue={cancelQueue}
              onRetryFailed={retryFailedJobs}
              onResetQueue={() => {
                resetQueue();
                setQueueDestination(undefined);
              }}
              onSkipJob={skipQueueJob}
            />
          </div>
        </div>

        <aside className="workbench-setup" aria-label="conversion setup">
          <div className="setup-controls-stack">
            <PresetSelector
              presets={presets}
              selectedPreset={selectedPreset}
              onPresetSelected={(preset) => {
                setSelectedPreset(preset);
                services.preferences.save({ presetId: preset.id });
              }}
            />
            <OutputDestinationPanel
              destination={outputDestination}
              supportsFolderSelection={services.outputWriter.destination.type === 'directory'}
              canChooseDestination={canRemoveImportedAssets}
              error={outputError}
              onChooseDestination={() => {
                void handleChooseOutputDestination();
              }}
            />
          </div>
          <ReportPanel report={report} onExportJson={handleExportReportJson} />
        </aside>
      </section>

      {assets.length > 0 ? (
        <section className="details-stack" aria-label="secondary details">
          <div className="details-column">
            <InspectionSummary inspections={inspections} />
            <CompatibilitySummary validations={validations} />
          </div>
          <div className="details-column">
            <MetadataAuditPanel inspections={inspections} />
            <OutputFilenamePreview previews={filenamePreviews} />
          </div>
          <div className="details-column">
            <MetadataIssuesPanel inspections={inspections} />
          </div>
        </section>
      ) : null}

      <footer className="app-footer">
        <AnimatedSignature />
      </footer>
    </main>
  );
}

function presetForQueue(
  queue: NonNullable<ReturnType<CompositionServices['useQueueStore']['getState']>['queue']>,
) {
  const presetId = queue.jobs[0]?.presetId;
  return presets.find((preset) => preset.id === presetId);
}

function AnimatedSignature() {
  const [displayText, setDisplayText] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return signatureText;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? signatureText : '';
  });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let position = 0;
    let mode: 'typing' | 'full-pause' | 'deleting' | 'empty-pause' = 'typing';
    let timeoutId: number | undefined;

    function typeDelay(character: string): number {
      if (character === ' ') return 90 + Math.random() * 80;
      if (character === '♥' || character === 'φ') return 190 + Math.random() * 140;
      return 42 + Math.random() * 115;
    }

    function deleteDelay(): number {
      return 24 + Math.random() * 62;
    }

    function step() {
      if (mode === 'typing') {
        position += 1;
        setDisplayText(signatureText.slice(0, position));

        if (position >= signatureText.length) {
          mode = 'full-pause';
          timeoutId = window.setTimeout(step, 1650 + Math.random() * 650);
          return;
        }

        timeoutId = window.setTimeout(step, typeDelay(signatureText[position - 1] ?? ''));
        return;
      }

      if (mode === 'full-pause') {
        mode = 'deleting';
        timeoutId = window.setTimeout(step, 280 + Math.random() * 160);
        return;
      }

      if (mode === 'deleting') {
        position -= 1;
        setDisplayText(signatureText.slice(0, Math.max(0, position)));

        if (position <= 0) {
          mode = 'empty-pause';
          timeoutId = window.setTimeout(step, 680 + Math.random() * 480);
          return;
        }

        timeoutId = window.setTimeout(step, deleteDelay());
        return;
      }

      mode = 'typing';
      timeoutId = window.setTimeout(step, 320 + Math.random() * 280);
    }

    timeoutId = window.setTimeout(step, 420 + Math.random() * 260);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <a
      className="signature-line"
      href="https://lhommeduchili.xyz"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="visually-hidden">{signatureText}</span>
      <span aria-hidden="true">{displayText}</span>
      <span className="signature-cursor" aria-hidden="true" />
    </a>
  );
}
