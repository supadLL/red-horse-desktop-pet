import type { BrowserWindow as ElectronBrowserWindow, Menu as ElectronMenu, Tray as ElectronTray } from "electron";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const electron = require("electron") as typeof import("electron");
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen } = electron;

const APP_NAME = "\u5c0f\u8d64\u5f71\u684c\u5ba0";
const BASE_WINDOW_SIZE = 260;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.45;
const SCALE_STEP = 0.1;
const KEYBOARD_HOOK_SCRIPT = "keyboard-hook.ps1";

let petWindow: ElectronBrowserWindow | null = null;
let tray: ElectronTray | null = null;
let keyboardHook: ChildProcess | null = null;
let currentScale = 1;
let currentSkin = "classic";
let isAlwaysOnTop = true;
let isQuitting = false;

app.setName(APP_NAME);
app.setAppUserModelId("com.local.redhorsedesktoppet");

function resolveAssetPath(...segments: string[]): string {
  return path.join(app.getAppPath(), "assets", ...segments);
}

function resolveScriptPath(filename: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "scripts", filename);
  }
  return path.join(app.getAppPath(), "scripts", filename);
}

function getAppIcon(): Electron.NativeImage {
  const icon = nativeImage.createFromPath(resolveAssetPath("app-icon.png"));
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

function showPetWindow(): void {
  if (!petWindow) {
    createPetWindow();
    return;
  }

  petWindow.show();
  petWindow.focus();
  petWindow.setAlwaysOnTop(isAlwaysOnTop, "floating");
}

function hidePetWindow(): void {
  petWindow?.hide();
}

function quitApp(): void {
  isQuitting = true;
  stopKeyboardHook();
  app.quit();
}

function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) {
    return 1;
  }
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function isScale(scale: number): boolean {
  return Math.abs(currentScale - scale) < 0.01;
}

function resizePetWindow(scale: number): void {
  currentScale = clampScale(scale);

  if (!petWindow) {
    return;
  }

  const oldBounds = petWindow.getBounds();
  const size = Math.round(BASE_WINDOW_SIZE * currentScale);
  const nextX = Math.round(oldBounds.x + (oldBounds.width - size) / 2);
  const nextY = Math.round(oldBounds.y + oldBounds.height - size);
  petWindow.setBounds({ x: nextX, y: nextY, width: size, height: size }, false);
  petWindow.webContents.send("pet:scale-changed", currentScale);
}

function changePetWindowScale(delta: number): void {
  resizePetWindow(currentScale + delta);
}

function setSkin(skin: string): void {
  currentSkin = skin === "work" ? "work" : "classic";
  petWindow?.webContents.send("pet:skin-changed", currentSkin);
}

function broadcastTypingBeat(vkCode: number): void {
  petWindow?.webContents.send("pet:typing-beat", { vkCode, at: Date.now() });
}

function startKeyboardHook(): void {
  if (process.platform !== "win32" || keyboardHook) {
    return;
  }

  const scriptPath = resolveScriptPath(KEYBOARD_HOOK_SCRIPT);
  if (!fs.existsSync(scriptPath)) {
    console.warn(`Keyboard hook script not found: ${scriptPath}`);
    return;
  }

  const hook = spawn("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  keyboardHook = hook;

  hook.stdout?.setEncoding("utf8");
  hook.stdout?.on("data", (chunk: string) => {
    chunk.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^KEYDOWN\s+(\d+)/);
      if (match) {
        broadcastTypingBeat(Number(match[1]));
      }
    });
  });

  hook.stderr?.on("data", (chunk) => {
    console.warn(`keyboard-hook: ${chunk.toString()}`);
  });

  hook.on("exit", () => {
    keyboardHook = null;
    if (!isQuitting) {
      setTimeout(startKeyboardHook, 1200);
    }
  });
}

function stopKeyboardHook(): void {
  if (!keyboardHook) {
    return;
  }

  const child = keyboardHook;
  keyboardHook = null;
  child.kill();
}

function buildContextMenu(): ElectronMenu {
  return Menu.buildFromTemplate([
    {
      label: "\u663e\u793a\u5c0f\u8d64\u5f71",
      click: showPetWindow,
    },
    {
      label: "\u6536\u8d77\u5230\u6258\u76d8",
      click: hidePetWindow,
    },
    { type: "separator" },
    {
      label: isAlwaysOnTop ? "\u53d6\u6d88\u7f6e\u9876" : "\u4fdd\u6301\u7f6e\u9876",
      click: () => {
        isAlwaysOnTop = !isAlwaysOnTop;
        petWindow?.setAlwaysOnTop(isAlwaysOnTop, "floating");
        petWindow?.webContents.send("pet:always-on-top-changed", isAlwaysOnTop);
      },
    },
    {
      label: "\u7f29\u653e",
      submenu: [
        { label: "\u7f29\u5c0f", click: () => changePetWindowScale(-SCALE_STEP) },
        { label: "\u5c0f\u53f7", type: "radio", checked: isScale(0.85), click: () => resizePetWindow(0.85) },
        { label: "\u6807\u51c6", type: "radio", checked: isScale(1), click: () => resizePetWindow(1) },
        { label: "\u5927\u53f7", type: "radio", checked: isScale(1.25), click: () => resizePetWindow(1.25) },
        { label: "\u653e\u5927", click: () => changePetWindowScale(SCALE_STEP) },
      ],
    },
    {
      label: "\u76ae\u80a4",
      submenu: [
        { label: "\u7ecf\u5178\u5c0f\u8d64\u5f71", type: "radio", checked: currentSkin === "classic", click: () => setSkin("classic") },
        { label: "\u5de5\u4f5c\u5c0f\u9a6c", type: "radio", checked: currentSkin === "work", click: () => setSkin("work") },
      ],
    },
    { type: "separator" },
    {
      label: "\u9000\u51fa\u5c0f\u8d64\u5f71",
      click: quitApp,
    },
  ]);
}

function createTray(): void {
  if (tray) {
    return;
  }

  tray = new Tray(getAppIcon());
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(buildContextMenu());
  tray.on("click", showPetWindow);
  tray.on("right-click", () => {
    tray?.setContextMenu(buildContextMenu());
  });
}

function createPetWindow(): void {
  const { workArea } = screen.getPrimaryDisplay();
  const size = Math.round(BASE_WINDOW_SIZE * currentScale);

  petWindow = new BrowserWindow({
    width: size,
    height: size,
    x: workArea.x + workArea.width - size - 42,
    y: workArea.y + workArea.height - size - 64,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: false,
    alwaysOnTop: isAlwaysOnTop,
    backgroundColor: "#00000000",
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  petWindow.setAlwaysOnTop(isAlwaysOnTop, "floating");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.setMenuBarVisibility(false);

  if (!app.isPackaged) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5397";
    petWindow.loadURL(devServerUrl);
  } else {
    petWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  petWindow.on("closed", () => {
    petWindow = null;
  });

  petWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }
    event.preventDefault();
    hidePetWindow();
  });
}

app.whenReady().then(() => {
  createTray();
  createPetWindow();
  startKeyboardHook();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});

ipcMain.on("pet:move-window", (_event, payload: { deltaX?: number; deltaY?: number }) => {
  if (!petWindow) {
    return;
  }

  const deltaX = Number(payload?.deltaX || 0);
  const deltaY = Number(payload?.deltaY || 0);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    return;
  }

  const [x, y] = petWindow.getPosition();
  petWindow.setPosition(Math.round(x + deltaX), Math.round(y + deltaY), false);
});

ipcMain.on("pet:set-always-on-top", (_event, value: boolean) => {
  isAlwaysOnTop = Boolean(value);
  petWindow?.setAlwaysOnTop(isAlwaysOnTop, "floating");
  petWindow?.webContents.send("pet:always-on-top-changed", isAlwaysOnTop);
});

ipcMain.on("pet:set-scale", (_event, scale: number) => {
  resizePetWindow(Number(scale));
});

ipcMain.on("pet:set-skin", (_event, skin: string) => {
  setSkin(skin);
});

ipcMain.on("pet:quit", () => {
  quitApp();
});

ipcMain.on("pet:hide-to-tray", () => {
  hidePetWindow();
});
