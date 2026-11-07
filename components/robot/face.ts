import * as THREE from "three";
import { BOT_ICONS, type BotIcon } from "./icons";
import type { BotFace } from "./store";

/**
 * The robot's screen. A 512 × 512 canvas drawn white-on-black and used as
 * the screen's emissive map. It is redrawn only when what it shows changes
 * (expression, icon, blink step, glance, glitch frame), never every frame.
 *
 * The screen opening is wider than tall, so only a horizontal band of the
 * square canvas is visible (see `aspect`); everything is drawn inside it.
 */

export type FaceFrame =
  | { kind: "off" }
  /** Boot-up: a thin bright line across the middle, like a display warming up. */
  | { kind: "boot" }
  | {
      kind: "face";
      face: BotFace;
      /** Horizontal eye shift in px (idle glance). */
      eyeOffset?: number;
      /** 0 = closed, 1 = open. Used for blinks on open-eyed faces. */
      openness?: number;
    }
  | { kind: "icon"; icon: BotIcon };

export interface GlitchParams {
  /** 0–1, how far through the glitch we are. */
  progress: number;
  /** Random source for scanline placement. */
  random: () => number;
}

const SIZE = 512;
const C = SIZE / 2;
const EYE_DX = 86;
const EYE_W = 54;
const EYE_H = 124;
const STROKE = 20;

export class FaceDisplay {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;
  private tint: HTMLCanvasElement;
  private tintCtx: CanvasRenderingContext2D;
  private scanlines: HTMLCanvasElement;

  constructor() {
    this.canvas = makeCanvas();
    this.ctx = this.canvas.getContext("2d")!;
    this.buffer = makeCanvas();
    this.bufferCtx = this.buffer.getContext("2d")!;
    this.tint = makeCanvas();
    this.tintCtx = this.tint.getContext("2d")!;
    this.scanlines = makeScanlines();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    this.draw({ kind: "off" });
  }

  /** Draws a frame, optionally as a glitch frame, and flags the texture for upload. */
  draw(frame: FaceFrame, glitch?: GlitchParams) {
    const g = this.ctx;
    paint(this.bufferCtx, frame);

    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.fillStyle = "#000";
    g.fillRect(0, 0, SIZE, SIZE);

    if (glitch) {
      const shift = 5 + 5 * Math.sin(glitch.progress * Math.PI);
      g.globalCompositeOperation = "lighter";
      g.drawImage(this.tinted("#ff2a55"), -shift, 0);
      g.drawImage(this.tinted("#2ad8ff"), shift, 0);
      g.globalAlpha = 0.7;
      g.drawImage(this.buffer, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";

      // Two horizontal scanlines: a displaced strip plus a bright line.
      for (let i = 0; i < 2; i++) {
        const y = Math.round(90 + glitch.random() * 320);
        const h = Math.round(6 + glitch.random() * 16);
        const dx = Math.round((glitch.random() - 0.5) * 70);
        // Copy the strip onto itself, shifted (no getImageData readback).
        g.drawImage(this.canvas, 0, y, SIZE, h, dx, y, SIZE, h);
        g.fillStyle = "rgba(255,255,255,0.75)";
        g.fillRect(0, y + Math.round(h / 2), SIZE, 2);
      }
    } else {
      g.drawImage(this.buffer, 0, 0);
    }

    g.drawImage(this.scanlines, 0, 0);
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }

  private tinted(color: string) {
    const t = this.tintCtx;
    t.globalCompositeOperation = "source-over";
    t.clearRect(0, 0, SIZE, SIZE);
    t.drawImage(this.buffer, 0, 0);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = color;
    t.fillRect(0, 0, SIZE, SIZE);
    t.globalCompositeOperation = "source-over";
    return this.tint;
  }
}

/* ------------------------------------------------------------- painting */

function paint(g: CanvasRenderingContext2D, frame: FaceFrame) {
  g.clearRect(0, 0, SIZE, SIZE);
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineCap = "round";
  g.lineJoin = "round";

  if (frame.kind === "off") return;
  if (frame.kind === "boot") {
    g.globalAlpha = 0.35;
    g.fillRect(C - 190, C - 7, 380, 14);
    g.globalAlpha = 1;
    g.fillRect(C - 170, C - 2, 340, 4);
    return;
  }
  if (frame.kind === "icon") return paintIcon(g, frame.icon);
  paintFace(g, frame.face, frame.eyeOffset ?? 0, frame.openness ?? 1);
}

function paintFace(g: CanvasRenderingContext2D, face: BotFace, offset: number, openness: number) {
  const left = C - EYE_DX;
  const right = C + EYE_DX;

  switch (face) {
    case "idle":
      pill(g, left + offset, C, openness);
      pill(g, right + offset, C, openness);
      break;
    case "blink":
      pill(g, left, C, 0);
      pill(g, right, C, 0);
      break;
    case "happy":
      happyArc(g, left, C);
      happyArc(g, right, C);
      break;
    case "surprised": {
      const r = 40 * Math.max(openness, 0.15);
      g.lineWidth = STROKE - 2;
      for (const x of [left, right]) {
        g.beginPath();
        g.ellipse(x, C, 40, r, 0, 0, Math.PI * 2);
        g.stroke();
      }
      break;
    }
    case "sleepy":
      g.lineWidth = 16;
      for (const x of [left, right]) {
        g.beginPath();
        g.moveTo(x - 38, C + 18);
        g.lineTo(x + 38, C + 18);
        g.stroke();
      }
      // A small "z z" drifting up to the right.
      g.lineWidth = 7;
      zee(g, right + 70, C - 62, 22);
      zee(g, right + 104, C - 100, 15);
      break;
    case "wink":
      pill(g, left, C, openness);
      happyArc(g, right, C);
      break;
    case "look-left":
      pill(g, left - 40, C, openness);
      pill(g, right - 40, C, openness * 0.92, 0.92);
      break;
    case "look-right":
      pill(g, left + 40, C, openness * 0.92, 0.92);
      pill(g, right + 40, C, openness);
      break;
  }
}

/** Rounded vertical pill eye. openness 0 → a short flat bar. */
function pill(g: CanvasRenderingContext2D, x: number, y: number, openness: number, scale = 1) {
  const h = Math.max(14, EYE_H * scale * openness);
  const w = EYE_W * (openness < 0.25 ? 1.25 : 1);
  g.beginPath();
  g.roundRect(x - w / 2, y - h / 2 + (1 - openness) * 10, w, h, w / 2);
  g.fill();
}

function happyArc(g: CanvasRenderingContext2D, x: number, y: number) {
  g.lineWidth = STROKE;
  g.beginPath();
  g.arc(x, y + 26, 40, Math.PI * 1.12, Math.PI * 1.88);
  g.stroke();
}

function zee(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.beginPath();
  g.moveTo(x - s / 2, y - s / 2);
  g.lineTo(x + s / 2, y - s / 2);
  g.lineTo(x - s / 2, y + s / 2);
  g.lineTo(x + s / 2, y + s / 2);
  g.stroke();
}

const pathCache = new Map<string, Path2D>();
function toPath(d: string) {
  let p = pathCache.get(d);
  if (!p) {
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
}

function paintIcon(g: CanvasRenderingContext2D, icon: BotIcon) {
  const def = BOT_ICONS[icon];
  const box = 224;
  const s = box / 24;
  g.save();
  g.translate(C - box / 2, C - box / 2);
  g.scale(s, s);
  g.lineWidth = 1.55;
  for (const d of def.paths) g.stroke(toPath(d));
  g.restore();
}

/* ------------------------------------------------------------- helpers */

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  return c;
}

/** Faint horizontal display lines laid over every frame. */
function makeScanlines() {
  const c = makeCanvas();
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(0,0,0,0.22)";
  for (let y = 0; y < SIZE; y += 4) g.fillRect(0, y, SIZE, 1);
  return c;
}

/** Deterministic PRNG (mulberry32) for glitch and texture patterns. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
