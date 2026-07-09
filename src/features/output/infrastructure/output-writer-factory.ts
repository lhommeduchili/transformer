import type { OutputWriterPort } from '../application/output-writer-port';
import { createBrowserDownloadOutputWriter } from './browser-download-output-writer';
import {
  createFileSystemAccessOutputWriter,
  supportsFileSystemAccess,
} from './file-system-access-output-writer';

export function createBestAvailableOutputWriter(): OutputWriterPort {
  return supportsFileSystemAccess()
    ? createFileSystemAccessOutputWriter()
    : createBrowserDownloadOutputWriter();
}
