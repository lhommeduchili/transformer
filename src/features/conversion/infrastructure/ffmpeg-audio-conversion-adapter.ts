import { createProgressPercent } from '../../../shared/domain/numbers';
import type { AudioConversionPort } from '../application/audio-conversion-port';
import { buildFfmpegArgs } from '../application/build-ffmpeg-args';
import type {
  AudioConversionCommand,
  AudioConversionResult,
} from '../application/conversion-command';
import type { AudioConversionProgressEvent } from '../application/conversion-progress-events';
import type { ConversionWorkerEvent } from '../workers/conversion-worker-protocol';
import type { ConversionWorkerRuntime } from './worker-runtime-adapter';

export function createFfmpegAudioConversionAdapter(
  runtime: ConversionWorkerRuntime,
): AudioConversionPort {
  let activeCommandId: string | undefined;

  return {
    convert: (command, input, onProgress) => {
      const commandId = crypto.randomUUID();
      activeCommandId = commandId;
      const plan = buildFfmpegArgs(command.preset, command.inputName, command.outputName);

      return new Promise<AudioConversionResult>((resolve, reject) => {
        const unsubscribe = runtime.subscribe((event) => {
          if ('commandId' in event && event.commandId !== commandId) {
            return;
          }

          handleWorkerEvent(event, command, onProgress, resolve, reject, () => {
            if (activeCommandId === commandId) {
              activeCommandId = undefined;
            }
            unsubscribe();
          });
        });

        runtime.post(
          {
            type: 'ConvertAudio',
            commandId,
            inputName: plan.inputName,
            outputName: plan.outputName,
            inputData: input,
            args: plan.args,
            mimeType: plan.mimeType,
          },
          [input.buffer],
        );
      });
    },
    cancel: () => {
      if (activeCommandId !== undefined) {
        runtime.post({ type: 'CancelConversion', commandId: activeCommandId });
      }
    },
    dispose: () => {
      runtime.post({ type: 'Dispose', commandId: crypto.randomUUID() });
      runtime.terminate();
    },
  };
}

function handleWorkerEvent(
  event: ConversionWorkerEvent,
  command: AudioConversionCommand,
  onProgress: (event: AudioConversionProgressEvent) => void,
  resolve: (result: AudioConversionResult) => void,
  reject: (error: Error) => void,
  finish: () => void,
) {
  switch (event.type) {
    case 'ConversionProgressed': {
      const percent = createProgressPercent(
        Math.max(0, Math.min(100, Math.round(event.ratio * 100))),
      );
      if (percent.ok) {
        onProgress({ assetId: command.assetId, percent: percent.value, ratio: event.ratio });
      }
      break;
    }
    case 'ConversionCompleted':
      finish();
      resolve({
        assetId: command.assetId,
        outputName: event.outputName,
        data: event.outputData,
        mimeType: event.mimeType,
      });
      break;
    case 'ConversionCancelled':
      finish();
      reject(new Error('Conversion cancelled.'));
      break;
    case 'ConversionFailed':
      finish();
      reject(new Error(event.message));
      break;
    case 'WorkerFailed':
      finish();
      reject(new Error(event.message));
      break;
    case 'WorkerReady':
    case 'FfmpegLoaded':
    case 'ConversionStarted':
      break;
  }
}
