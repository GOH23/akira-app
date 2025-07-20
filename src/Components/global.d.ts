import { HavokPlugin } from "@babylonjs/havok";

interface ElectronAPI {
  sendMessage: (data: any) => Promise<any>;
  onAIStream: (callback: (event: any, data: any) => void) => void;
  getLocales: () => Promise<string[]>
  getModels: () => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    havokPlugin: typeof HavokPlugin;
  }

  // For Electron context if needed
  const havokPlugin: typeof HavokPlugin;
}