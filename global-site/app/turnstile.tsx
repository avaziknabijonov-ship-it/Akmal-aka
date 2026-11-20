"use client";
import { useEffect, useRef } from "react";
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}
export default function Turnstile({
  onToken,
  reset,
}: {
  onToken: (token: string) => void;
  reset: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let widget: string | undefined;
    let timer: ReturnType<typeof setTimeout>;
    async function init() {
      const config = (await fetch("/api/config").then((r) => r.json())) as {
        turnstileSiteKey?: string;
      };
      if (cancelled || !config.turnstileSiteKey) return;
      if (!document.getElementById("turnstile-script")) {
        const script = document.createElement("script");
        script.id = "turnstile-script";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.appendChild(script);
      }
      const render = () => {
        if (cancelled) return;
        if (!window.turnstile) {
          timer = setTimeout(render, 150);
          return;
        }
        if (box.current)
          widget = window.turnstile.render(box.current, {
            sitekey: config.turnstileSiteKey,
            action: "lead",
            callback: onToken,
            "expired-callback": () => onToken(""),
            "error-callback": () => onToken(""),
          });
      };
      render();
    }
    void init().catch(() => onToken(""));
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (widget) window.turnstile?.remove(widget);
    };
  }, [onToken, reset]);
  return <div ref={box} />;
}
