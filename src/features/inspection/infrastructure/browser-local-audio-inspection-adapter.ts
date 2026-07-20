import type { ImportedFileRegistry } from '../../import/application/imported-file-registry';
import type { AudioInspectionPort } from '../application/audio-inspection-port';
import type { AudioHeaderInspectorPort } from '../application/audio-header-inspector-port';
import { createInspectionWorkerRuntime } from './inspection-worker-runtime';
import { createWorkerAudioHeaderInspectorAdapter } from './worker-audio-header-inspector-adapter';

const headerBytesToRead = 128 * 1024;

export function createBrowserLocalAudioInspectionAdapter(
  fileRegistry: ImportedFileRegistry,
  createHeaderInspector: () => AudioHeaderInspectorPort = () =>
    createWorkerAudioHeaderInspectorAdapter(createInspectionWorkerRuntime()),
): AudioInspectionPort {
  let headerInspector: AudioHeaderInspectorPort | undefined;

  return {
    inspect: async (assets) => {
      headerInspector ??= createHeaderInspector();
      const inspections = [];

      // Sequential reads keep large imports from queuing every header in memory at once.
      for (const asset of assets) {
        const file = fileRegistry.get(asset.id);
        const header = file === undefined ? new Uint8Array() : await readHeader(file);
        inspections.push(
          await headerInspector.inspectHeader({
            assetId: asset.id,
            extension: asset.extension,
            header,
          }),
        );
      }

      return inspections;
    },
  };
}

async function readHeader(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, headerBytesToRead).arrayBuffer());
}
