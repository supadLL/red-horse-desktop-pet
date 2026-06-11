import { contextBridge, ipcRenderer } from "electron";

type Unsubscribe = () => void;

contextBridge.exposeInMainWorld("petDesktop", {
  moveWindow(deltaX: number, deltaY: number): void {
    ipcRenderer.send("pet:move-window", { deltaX, deltaY });
  },
  setAlwaysOnTop(value: boolean): void {
    ipcRenderer.send("pet:set-always-on-top", value);
  },
  setScale(scale: number): void {
    ipcRenderer.send("pet:set-scale", scale);
  },
  setSkin(skin: string): void {
    ipcRenderer.send("pet:set-skin", skin);
  },
  quit(): void {
    ipcRenderer.send("pet:quit");
  },
  hideToTray(): void {
    ipcRenderer.send("pet:hide-to-tray");
  },
  onScaleChanged(callback: (scale: number) => void): Unsubscribe {
    const listener = (_event: Electron.IpcRendererEvent, scale: number) => callback(scale);
    ipcRenderer.on("pet:scale-changed", listener);
    return () => ipcRenderer.off("pet:scale-changed", listener);
  },
  onAlwaysOnTopChanged(callback: (value: boolean) => void): Unsubscribe {
    const listener = (_event: Electron.IpcRendererEvent, value: boolean) => callback(value);
    ipcRenderer.on("pet:always-on-top-changed", listener);
    return () => ipcRenderer.off("pet:always-on-top-changed", listener);
  },
  onSkinChanged(callback: (skin: string) => void): Unsubscribe {
    const listener = (_event: Electron.IpcRendererEvent, skin: string) => callback(skin);
    ipcRenderer.on("pet:skin-changed", listener);
    return () => ipcRenderer.off("pet:skin-changed", listener);
  },
  onTypingBeat(callback: (payload: { vkCode: number; pressed?: boolean; at: number }) => void): Unsubscribe {
    const listener = (_event: Electron.IpcRendererEvent, payload: { vkCode: number; pressed?: boolean; at: number }) => callback(payload);
    ipcRenderer.on("pet:typing-beat", listener);
    return () => ipcRenderer.off("pet:typing-beat", listener);
  },
  onPointerMove(callback: (payload: { screenX: number; screenY: number; at: number }) => void): Unsubscribe {
    const listener = (_event: Electron.IpcRendererEvent, payload: { screenX: number; screenY: number; at: number }) => callback(payload);
    ipcRenderer.on("pet:pointer-move", listener);
    return () => ipcRenderer.off("pet:pointer-move", listener);
  },
});
