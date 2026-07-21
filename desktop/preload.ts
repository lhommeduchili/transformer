import { contextBridge, ipcRenderer } from 'electron';

import {
  desktopOutputChannels,
  type DesktopOutputApi,
} from '../src/features/output/application/desktop-output-api';

const desktopOutputApi: DesktopOutputApi = {
  chooseDirectory: () => ipcRenderer.invoke(desktopOutputChannels.chooseDirectory),
  writeFile: (request) => ipcRenderer.invoke(desktopOutputChannels.writeFile, request),
};

contextBridge.exposeInMainWorld('transformerDesktop', desktopOutputApi);
