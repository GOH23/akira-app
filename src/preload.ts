// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (data: any) => ipcRenderer.invoke('sendMessage', data),
  onAIStream: (callback: (event: any, data: any) => void) => ipcRenderer.on('ai-stream', callback),
  getLocales: () => ipcRenderer.invoke('getlocales'),
  getModels: () => ipcRenderer.invoke('getModels'),
  getAnimations: () => ipcRenderer.invoke('get-animations'),
});
