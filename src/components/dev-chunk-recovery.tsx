"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "saas-radar:dev-chunk-reload";

function shouldRecoverFromMessage(message: string): boolean {
  return (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Cannot read properties of undefined (reading 'call')")
  );
}

/** Recharge une fois en dev quand le cache HMR de Next.js sert des chunks obsolètes. */
export function DevChunkRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function recover(reason: string) {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, reason);
      window.location.reload();
    }

    function onWindowError(event: ErrorEvent) {
      if (shouldRecoverFromMessage(event.message ?? "")) {
        recover(event.message ?? "runtime");
      }
    }

    function onResourceError(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)) return;

      const src =
        target instanceof HTMLScriptElement
          ? target.src
          : target instanceof HTMLLinkElement
            ? target.href
            : "";

      if (src.includes("/_next/static/chunks/")) {
        recover("stale-chunk");
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "";

      if (shouldRecoverFromMessage(message)) {
        recover(message);
      }
    }

    window.addEventListener("error", onWindowError);
    window.addEventListener("error", onResourceError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("error", onResourceError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      sessionStorage.removeItem(RELOAD_FLAG);
    };
  }, []);

  return null;
}
