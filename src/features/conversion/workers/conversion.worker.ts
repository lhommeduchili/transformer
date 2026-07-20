import { FFmpeg } from '@ffmpeg/ffmpeg';
import ffmpegCoreUrl from '@ffmpeg/core?url';
import ffmpegWasmUrl from '@ffmpeg/core/wasm?url';

import type { ConversionWorkerCommand, ConversionWorkerEvent } from './conversion-worker-protocol';

let ffmpeg: FFmpeg | undefined;
let loaded = false;
let cancelledCommandId: string | undefined;
let activeCommandId: string | undefined;

function post(event: ConversionWorkerEvent, transfer: readonly Transferable[] = []) {
  const scope = self as unknown as {
    readonly postMessage: (message: ConversionWorkerEvent, transfer: Transferable[]) => void;
  };
  scope.postMessage(event, [...transfer]);
}

function getFfmpeg(): FFmpeg {
  ffmpeg ??= new FFmpeg();
  return ffmpeg;
}

async function loadFfmpeg(commandId: string) {
  const instance = getFfmpeg();

  if (!loaded) {
    instance.on('progress', ({ progress }) => {
      if (activeCommandId !== undefined) {
        post({ type: 'ConversionProgressed', commandId: activeCommandId, ratio: progress });
      }
    });
    await instance.load({ coreURL: ffmpegCoreUrl, wasmURL: ffmpegWasmUrl });
    loaded = true;
  }

  post({ type: 'FfmpegLoaded', commandId });
}

async function convertAudio(
  command: Extract<ConversionWorkerCommand, { readonly type: 'ConvertAudio' }>,
) {
  const instance = getFfmpeg();
  cancelledCommandId = undefined;
  activeCommandId = command.commandId;
  post({ type: 'ConversionStarted', commandId: command.commandId });

  try {
    if (!loaded) {
      await loadFfmpeg(command.commandId);
    }

    await instance.writeFile(command.inputName, command.inputData);
    const exitCode = await instance.exec([...command.args]);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}.`);
    }

    if (cancelledCommandId === command.commandId) {
      post({ type: 'ConversionCancelled', commandId: command.commandId });
      return;
    }

    const output = await instance.readFile(command.outputName);
    await cleanupFiles(instance, command.inputName, command.outputName);

    const outputData =
      output instanceof Uint8Array ? output.slice() : new TextEncoder().encode(output);
    post(
      {
        type: 'ConversionCompleted',
        commandId: command.commandId,
        outputName: command.outputName,
        outputData,
        mimeType: command.mimeType,
      },
      [outputData.buffer],
    );
  } catch (error) {
    await cleanupFiles(instance, command.inputName, command.outputName);
    if (cancelledCommandId === command.commandId) {
      post({ type: 'ConversionCancelled', commandId: command.commandId });
    } else {
      post({
        type: 'ConversionFailed',
        commandId: command.commandId,
        message: error instanceof Error ? error.message : 'Unknown conversion failure.',
      });
    }
  } finally {
    if (activeCommandId === command.commandId) {
      activeCommandId = undefined;
    }
  }
}

async function cleanupFiles(instance: FFmpeg, inputName: string, outputName: string) {
  await Promise.allSettled([instance.deleteFile(inputName), instance.deleteFile(outputName)]);
}

self.addEventListener('message', (event: MessageEvent<ConversionWorkerCommand>) => {
  const command = event.data;

  void (async () => {
    switch (command.type) {
      case 'LoadFfmpeg':
        await loadFfmpeg(command.commandId);
        break;
      case 'ConvertAudio':
        await convertAudio(command);
        break;
      case 'CancelConversion':
        if (activeCommandId !== command.commandId) break;
        cancelledCommandId = command.commandId;
        ffmpeg?.terminate();
        ffmpeg = undefined;
        loaded = false;
        break;
      case 'Dispose':
        ffmpeg?.terminate();
        ffmpeg = undefined;
        loaded = false;
        activeCommandId = undefined;
        break;
    }
  })().catch((error: unknown) => {
    post({
      type: 'WorkerFailed',
      message: error instanceof Error ? error.message : 'Unknown worker failure.',
    });
  });
});

post({ type: 'WorkerReady' });
