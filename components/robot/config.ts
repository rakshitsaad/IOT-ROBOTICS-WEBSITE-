/**
 * Shared constants for the robot stage. The poster fallback uses the same
 * camera numbers so it lines up with where the 3D robot would be.
 */
export const BOT_CAMERA = {
  fov: 30,
  position: [0, 1.2, 7.2] as [number, number, number],
  /** Straight ahead at the robot's middle. Passing a rotation also stops R3F's default lookAt(0,0,0). */
  rotation: [0, 0, 0] as [number, number, number],
};

/** World units visible from top to bottom of the stage at z = 0. */
export const BOT_VIEW_HEIGHT =
  2 * BOT_CAMERA.position[2] * Math.tan(((BOT_CAMERA.fov / 2) * Math.PI) / 180);

/** Robot height (base to antenna tip) in world units. */
export const BOT_HEIGHT = 2.4;

/**
 * Poster image: the robot fills the image height exactly. `blinkSrc` is the
 * same frame with the eyes closed; the poster blinks with it (skipped if the
 * file is missing).
 */
export const BOT_POSTER = {
  src: "/robot-poster.png",
  blinkSrc: "/robot-poster-blink.png",
  width: 720,
  height: 1000,
};

/** Live render stats, written by the scene ~2×/s (read by /lab/robot). */
export const botDebug = {
  triangles: 0,
  calls: 0,
  rendering: false,
};
