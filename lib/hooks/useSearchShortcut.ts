import { useEffect, useRef, type RefObject } from "react";

/** Returns a ref to attach to the wrapper div of a search input.
 *  Pressing "/" when no text field is focused will focus the input inside. */
export function useSearchShortcut(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as Element | null)?.tagName ?? "";
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        ref.current?.querySelector<HTMLInputElement>("input")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return ref;
}
