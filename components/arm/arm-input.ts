/**
 * What the visitor is doing, for the arm (DESIGN.md §22): written by window listeners, read every frame by
 * IndustrialArm. Plain mutable values, never React state.
 */
export const armInput = {
  /** Last mouse or pen position (client px); `active` while the pointer is over the page. Touch never sets it. */
  pointer: { x: 0, y: 0, active: false },
  /** The interactive element under the pointer (link, button, field, [data-cursor]), if any. */
  hover: null as Element | null,
  /** performance.now() of the last click or tap. */
  clickAt: -Infinity,
  /** performance.now() of the last input of any kind (the idle routine waits for a gap). */
  lastInput: 0,
};

const INTERACTIVE =
  'a[href],button:not(:disabled),[role="button"],summary,label,select,textarea,input:not([type="hidden"]),[data-cursor]';

/** Starts listening; returns the cleanup. */
export function bindArmInput() {
  const now = () => performance.now();
  armInput.lastInput = now();
  const activity = () => {
    armInput.lastInput = now();
  };
  const move = (e: PointerEvent) => {
    activity();
    if (e.pointerType === "touch") return;
    armInput.pointer.x = e.clientX;
    armInput.pointer.y = e.clientY;
    armInput.pointer.active = true;
  };
  const over = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    armInput.hover = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
  };
  const out = (e: PointerEvent) => {
    if (e.relatedTarget) return;
    // Left the window.
    armInput.pointer.active = false;
    armInput.hover = null;
  };
  const down = (e: PointerEvent) => {
    activity();
    if (e.button !== 0 || (e.target as Element | null)?.closest?.("input,textarea,select,[contenteditable]")) return;
    armInput.clickAt = now();
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerover", over, { passive: true });
  document.addEventListener("pointerout", out, { passive: true });
  window.addEventListener("scroll", activity, { passive: true });
  window.addEventListener("wheel", activity, { passive: true });
  window.addEventListener("keydown", activity);
  return () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerdown", down);
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
    window.removeEventListener("scroll", activity);
    window.removeEventListener("wheel", activity);
    window.removeEventListener("keydown", activity);
    armInput.pointer.active = false;
    armInput.hover = null;
  };
}
