import type { BrowserCapabilities } from '../application/browser-capabilities-port';

type BrowserCapabilityNoticeProps = {
  readonly capabilities: BrowserCapabilities;
};

export function BrowserCapabilityNotice({ capabilities }: BrowserCapabilityNoticeProps) {
  return (
    <section className="capability-notice" aria-labelledby="capability-title">
      <h2 id="capability-title">local capabilities</h2>
      <p>audio stays on this device</p>
      <ul aria-label="browser capabilities">
        <li>file import: {capabilities.filePicker ? 'ready' : 'unavailable'}</li>
        <li>drag and drop: {capabilities.dragAndDrop ? 'ready' : 'unavailable'}</li>
        <li>folder drop: {capabilities.folderDrop ? 'ready' : 'unavailable'}</li>
        <li>
          output: {capabilities.fileSystemAccess ? 'direct folder writes' : 'browser downloads'}
        </li>
      </ul>
    </section>
  );
}
