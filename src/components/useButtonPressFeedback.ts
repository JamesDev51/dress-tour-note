import { useEffect, useRef } from "react";

export function useButtonPressFeedback() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const events = new AbortController();
    let pressed:
      | { button: HTMLButtonElement; x: number; y: number; id: number }
      | undefined;
    const release = () => {
      pressed?.button.removeAttribute("data-touch-pressed");
      pressed = undefined;
    };
    const press = (event: PointerEvent) => {
      release();
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        event.pointerType === "mouse"
      )
        return;
      const button =
        event.target instanceof Element ? event.target.closest("button") : null;
      if (!button || !root.contains(button) || button.matches(":disabled"))
        return;
      // Touch browsers can defer :active until release; show contact immediately.
      button.setAttribute("data-touch-pressed", "");
      pressed = {
        button,
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };
    };
    const move = (event: PointerEvent) => {
      if (
        pressed &&
        event.pointerId === pressed.id &&
        Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 10
      )
        release();
    };
    const options = { passive: true, capture: true, signal: events.signal };
    root.addEventListener("pointerdown", press, options);
    window.addEventListener("pointermove", move, options);
    window.addEventListener("pointerup", release, options);
    window.addEventListener("pointercancel", release, options);
    window.addEventListener("scroll", release, options);
    window.addEventListener("blur", release, { ...options, capture: false });
    window.addEventListener("contextmenu", release, options);
    document.addEventListener("visibilitychange", release, options);
    return () => {
      events.abort();
      release();
    };
  }, []);
  return rootRef;
}
