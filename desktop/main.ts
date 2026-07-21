import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  session,
  type OpenDialogOptions,
} from 'electron';
import squirrelStartup from 'electron-squirrel-startup';

import { desktopOutputChannels } from '../src/features/output/application/desktop-output-api';
import { nextOutputCandidate, parseDesktopWriteRequest, resolvePackagedAsset } from './security';

const appHost = 'app';
const appOrigin = `transformer://${appHost}`;
const selectedDirectories = new Map<string, string>();
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'transformer',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      codeCache: true,
    },
  },
]);

if (squirrelStartup) app.quit();

app.setAppUserModelId('com.squirrel.Transformer.Transformer');

void app.whenReady().then(() => {
  registerApplicationProtocol();
  configureSession();
  registerDesktopOutputHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  selectedDirectories.clear();
});

function registerApplicationProtocol() {
  const webRoot = resolve(__dirname, '..', 'dist');

  protocol.handle('transformer', async (request) => {
    const url = new URL(request.url);
    if (url.host !== 'app') return new Response('Not found.', { status: 404 });

    const filePath = resolvePackagedAsset(webRoot, url.pathname);
    if (filePath === undefined) {
      return new Response('Invalid path.', { status: 400 });
    }

    const fileResponse = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(fileResponse.headers);
    headers.set('Content-Security-Policy', contentSecurityPolicy);
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(fileResponse.body, {
      status: fileResponse.status,
      statusText: fileResponse.statusText,
      headers,
    });
  });
}

function configureSession() {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 720,
    minHeight: 640,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isApplicationUrl(navigationUrl)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  void window.loadURL(`${appOrigin}/`);
}

function registerDesktopOutputHandlers() {
  ipcMain.handle(desktopOutputChannels.chooseDirectory, async (event) => {
    assertTrustedSender(event.senderFrame?.url);
    const owner = BrowserWindow.fromWebContents(event.sender);
    const options: OpenDialogOptions = {
      title: 'Choose output folder',
      buttonLabel: 'Choose folder',
      properties: ['openDirectory', 'createDirectory'],
    };
    const selection =
      owner === null
        ? await dialog.showOpenDialog(options)
        : await dialog.showOpenDialog(owner, options);

    const directoryPath = selection.filePaths[0];
    if (selection.canceled || directoryPath === undefined) return { status: 'cancelled' } as const;

    const token = randomUUID();
    selectedDirectories.set(token, directoryPath);
    return { status: 'selected', token, displayName: directoryName(directoryPath) } as const;
  });

  ipcMain.handle(desktopOutputChannels.writeFile, async (event, request: unknown) => {
    assertTrustedSender(event.senderFrame?.url);
    const parsed = parseDesktopWriteRequest(request);
    const directoryPath = selectedDirectories.get(parsed.token);
    if (directoryPath === undefined)
      throw new Error('The selected output folder is no longer available.');

    return writeWithoutOverwrite(directoryPath, parsed.fileName, parsed.data);
  });
}

function assertTrustedSender(senderUrl: string | undefined) {
  if (senderUrl === undefined || !isApplicationUrl(senderUrl)) {
    throw new Error('Rejected desktop request from an untrusted page.');
  }
}

function isApplicationUrl(url: string): boolean {
  const parsed = new URL(url);
  return parsed.protocol === 'transformer:' && parsed.host === appHost;
}

async function writeWithoutOverwrite(
  directoryPath: string,
  requestedName: string,
  data: Uint8Array,
) {
  let candidate = requestedName;
  let suffix = 2;

  while (true) {
    try {
      await writeFile(join(directoryPath, candidate), data, { flag: 'wx' });
      return { outputName: candidate };
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
      candidate = nextOutputCandidate(requestedName, suffix);
      suffix += 1;
    }
  }
}

function isAlreadyExistsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}

function directoryName(directoryPath: string): string {
  return directoryPath.split(/[\\/]/).filter(Boolean).at(-1) ?? dirname(directoryPath);
}
