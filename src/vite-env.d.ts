/// <reference types="vite/client" />

type PetDesktopBridge = {
  moveWindow(deltaX: number, deltaY: number): void;
  setAlwaysOnTop(value: boolean): void;
  setScale(scale: number): void;
  setSkin(skin: string): void;
  quit(): void;
  hideToTray(): void;
  onScaleChanged(callback: (scale: number) => void): () => void;
  onAlwaysOnTopChanged(callback: (value: boolean) => void): () => void;
  onSkinChanged(callback: (skin: string) => void): () => void;
  onTypingBeat(callback: (payload: { vkCode: number; pressed?: boolean; at: number }) => void): () => void;
  onPointerMove(callback: (payload: { screenX: number; screenY: number; at: number }) => void): () => void;
};

interface Window {
  petDesktop?: PetDesktopBridge;
}
