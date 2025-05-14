import { HavokPlugin } from "@babylonjs/havok";

declare global {
  interface Window {
    havokPlugin: typeof HavokPlugin;
  }

  // For Electron context if needed
  const havokPlugin: typeof HavokPlugin;
}