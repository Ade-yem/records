"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, the X button and backdrop click are disabled (use during async operations). */
  closeDisabled?: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const SIZE_PX: Record<NonNullable<ModalProps["size"]>, number> = {
  sm: 380,
  md: 500,
  lg: 720,
};

export function Modal({ open, onClose, closeDisabled = false, title, description, children, size = "md", initialFocusRef }: ModalProps) {
  const headingId = useId();
  const descId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Keep a ref to onClose so the effect never needs it as a dependency.
  // This prevents the effect from re-running (and re-focusing the first input)
  // whenever the parent re-renders and passes a fresh onClose arrow function.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleClose = useCallback(() => onCloseRef.current(), []);

  // Escape to close + lock body scroll + initial focus.
  // Runs only when `open` flips or `initialFocusRef` changes — NOT on every
  // parent render — because handleClose is now permanently stable.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);

    const focusTarget = initialFocusRef?.current
      ?? contentRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button, [tabindex]:not([tabindex='-1'])",
      );
    focusTarget?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open, handleClose, initialFocusRef]);

  // Simple focus trap
  useEffect(() => {
    if (!open) return;
    const node = contentRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (!closeDisabled && e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descId : undefined}
        style={{ maxWidth: SIZE_PX[size] }}
      >
        <div className="modal-header">
          <div>
            <h2 id={headingId} style={{ marginBottom: description ? "0.25rem" : 0 }}>
              {title}
            </h2>
            {description ? (
              <p id={descId} style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.15rem" }}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={closeDisabled}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
