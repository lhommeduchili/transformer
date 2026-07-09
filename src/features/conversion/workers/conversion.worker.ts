import { FFmpeg } from '@ffmpeg/ffmpeg';

import type { ConversionWorkerCommand, ConversionWorkerEvent } from './conversion-worker-protocol';

let ffmpeg: FFmpeg | undefined;
let loaded = false;
let cancelledCommandId: string | undefined;

function post(event: ConversionWorkerEvent) {
  self.postMessage(event);
}

function getFfmpeg(): FFmpeg {
  ffmpeg ??= new FFmpeg();
  return ffmpeg;
}

async function loadFfmpeg(commandId: string) {
  const instance = getFfmpeg();

  if (!loaded) {
    instance.on('progress', ({ progress }) => {
      post({ type: 'ConversionProgressed', commandId, ratio: progress });
    });
    await instance.load();
    loaded = true;
  }

  post({ type: 'FfmpegLoaded', commandId });
}

async function convertAudio(
  command: Extract<ConversionWorkerCommand, { readonly type: 'ConvertAudio' }>,
) {
  const instance = getFfmpeg();
  cancelledCommandId = undefined;
  post({ type: 'ConversionStarted', commandId: command.commandId });

  try {
    if (!loaded) {
      await loadFfmpeg(command.commandId);
    }

    await instance.writeFile(command.inputName, command.inputData);
    await instance.exec([...command.args]);

    if (cancelledCommandId === command.commandId) {
      post({ type: 'ConversionCancelled', commandId: command.commandId });
      return;
    }

    const output = await instance.readFile(command.outputName);
    await cleanupFiles(instance, command.inputName, command.outputName);

    post({
      type: 'ConversionCompleted',
      commandId: command.commandId,
      outputName: command.outputName,
      outputData: output instanceof Uint8Array ? output : new TextEncoder().encode(output),
      mimeType: command.mimeType,
    });
  } catch (error) {
    await cleanupFiles(instance, command.inputName, command.outputName);
    post({
      type: 'ConversionFailed',
      commandId: command.commandId,
      message: error instanceof Error ? error.message : 'Unknown conversion failure.',
    });
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
        cancelledCommandId = command.commandId;
        ffmpeg?.terminate();
        loaded = false;
        post({ type: 'ConversionCancelled', commandId: command.commandId });
        break;
      case 'Dispose':
        ffmpeg?.terminate();
        ffmpeg = undefined;
        loaded = false;
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
