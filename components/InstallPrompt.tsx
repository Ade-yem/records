"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent;
  }
}

type State = "idle" | "android" | "ios" | "done";

export function InstallPrompt() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    // Already running in standalone mode — nothing to show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as { standalone?: boolean }).standalone) return;

    // iOS Safari — no beforeinstallprompt, show manual instructions
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !ua.includes("crios") && !ua.includes("fxios");
    if (isIos) {
      const dismissed = sessionStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) setState("ios");
      return;
    }

    // Chrome/Android — check if prompt was captured by the inline script
    if (window.__pwaPrompt) {
      setState("android");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as BeforeInstallPromptEvent;
      setState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setState("done"));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    const prompt = window.__pwaPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    window.__pwaPrompt = undefined;
    setState(outcome === "accepted" ? "done" : "done");
  };

  const dismiss = () => {
    if (state === "ios") sessionStorage.setItem("pwa-ios-dismissed", "1");
    setState("done");
  };

  if (state === "idle" || state === "done") return null;

  if (state === "ios") {
    return (
      <div className="install-banner" role="banner">
        <div className="install-banner-icon">SS</div>
        <div className="install-banner-text">
          <strong>Install ShopSync</strong>
          <span>
            Tap <strong>Share</strong> <span aria-hidden>⎙</span> then{" "}
            <strong>Add to Home Screen</strong>
          </span>
        </div>
        <button type="button" className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner-icon">SS</div>
      <div className="install-banner-text">
        <strong>Install ShopSync</strong>
        <span>Add to home screen for faster access</span>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="install-banner-btn-primary" onClick={install}>
          Install
        </button>
        <button type="button" className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
