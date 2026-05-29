"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon } from "./Icon";

export type ToastVariant = "success" | "danger" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckIcon,
  danger: ErrorIcon,
  warning: AlertIcon,
  info: InfoIcon,
} as const;

const COLORS: Record<ToastVariant, { bg: string; fg: string }> = {
  success: { bg: "var(--success)", fg: "#FFFFFF" },
  danger: { bg: "var(--danger)", fg: "#FFFFFF" },
  warning: { bg: "var(--warning)", fg: "#FFFFFF" },
  info: { bg: "var(--primary)", fg: "#FFFFFF" },
};

export function ToastProvider({ children, duration = 3000 }: { children: ReactNode; duration?: number }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const effectiveDuration = variant === "danger" ? Math.max(duration, 6000) : duration;
      const timer = setTimeout(() => dismiss(id), effectiveDuration);
      timers.current.set(id, timer);
    },
    [dismiss, duration],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m) => toast(m, "success"),
      error: (m) => toast(m, "danger"),
      info: (m) => toast(m, "info"),
    }),
    [toast],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-h) + 20px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column-reverse",
          gap: 8,
          zIndex: 200,
          maxWidth: "calc(100vw - 2rem)",
        }}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          const colors = COLORS[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "danger" ? "alert" : "status"}
              aria-live={t.variant === "danger" ? "assertive" : "polite"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: colors.bg,
                color: colors.fg,
                padding: "0.75rem 1.25rem",
                borderRadius: 100,
                boxShadow: "var(--shadow-lg)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              <Icon size={18} aria-hidden />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
