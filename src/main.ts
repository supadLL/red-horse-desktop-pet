import classicSpriteUrl from "./assets/pet/red-horse/red-horse-sprite.png";
import workSpriteUrl from "./assets/pet/work-horse/work-horse-sprite.png";
import "./styles.css";

export type PetMood = "neutral" | "happy" | "hungry" | "sleepy";
export type PetSkin = "classic" | "work";
export type PetAction =
  | "idle"
  | "walk"
  | "happy"
  | "eat"
  | "sleepy"
  | "drag"
  | "typing-left"
  | "typing-right"
  | "typing-fast"
  | "thinking"
  | "work-tired";

export type PetState = {
  mood: PetMood;
  action: PetAction;
  skin: PetSkin;
  affection: number;
  hunger: number;
  scale: number;
  muted: boolean;
  keyCount: number;
};

type KeyHand = "left" | "right";

type KeySpec = {
  label: string;
  vkCode: number;
  hand: KeyHand;
  wide?: boolean;
};

const PET_NAME = "\u5c0f\u8d64\u5f71";
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.45;
const SCALE_STEP = 0.1;
const DEFAULT_HOOF_TARGETS: Record<KeyHand, { x: string; y: string }> = {
  left: { x: "38%", y: "75%" },
  right: { x: "66%", y: "75%" },
};

const keyRows: KeySpec[][] = [
  [
    { label: "Q", vkCode: 81, hand: "left" },
    { label: "W", vkCode: 87, hand: "left" },
    { label: "E", vkCode: 69, hand: "left" },
    { label: "R", vkCode: 82, hand: "left" },
    { label: "T", vkCode: 84, hand: "left" },
    { label: "Y", vkCode: 89, hand: "right" },
    { label: "U", vkCode: 85, hand: "right" },
    { label: "I", vkCode: 73, hand: "right" },
    { label: "O", vkCode: 79, hand: "right" },
    { label: "P", vkCode: 80, hand: "right" },
  ],
  [
    { label: "A", vkCode: 65, hand: "left" },
    { label: "S", vkCode: 83, hand: "left" },
    { label: "D", vkCode: 68, hand: "left" },
    { label: "F", vkCode: 70, hand: "left" },
    { label: "G", vkCode: 71, hand: "left" },
    { label: "H", vkCode: 72, hand: "right" },
    { label: "J", vkCode: 74, hand: "right" },
    { label: "K", vkCode: 75, hand: "right" },
    { label: "L", vkCode: 76, hand: "right" },
  ],
  [
    { label: "Z", vkCode: 90, hand: "left" },
    { label: "X", vkCode: 88, hand: "left" },
    { label: "C", vkCode: 67, hand: "left" },
    { label: "V", vkCode: 86, hand: "left" },
    { label: "B", vkCode: 66, hand: "left" },
    { label: "N", vkCode: 78, hand: "right" },
    { label: "M", vkCode: 77, hand: "right" },
    { label: "\u2190", vkCode: 37, hand: "left" },
    { label: "\u2192", vkCode: 39, hand: "right" },
  ],
  [
    { label: "TAB", vkCode: 9, hand: "left", wide: true },
    { label: "SPACE", vkCode: 32, hand: "right", wide: true },
    { label: "ENT", vkCode: 13, hand: "right", wide: true },
  ],
];

const keyHandByVkCode = new Map<number, KeyHand>(keyRows.flat().map((key) => [key.vkCode, key.hand]));

function renderKeyboardRows(): string {
  return keyRows
    .map(
      (row) => `
        <div class="keyboard-row">
          ${row
            .map(
              (key) => `
                <span class="virtual-key${key.wide ? " wide" : ""}" data-vk="${key.vkCode}" data-hand="${key.hand}">
                  ${key.label}
                </span>
              `,
            )
            .join("")}
        </div>
      `,
    )
    .join("");
}

const state: PetState = {
  mood: "neutral",
  action: "idle",
  skin: "classic",
  affection: 62,
  hunger: 72,
  scale: 1,
  muted: false,
  keyCount: 0,
};

const skinSprites: Record<PetSkin, string> = {
  classic: classicSpriteUrl,
  work: workSpriteUrl,
};

const actionLines: Record<PetAction, string[]> = {
  idle: [
    "\u54d2\u54d2\uff0c\u4eca\u5929\u4e5f\u5f88\u7cbe\u795e\u3002",
    "\u6211\u5728\u8fd9\u91cc\u5b88\u7740\u684c\u9762\u3002",
    "\u8981\u4e0d\u8981\u6478\u6478\u9b03\u6bdb\uff1f",
  ],
  walk: ["\u5de1\u903b\u4e00\u5c0f\u5708\u3002", "\u9a6c\u8e44\u8f7b\u8f7b\u8d70\u3002"],
  happy: ["\u563f\u563f\uff0c\u559c\u6b22\u8fd9\u4e2a\uff01", "\u5c0f\u8d64\u5f71\u5f00\u5fc3\u5230\u53d1\u5149\u3002"],
  eat: ["\u9752\u8349\u6536\u5230\u3002", "\u56bc\u56bc\uff0c\u8865\u5145\u8d64\u5f71\u80fd\u91cf\u3002"],
  sleepy: ["\u6709\u70b9\u60f3\u6253\u76f9\u3002", "\u6211\u5148\u772f\u4e00\u4e0b\u773c\u3002"],
  drag: ["\u6162\u4e00\u70b9\uff0c\u6211\u8ddf\u4e0a\u5566\u3002", "\u6362\u4e2a\u98ce\u6c34\u597d\u7684\u89d2\u843d\u3002"],
  "typing-left": ["\u5de6\u8e44\u5f00\u6572\u3002"],
  "typing-right": ["\u53f3\u8e44\u63a5\u4e0a\u3002"],
  "typing-fast": ["\u6572\u6572\u6572\uff01"],
  thinking: ["\u8ba9\u6211\u60f3\u60f3\u8fd9\u4e2a\u95ee\u9898\u3002"],
  "work-tired": ["\u4eca\u5929\u7684\u952e\u76d8\u6709\u70b9\u5fd9\u3002"],
};

let actionTimer: number | undefined;
let idleTimer: number | undefined;
let moodTimer: number | undefined;
let speechTimer: number | undefined;
let typingIdleTimer: number | undefined;
let lastTypingAt = 0;
let typingSide = 0;
let isDragging = false;
let lastScreenX = 0;
let lastScreenY = 0;
let alwaysOnTop = true;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="pet-stage" aria-label="${PET_NAME}\u684c\u5ba0">
    <div class="speech" role="status" aria-live="polite"></div>
    <section class="pet-body" data-skin="classic" data-action="idle" data-mood="neutral">
      <div class="aura"></div>
      <div class="pet-shadow"></div>
      <button class="pet-hitbox" type="button" aria-label="\u629a\u6478${PET_NAME}">
        <span class="pet-sprite" aria-hidden="true"></span>
      </button>
      <div class="work-rig" aria-hidden="true">
        <span class="work-gaze"></span>
        <span class="hoof hoof-left"></span>
        <span class="hoof hoof-right"></span>
        <div class="virtual-keyboard">
          ${renderKeyboardRows()}
        </div>
        <div class="input-trail">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="typing-effects" data-beat="idle" aria-hidden="true">
        <span class="key-pop key-pop-a">A</span>
        <span class="key-pop key-pop-b">K</span>
        <span class="tap-spark tap-spark-a"></span>
        <span class="tap-spark tap-spark-b"></span>
        <span class="typing-meter">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </span>
      </div>
    </section>
    <nav class="pet-menu" aria-label="\u684c\u5ba0\u4ea4\u4e92\u83dc\u5355" role="menu" hidden>
      <button class="menu-item" type="button" data-command="skin" role="menuitem">\u5207\u6362\u76ae\u80a4</button>
      <button class="menu-item" type="button" data-command="feed" role="menuitem">\u5582\u9752\u8349</button>
      <button class="menu-item" type="button" data-command="zoom-out" role="menuitem">\u7f29\u5c0f</button>
      <button class="menu-item" type="button" data-command="zoom-in" role="menuitem">\u653e\u5927</button>
      <button class="menu-item" type="button" data-command="pin" role="menuitem">\u5207\u6362\u7f6e\u9876</button>
      <button class="menu-item" type="button" data-command="mute" role="menuitem">\u6c14\u6ce1\u5f00\u5173</button>
      <button class="menu-item danger" type="button" data-command="hide" role="menuitem">\u6536\u8d77\u5230\u6258\u76d8</button>
    </nav>
  </main>
`;

const stage = document.querySelector<HTMLElement>(".pet-stage")!;
const petBody = document.querySelector<HTMLElement>(".pet-body")!;
const petHitbox = document.querySelector<HTMLButtonElement>(".pet-hitbox")!;
const sprite = document.querySelector<HTMLElement>(".pet-sprite")!;
const speech = document.querySelector<HTMLElement>(".speech")!;
const petMenu = document.querySelector<HTMLElement>(".pet-menu")!;
const typingEffects = document.querySelector<HTMLElement>(".typing-effects")!;
const keyPops = Array.from(document.querySelectorAll<HTMLElement>(".key-pop"));
const workRig = document.querySelector<HTMLElement>(".work-rig")!;
const virtualKeyboard = document.querySelector<HTMLElement>(".virtual-keyboard")!;
const hooves: Record<KeyHand, HTMLElement> = {
  left: document.querySelector<HTMLElement>(".hoof-left")!,
  right: document.querySelector<HTMLElement>(".hoof-right")!,
};
const inputTrailSlots = Array.from(document.querySelectorAll<HTMLElement>(".input-trail span"));
const virtualKeys = new Map<number, HTMLElement>(
  Array.from(document.querySelectorAll<HTMLElement>(".virtual-key")).map((key) => [Number(key.dataset.vk), key]),
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function normalizeScale(value: number): number {
  return Math.round(clamp(value, MIN_SCALE, MAX_SCALE) * 100) / 100;
}

function scalePercent(): number {
  return Math.round(state.scale * 100);
}

function speak(line: string): void {
  if (state.muted) {
    speech.classList.remove("visible");
    return;
  }

  speech.textContent = line;
  speech.classList.add("visible");
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => speech.classList.remove("visible"), 3200);
}

function render(): void {
  petBody.dataset.action = state.action;
  petBody.dataset.mood = state.mood;
  petBody.dataset.skin = state.skin;
  sprite.style.backgroundImage = `url("${skinSprites[state.skin]}")`;
  stage.style.setProperty("--pet-scale", String(state.scale));
  stage.classList.toggle("is-muted", state.muted);
}

function deriveMood(): PetMood {
  if (state.hunger < 28) {
    return "hungry";
  }
  if (state.affection < 28) {
    return "sleepy";
  }
  if (state.affection > 76) {
    return "happy";
  }
  return "neutral";
}

function setAction(action: PetAction, line?: string): void {
  state.action = action;
  render();
  if (line) {
    speak(line);
  }
}

function setTemporaryAction(action: PetAction, duration = 2200, line = pick(actionLines[action])): void {
  window.clearTimeout(actionTimer);
  setAction(action, line);
  actionTimer = window.setTimeout(() => {
    state.mood = deriveMood();
    state.action = state.skin === "work" ? "thinking" : state.mood === "sleepy" ? "sleepy" : "idle";
    render();
  }, duration);
}

function setScale(scale: number, announce = false): void {
  const nextScale = normalizeScale(scale);
  state.scale = nextScale;
  window.petDesktop?.setScale(nextScale);
  render();
  if (announce) {
    speak(`\u5927\u5c0f ${scalePercent()}%`);
  }
}

function adjustScale(delta: number): void {
  setScale(state.scale + delta, true);
}

function setSkin(skin: PetSkin, announce = false): void {
  state.skin = skin;
  state.action = skin === "work" ? "thinking" : "idle";
  render();
  window.petDesktop?.setSkin(skin);
  if (announce) {
    speak(skin === "work" ? "\u5de5\u4f5c\u5c0f\u9a6c\u4e0a\u7ebf\uff0c\u4f60\u6572\u952e\u6211\u4e5f\u6572\u3002" : "\u6362\u56de\u7ecf\u5178\u5c0f\u8d64\u5f71\u3002");
  }
}

function toggleSkin(): void {
  setSkin(state.skin === "work" ? "classic" : "work", true);
}

function petPet(): void {
  state.affection = clamp(state.affection + 10, 0, 100);
  state.mood = "happy";
  setTemporaryAction("happy", 2600, pick(actionLines.happy));
}

function feedPet(): void {
  state.hunger = clamp(state.hunger + 24, 0, 100);
  state.affection = clamp(state.affection + 4, 0, 100);
  state.mood = "happy";
  setTemporaryAction("eat", 3200, pick(actionLines.eat));
}

function togglePin(): void {
  alwaysOnTop = !alwaysOnTop;
  window.petDesktop?.setAlwaysOnTop(alwaysOnTop);
  speak(alwaysOnTop ? "\u6211\u4f1a\u4e56\u4e56\u5f85\u5728\u6700\u524d\u9762\u3002" : "\u6211\u5148\u8ba9\u5f00\u4e00\u70b9\u3002");
}

function toggleMuted(): void {
  state.muted = !state.muted;
  render();
  if (!state.muted) {
    speak("\u6211\u53c8\u53ef\u4ee5\u5192\u6ce1\u5566\u3002");
  }
}

function hideToTray(): void {
  speak("\u6211\u53bb\u6258\u76d8\u91cc\u5f85\u547d\uff0c\u70b9\u6258\u76d8\u56fe\u6807\u53ef\u4ee5\u53eb\u6211\u56de\u6765\u3002");
  window.setTimeout(() => window.petDesktop?.hideToTray(), 450);
}

function showPetMenu(clientX: number, clientY: number): void {
  petMenu.hidden = false;
  petMenu.classList.add("visible");
  const rect = petMenu.getBoundingClientRect();
  const margin = 8;
  const left = clamp(clientX, margin, window.innerWidth - rect.width - margin);
  const top = clamp(clientY, margin, window.innerHeight - rect.height - margin);
  petMenu.style.left = `${left}px`;
  petMenu.style.top = `${top}px`;
  petMenu.querySelector<HTMLButtonElement>(".menu-item")?.focus();
}

function hidePetMenu(): void {
  petMenu.classList.remove("visible");
  petMenu.hidden = true;
}

function runIdleBeat(): void {
  const nextAction: PetAction = state.skin === "work" ? pick(["thinking", "work-tired", "idle"]) : state.mood === "sleepy" ? "sleepy" : pick(["idle", "idle", "walk"]);
  setTemporaryAction(nextAction, nextAction === "walk" ? 2200 : 1700, pick(actionLines[nextAction]));
}

function formatKeyLabel(vkCode?: number): string {
  if (!vkCode) {
    return "\u952e";
  }
  if (vkCode >= 48 && vkCode <= 90) {
    return String.fromCharCode(vkCode);
  }
  const labels: Record<number, string> = {
    8: "BS",
    9: "TAB",
    13: "ENT",
    16: "SH",
    17: "CT",
    18: "ALT",
    27: "ESC",
    32: "\u7a7a",
    37: "\u2190",
    38: "\u2191",
    39: "\u2192",
    40: "\u2193",
  };
  return labels[vkCode] || "\u952e";
}

function resolveKeyHand(vkCode?: number): KeyHand {
  if (vkCode && keyHandByVkCode.has(vkCode)) {
    return keyHandByVkCode.get(vkCode)!;
  }
  if (vkCode && vkCode >= 65 && vkCode <= 77) {
    return "left";
  }
  if (vkCode && vkCode >= 78 && vkCode <= 90) {
    return "right";
  }
  typingSide = 1 - typingSide;
  return typingSide === 0 ? "left" : "right";
}

function setHoofTarget(hand: KeyHand, key?: HTMLElement): void {
  if (!key) {
    const target = DEFAULT_HOOF_TARGETS[hand];
    hooves[hand].style.setProperty("--hoof-x", target.x);
    hooves[hand].style.setProperty("--hoof-y", target.y);
    return;
  }

  const rigRect = workRig.getBoundingClientRect();
  const keyRect = key.getBoundingClientRect();
  if (rigRect.width === 0 || rigRect.height === 0) {
    return;
  }

  const x = ((keyRect.left + keyRect.width / 2 - rigRect.left) / rigRect.width) * 100;
  const y = ((keyRect.top + keyRect.height / 2 - rigRect.top) / rigRect.height) * 100;
  hooves[hand].style.setProperty("--hoof-x", `${clamp(x, 8, 92).toFixed(2)}%`);
  hooves[hand].style.setProperty("--hoof-y", `${clamp(y, 38, 92).toFixed(2)}%`);
}

function pulseKey(vkCode: number | undefined, hand: KeyHand, label: string): void {
  const key = vkCode ? virtualKeys.get(vkCode) : undefined;
  setHoofTarget(hand, key);

  if (key) {
    key.classList.remove("is-hit");
    void key.offsetWidth;
    key.classList.add("is-hit");
    window.setTimeout(() => key.classList.remove("is-hit"), 260);
  } else {
    virtualKeyboard.dataset.fallback = hand;
    window.setTimeout(() => {
      delete virtualKeyboard.dataset.fallback;
    }, 220);
  }

  inputTrailSlots.unshift(inputTrailSlots.pop()!);
  inputTrailSlots.forEach((slot, index) => {
    slot.textContent = index === 0 ? label : slot.textContent;
    slot.dataset.fresh = index === 0 ? "true" : "false";
  });
}

function setTypingRush(enabled: boolean): void {
  petBody.classList.toggle("typing-rush", enabled);
  virtualKeyboard.classList.toggle("is-rushing", enabled);
}

function handlePointerMove(payload: { screenX: number; screenY: number }): void {
  if (state.skin !== "work" || isDragging) {
    return;
  }

  const centerX = window.screenX + window.innerWidth / 2;
  const centerY = window.screenY + window.innerHeight / 2;
  const lookX = clamp((payload.screenX - centerX) / 18, -8, 8);
  const lookY = clamp((payload.screenY - centerY) / 18, -7, 7);
  petBody.style.setProperty("--look-x", `${lookX.toFixed(2)}px`);
  petBody.style.setProperty("--look-y", `${lookY.toFixed(2)}px`);
}

function startTimers(): void {
  idleTimer = window.setInterval(runIdleBeat, 9000);
  moodTimer = window.setInterval(() => {
    state.hunger = clamp(state.hunger - 5, 0, 100);
    state.affection = clamp(state.affection - 2, 0, 100);
    state.mood = deriveMood();
    if (state.mood === "hungry" && state.skin === "classic") {
      setTemporaryAction("idle", 2200, "\u6709\u70b9\u60f3\u5403\u9752\u8349\u3002");
    } else if (state.mood === "sleepy") {
      setTemporaryAction(state.skin === "work" ? "work-tired" : "sleepy", 2600);
    } else {
      render();
    }
  }, 15000);
}

function stopTimers(): void {
  window.clearInterval(idleTimer);
  window.clearInterval(moodTimer);
}

function handleTypingBeat(payload?: { vkCode?: number; at?: number }): void {
  if (state.skin !== "work") {
    return;
  }

  const now = Date.now();
  const isBurst = now - lastTypingAt < 180;
  lastTypingAt = now;
  const vkCode = payload?.vkCode;
  const hand = resolveKeyHand(vkCode);
  typingSide = hand === "left" ? 0 : 1;
  state.keyCount += 1;
  state.action = isBurst && state.keyCount % 4 === 0 ? "typing-fast" : hand === "left" ? "typing-left" : "typing-right";
  render();

  const label = formatKeyLabel(vkCode);
  const beat = state.action === "typing-fast" ? "fast" : hand;
  typingEffects.dataset.beat = beat;
  typingEffects.dataset.key = label;
  typingEffects.classList.remove("beat-left", "beat-right", "beat-fast");
  void typingEffects.offsetWidth;
  typingEffects.classList.add(`beat-${beat}`);
  keyPops[typingSide].textContent = label;
  pulseKey(vkCode, hand, label);
  setTypingRush(isBurst);

  window.clearTimeout(typingIdleTimer);
  typingIdleTimer = window.setTimeout(() => {
    state.action = state.keyCount > 40 ? "work-tired" : "thinking";
    typingEffects.dataset.beat = "idle";
    typingEffects.classList.remove("beat-left", "beat-right", "beat-fast");
    setTypingRush(false);
    setHoofTarget("left");
    setHoofTarget("right");
    render();
  }, 650);
}

petHitbox.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }

  isDragging = true;
  lastScreenX = event.screenX;
  lastScreenY = event.screenY;
  petHitbox.setPointerCapture(event.pointerId);
  state.action = "drag";
  render();
});

petHitbox.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    return;
  }

  const deltaX = event.screenX - lastScreenX;
  const deltaY = event.screenY - lastScreenY;
  if (deltaX !== 0 || deltaY !== 0) {
    window.petDesktop?.moveWindow(deltaX, deltaY);
    lastScreenX = event.screenX;
    lastScreenY = event.screenY;
  }
});

petHitbox.addEventListener("pointerup", (event) => {
  if (!isDragging) {
    return;
  }

  isDragging = false;
  petHitbox.releasePointerCapture(event.pointerId);
  setTemporaryAction("happy", 1800, "\u8fd9\u91cc\u770b\u8d77\u6765\u4e0d\u9519\u3002");
});

petHitbox.addEventListener("click", (event) => {
  if (Math.abs(event.detail) <= 1 && !isDragging) {
    petPet();
  }
});

petHitbox.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showPetMenu(event.clientX, event.clientY);
});

stage.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    adjustScale(event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
  },
  { passive: false },
);

function runCommand(command: string): void {
  if (command === "skin") {
    toggleSkin();
  } else if (command === "feed") {
    feedPet();
  } else if (command === "zoom-out") {
    adjustScale(-SCALE_STEP);
  } else if (command === "zoom-in") {
    adjustScale(SCALE_STEP);
  } else if (command === "pin") {
    togglePin();
  } else if (command === "mute") {
    toggleMuted();
  } else if (command === "hide") {
    hideToTray();
  }
}

petMenu.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-command]");
  if (!button) {
    return;
  }

  runCommand(button.dataset.command || "");
  hidePetMenu();
});

window.addEventListener("pointerdown", (event) => {
  const target = event.target as Node;
  if (!petMenu.hidden && !petMenu.contains(target) && !petHitbox.contains(target)) {
    hidePetMenu();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hidePetMenu();
  }
});

const unsubscribeScale = window.petDesktop?.onScaleChanged((scale) => {
  state.scale = normalizeScale(scale);
  render();
});

const unsubscribePin = window.petDesktop?.onAlwaysOnTopChanged((value) => {
  alwaysOnTop = value;
  speak(value ? "\u7f6e\u9876\u56de\u6765\u5566\u3002" : "\u6211\u4e0d\u4f1a\u6321\u4f4f\u4f60\u3002");
});

const unsubscribeSkin = window.petDesktop?.onSkinChanged((skin) => {
  setSkin(skin === "work" ? "work" : "classic");
});

const unsubscribeTyping = window.petDesktop?.onTypingBeat((payload) => {
  handleTypingBeat(payload);
});

const unsubscribePointerMove = window.petDesktop?.onPointerMove((payload) => {
  handlePointerMove(payload);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" || !petMenu.hidden) {
    return;
  }
  handleTypingBeat();
});

window.addEventListener("beforeunload", () => {
  stopTimers();
  window.clearTimeout(typingIdleTimer);
  unsubscribeScale?.();
  unsubscribePin?.();
  unsubscribeSkin?.();
  unsubscribeTyping?.();
  unsubscribePointerMove?.();
});

setHoofTarget("left");
setHoofTarget("right");
render();
startTimers();
window.setTimeout(() => speak(`${PET_NAME}\u5230\u4f4d\u3002`), 500);
