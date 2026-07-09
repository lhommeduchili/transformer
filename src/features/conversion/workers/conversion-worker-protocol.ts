export type ConversionWorkerCommand =
  | { readonly type: 'LoadFfmpeg'; readonly commandId: string }
  | {
      readonly type: 'ConvertAudio';
      readonly commandId: string;
      readonly inputName: string;
      readonly outputName: string;
      readonly inputData: Uint8Array;
      readonly args: readonly string[];
      readonly mimeType: string;
    }
  | { readonly type: 'CancelConversion'; readonly commandId: string }
  | { readonly type: 'Dispose'; readonly commandId: string };

export type ConversionWorkerEvent =
  | { readonly type: 'WorkerReady' }
  | { readonly type: 'FfmpegLoaded'; readonly commandId: string }
  | { readonly type: 'ConversionStarted'; readonly commandId: string }
  | { readonly type: 'ConversionProgressed'; readonly commandId: string; readonly ratio: number }
  | {
      readonly type: 'ConversionCompleted';
      readonly commandId: string;
      readonly outputName: string;
      readonly outputData: Uint8Array;
      readonly mimeType: string;
    }
  | { readonly type: 'ConversionCancelled'; readonly commandId: string }
  | { readonly type: 'ConversionFailed'; readonly commandId: string; readonly message: string }
  | { readonly type: 'WorkerFailed'; readonly message: string };

export function isTerminalWorkerEvent(event: ConversionWorkerEvent): boolean {
  return [
    'ConversionCompleted',
    'ConversionCancelled',
    'ConversionFailed',
    'WorkerFailed',
  ].includes(event.type);
}
