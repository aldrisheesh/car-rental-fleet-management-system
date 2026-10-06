/** Capture input before React handlers so newly opened portals use the right motion policy. */
export function installMotionPreferences(doc: Document, win: Window) {
  const root = doc.documentElement;
  const previousInput = root.getAttribute("data-input-modality");
  const previousMotion = root.getAttribute("data-reduced-motion");
  const media = win.matchMedia("(prefers-reduced-motion: reduce)");
  const capture = { capture: true };
  const keyboard = () => root.setAttribute("data-input-modality", "keyboard");
  const pointer = () => root.setAttribute("data-input-modality", "pointer");
  const click = (event: Event) => {
    // Assistive technologies can activate controls without a preceding keydown.
    if ((event as MouseEvent).detail === 0) keyboard();
  };
  const syncMotion = () =>
    root.setAttribute("data-reduced-motion", String(media.matches));
  syncMotion();
  doc.addEventListener("keydown", keyboard, capture);
  doc.addEventListener("pointerdown", pointer, capture);
  doc.addEventListener("click", click, capture);
  media.addEventListener("change", syncMotion);
  return () => {
    doc.removeEventListener("keydown", keyboard, capture);
    doc.removeEventListener("pointerdown", pointer, capture);
    doc.removeEventListener("click", click, capture);
    media.removeEventListener("change", syncMotion);
    for (const [name, value] of [
      ["data-input-modality", previousInput],
      ["data-reduced-motion", previousMotion],
    ] as const) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
  };
}
