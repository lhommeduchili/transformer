import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  importAudioAssets,
  type ImportRejection,
} from '../features/import/application/import-audio-assets';
import type { AudioAsset } from '../features/import/domain/audio-asset';
import { createBrowserFileImportAdapter } from '../features/import/infrastructure/browser-file-import-adapter';
import { ImportPanel } from '../features/import/ui/ImportPanel';
import { inspectAudioAssets } from '../features/inspection/application/inspect-audio-assets';
import type { TrackInspection } from '../features/inspection/domain/track-inspection';
import { createBrowserLocalAudioInspectionAdapter } from '../features/inspection/infrastructure/browser-local-audio-inspection-adapter';
import { InspectionSummary } from '../features/inspection/ui/InspectionSummary';
import { createImportedFileRegistry } from '../features/import/application/imported-file-registry';
import { createFfmpegAudioConversionAdapter } from '../features/conversion/infrastructure/ffmpeg-audio-conversion-adapter';
import { createConversionWorkerRuntime } from '../features/conversion/infrastructure/worker-runtime-adapter';
import type { AudioConversionPort } from '../features/conversion/application/audio-conversion-port';
import type { OutputDestination } from '../features/output/application/output-destination';
import { createBestAvailableOutputWriter } from '../features/output/infrastructure/output-writer-factory';
import { supportsFileSystemAccess } from '../features/output/infrastructure/file-system-access-output-writer';
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
import { createQueueStore } from '../features/queue/application/queue-store';
import type { QueueExecutorPort } from '../features/queue/application/queue-executor-port';
import { createConversionOutputQueueExecutor } from '../features/queue/infrastructure/conversion-output-queue-executor';
import { createMockQueueExecutor } from '../features/queue/infrastructure/mock-queue-executor';
import { QueuePanel } from '../features/queue/ui/QueuePanel';
import { buildConversionReport } from '../features/reports/application/build-conversion-report';
import { exportConversionReportJson } from '../features/reports/application/export-conversion-report-json';
import { ReportPanel } from '../features/reports/ui/ReportPanel';
import {
  createCryptoAudioAssetIdGenerator,
  createCryptoConversionJobIdGenerator,
  createCryptoQueueIdGenerator,
} from '../shared/infrastructure/browser/crypto-id-generator';
import { createSystemClock } from '../shared/infrastructure/browser/system-clock';

const fileImportAdapter = createBrowserFileImportAdapter();
const idGenerator = createCryptoAudioAssetIdGenerator();
const clock = createSystemClock();
const presets = getAvailablePresets();
const signatureText = 'made with ♥ by alφ';
const fileRegistry = createImportedFileRegistry();
const inspectionAdapter = createBrowserLocalAudioInspectionAdapter(fileRegistry);
const outputWriter = createBestAvailableOutputWriter();
const mockQueueExecutor = createMockQueueExecutor(clock);
let activeQueueExecutor: QueueExecutorPort = mockQueueExecutor;
let conversionAdapter: AudioConversionPort | undefined;
const delegatingQueueExecutor: QueueExecutorPort = {
  execute: (queue, options) => activeQueueExecutor.execute(queue, options),
};
const useQueueStore = createQueueStore({
  queueIdGenerator: createCryptoQueueIdGenerator(),
  jobIdGenerator: createCryptoConversionJobIdGenerator(),
  clock,
  executor: delegatingQueueExecutor,
});

function getConversionAdapter(): AudioConversionPort {
  conversionAdapter ??= createFfmpegAudioConversionAdapter(createConversionWorkerRuntime());
  return conversionAdapter;
}

export function App() {
  const setupControlsRef = useRef<HTMLDivElement>(null);
  const [setupControlsHeight, setSetupControlsHeight] = useState<number | undefined>(undefined);
  const [assets, setAssets] = useState<readonly AudioAsset[]>([]);
  const [rejected, setRejected] = useState<readonly ImportRejection[]>([]);
  const [inspections, setInspections] = useState<readonly TrackInspection[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset>(() => getInitialPreset());
  const [outputDestination, setOutputDestination] = useState<OutputDestination>(
    outputWriter.destination,
  );
  const [outputError, setOutputError] = useState<string | undefined>(undefined);
  const queue = useQueueStore((state) => state.queue);
  const queueError = useQueueStore((state) => state.error);
  const planQueue = useQueueStore((state) => state.planQueue);
  const startQueue = useQueueStore((state) => state.startQueue);
  const pauseQueue = useQueueStore((state) => state.pauseQueue);
  const resumeQueue = useQueueStore((state) => state.resumeQueue);
  const cancelQueue = useQueueStore((state) => state.cancelQueue);
  const retryFailedJobs = useQueueStore((state) => state.retryFailedJobs);
  const resetQueue = useQueueStore((state) => state.resetQueue);
  const skipQueueJob = useQueueStore((state) => state.skipJob);
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
          preset: selectedPreset,
          destination: outputDestination,
          generatedAt: queue.completedAt ?? clock.now(),
        });

  useEffect(() => {
    const element = setupControlsRef.current;
    if (element === null || typeof ResizeObserver !== 'function') return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;
      setSetupControlsHeight(Math.ceil(entry.contentRect.height));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  async function handleFilesSelected(files: readonly File[]) {
    const references = fileImportAdapter.fromFileList(files);
    const imported = importAudioAssets(references, { idGenerator, clock });
    const nextAssets = [...assets, ...imported.assets];

    for (const asset of imported.assets) {
      const reference = references.find(
        (candidate) => candidate.name === asset.sourceName && candidate.original instanceof File,
      );

      if (reference?.original instanceof File) {
        fileRegistry.register(asset.id, reference.original);
      }
    }

    setAssets(nextAssets);
    setRejected([...rejected, ...imported.rejected]);
    setInspections(await inspectAudioAssets(nextAssets, inspectionAdapter));
  }

  function handleRemoveAsset(assetId: AudioAsset['id']) {
    if (!canRemoveImportedAssets) return;

    setAssets(assets.filter((asset) => asset.id !== assetId));
    setInspections(inspections.filter((inspection) => inspection.assetId !== assetId));
    fileRegistry.unregister(assetId);

    if (queue !== undefined) {
      resetQueue();
    }
  }

  function handleClearAssets() {
    if (!canRemoveImportedAssets) return;

    setAssets([]);
    setInspections([]);
    fileRegistry.clear();

    if (queue !== undefined) {
      resetQueue();
    }
  }

  async function handleChooseOutputDestination() {
    try {
      const selected = await outputWriter.chooseDestination();
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

    activeQueueExecutor = createConversionOutputQueueExecutor(getConversionAdapter(), clock, {
      preset,
      fileRegistry,
      outputWriter,
    });
    return true;
  }

  function handleExportReportJson() {
    if (queue === undefined) return;

    const exported = exportConversionReportJson(
      buildConversionReport({
        queue,
        assets,
        preset: selectedPreset,
        destination: outputDestination,
        generatedAt: clock.now(),
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
      <header className="app-bar" aria-labelledby="app-title">
        <h1 id="app-title">transformer</h1>
        <HeaderSignature />
      </header>

      <section
        className="workbench"
        aria-label="conversion workbench"
        style={
          setupControlsHeight === undefined
            ? undefined
            : ({ '--drop-zone-min-height': `${setupControlsHeight}px` } as CSSProperties)
        }
      >
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
          />
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
            onResetQueue={resetQueue}
            onSkipJob={skipQueueJob}
          />
        </div>

        <aside className="workbench-setup" aria-label="conversion setup">
          <div ref={setupControlsRef} className="setup-controls-stack">
            <PresetSelector
              presets={presets}
              selectedPreset={selectedPreset}
              onPresetSelected={setSelectedPreset}
            />
            <OutputDestinationPanel
              destination={outputDestination}
              supportsFolderSelection={supportsFileSystemAccess()}
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
          <InspectionSummary inspections={inspections} />
          <CompatibilitySummary validations={validations} />
          <OutputFilenamePreview previews={filenamePreviews} />
        </section>
      ) : null}
    </main>
  );
}

function HeaderSignature() {
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
    <p className="signature-line">
      <span className="visually-hidden">{signatureText}</span>
      <span aria-hidden="true">{displayText}</span>
      <span className="signature-cursor" aria-hidden="true" />
    </p>
  );
}
