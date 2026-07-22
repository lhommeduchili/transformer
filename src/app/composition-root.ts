import { createBrowserFileImportAdapter } from '../features/import/infrastructure/browser-file-import-adapter';
import { createImportedFileRegistry } from '../features/import/application/imported-file-registry';
import { createBrowserLocalAudioInspectionAdapter } from '../features/inspection/infrastructure/browser-local-audio-inspection-adapter';
import { createBestAvailableOutputWriter } from '../features/output/infrastructure/output-writer-factory';
import { createBrowserPreferencesAdapter } from '../features/settings/infrastructure/browser-preferences-adapter';
import { createBestAvailableAnalyticsAdapter } from '../shared/infrastructure/browser/analytics-adapter-factory';
import {
  createCryptoAudioAssetIdGenerator,
  createCryptoConversionJobIdGenerator,
  createCryptoQueueIdGenerator,
} from '../shared/infrastructure/browser/crypto-id-generator';
import { createSystemClock } from '../shared/infrastructure/browser/system-clock';
import { createBrowserCapabilitiesAdapter } from '../shared/infrastructure/browser/browser-capabilities-adapter';
import { createFfmpegAudioConversionAdapter } from '../features/conversion/infrastructure/ffmpeg-audio-conversion-adapter';
import { createConversionWorkerRuntime } from '../features/conversion/infrastructure/worker-runtime-adapter';
import type { AudioConversionPort } from '../features/conversion/application/audio-conversion-port';
import type { ConversionPreset } from '../features/presets/domain/conversion-preset';
import type { QueueExecutorPort } from '../features/queue/application/queue-executor-port';
import { createMockQueueExecutor } from '../features/queue/infrastructure/mock-queue-executor';
import { createConversionOutputQueueExecutor } from '../features/queue/infrastructure/conversion-output-queue-executor';
import { createQueueStore } from '../features/queue/application/queue-store';

export function createCompositionRoot() {
  const fileImportAdapter = createBrowserFileImportAdapter();
  const idGenerator = createCryptoAudioAssetIdGenerator();
  const clock = createSystemClock();
  const analyticsAdapter = createBestAvailableAnalyticsAdapter();
  const fileRegistry = createImportedFileRegistry();
  const inspectionAdapter = createBrowserLocalAudioInspectionAdapter(fileRegistry);
  const outputWriter = createBestAvailableOutputWriter();
  const browserCapabilities = createBrowserCapabilitiesAdapter().detect();
  const preferences = createBrowserPreferencesAdapter();

  const mockQueueExecutor = createMockQueueExecutor(clock);
  let activeQueueExecutor: QueueExecutorPort = mockQueueExecutor;
  let conversionAdapter: AudioConversionPort | undefined;

  function getConversionAdapter(): AudioConversionPort {
    conversionAdapter ??= createFfmpegAudioConversionAdapter(createConversionWorkerRuntime());
    return conversionAdapter;
  }

  function configureRealExecutor(preset: ConversionPreset): boolean {
    if (
      outputWriter.destination.type === 'directory' &&
      outputWriter.destination.name === 'No folder selected'
    ) {
      return false;
    }

    activeQueueExecutor = createConversionOutputQueueExecutor(getConversionAdapter(), clock, {
      preset,
      fileRegistry,
      outputWriter,
    });
    return true;
  }

  const delegatingQueueExecutor: QueueExecutorPort = {
    execute: (queue, options) => activeQueueExecutor.execute(queue, options),
  };

  const useQueueStore = createQueueStore({
    queueIdGenerator: createCryptoQueueIdGenerator(),
    jobIdGenerator: createCryptoConversionJobIdGenerator(),
    clock,
    executor: delegatingQueueExecutor,
  });

  return {
    fileImportAdapter,
    idGenerator,
    clock,
    analyticsAdapter,
    fileRegistry,
    inspectionAdapter,
    outputWriter,
    browserCapabilities,
    preferences,
    useQueueStore,
    configureRealExecutor,
  };
}

export type CompositionServices = ReturnType<typeof createCompositionRoot>;

export const defaultServices = createCompositionRoot();
