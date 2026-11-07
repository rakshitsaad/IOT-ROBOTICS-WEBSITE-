import * as THREE from "three";
import { COLORS, IRIS_STOPS } from "@/lib/tokens";
import { seeded } from "./face";

/**
 * Procedural textures for the robot. All are drawn on canvases at runtime,
 * so there are no image downloads except the optional chest logo.
 */

/**
 * The bezel sheen as a seamless loop (maroon → red → maroon → a dark gap →
 * maroon), sampled along U. Used for the bezel, which maps U to the angle
 * around the screen, so a slow red highlight travels around the frame.
 */
export function createIrisLoopTexture(): THREE.CanvasTexture {
  const w = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = 4;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, w, 0);
  const stops = [...IRIS_STOPS, COLORS.bg2, IRIS_STOPS[0]];
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  g.fillStyle = grad;
  g.fillRect(0, 0, w, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Circuit-board traces for the hexagonal base: thin orthogonal/diagonal
 * lines ending in round pads, in faint maroon and red on black. Used as an
 * emissive map so the traces glow softly. UVs follow CylinderGeometry caps
 * (the circle inscribed in the unit square).
 */
export function createCircuitTexture(size = 1024): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const rand = seeded(2026);
  const mid = size / 2;
  const unit = size / 48;

  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);
  g.lineCap = "round";
  g.lineJoin = "round";

  // Keep traces inside the hexagon (approximated by a circle) and outside
  // the footprint ring where the robot hovers.
  const inner = size * 0.2;
  const outer = size * 0.43;
  const inside = (x: number, y: number) => {
    const d = Math.hypot(x - mid, y - mid);
    return d > inner && d < outer;
  };

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  for (let i = 0; i < 70; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = inner + 10 + rand() * (outer - inner - 20);
    let x = Math.round((mid + Math.cos(angle) * radius) / unit) * unit;
    let y = Math.round((mid + Math.sin(angle) * radius) / unit) * unit;
    if (!inside(x, y)) continue;

    const color = IRIS_STOPS[Math.floor(rand() * IRIS_STOPS.length)];
    g.strokeStyle = color;
    g.fillStyle = color;
    g.globalAlpha = 0.35 + rand() * 0.35;
    g.lineWidth = unit * 0.16;

    g.beginPath();
    g.arc(x, y, unit * 0.42, 0, Math.PI * 2);
    g.fill();

    g.beginPath();
    g.moveTo(x, y);
    let [dx, dy] = dirs[Math.floor(rand() * 4)];
    const segments = 2 + Math.floor(rand() * 3);
    for (let s = 0; s < segments; s++) {
      const len = (2 + Math.floor(rand() * 4)) * unit;
      const nx = x + dx * len;
      const ny = y + dy * len;
      if (!inside(nx, ny)) break;
      g.lineTo(nx, ny);
      x = nx;
      y = ny;
      [dx, dy] = dirs[Math.floor(rand() * dirs.length)];
    }
    g.stroke();

    g.beginPath();
    g.arc(x, y, unit * 0.5, 0, Math.PI * 2);
    g.lineWidth = unit * 0.14;
    g.stroke();
  }

  // Footprint ring and edge outline.
  g.globalAlpha = 0.45;
  g.lineWidth = unit * 0.14;
  g.strokeStyle = IRIS_STOPS[1];
  g.beginPath();
  g.arc(mid, mid, inner - unit * 0.8, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 0.25;
  g.setLineDash([unit * 0.5, unit * 0.7]);
  g.beginPath();
  g.arc(mid, mid, inner - unit * 2, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Loads an SVG/PNG logo onto a plate-coloured canvas for the chest plate.
 * Resolves null if the file is missing or fails to load (plain plate).
 */
export function loadPlateTexture(url: string, plateColor: string): Promise<THREE.CanvasTexture | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const size = 512;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = Math.round(size * PLATE_ASPECT_INV);
      const g = c.getContext("2d")!;
      g.fillStyle = plateColor;
      g.fillRect(0, 0, c.width, c.height);

      const iw = img.naturalWidth || 512;
      const ih = img.naturalHeight || 512;
      const maxW = c.width * 0.62;
      const maxH = c.height * 0.62;
      const scale = Math.min(maxW / iw, maxH / ih);
      const w = iw * scale;
      const h = ih * scale;
      g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Chest plate is wider than tall; height / width. */
export const PLATE_ASPECT_INV = 0.68;
