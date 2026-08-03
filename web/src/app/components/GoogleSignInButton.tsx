import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(script);
  });
}

export function isGoogleClientConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
}

/** Oficjalny przycisk Google Identity Services — wymaga VITE_GOOGLE_CLIENT_ID. */
export function GoogleSignInButton({
  onCredential,
  onError,
  disabled,
}: {
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  useEffect(() => {
    if (!clientId || !ref.current || disabled) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.accounts?.id) return;
        ref.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void Promise.resolve(onCredentialRef.current(response.credential)).catch((e) => {
              onErrorRef.current?.(e instanceof Error ? e.message : "Błąd logowania Google");
            });
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(ref.current.parentElement?.clientWidth || 320, 400),
        });
      })
      .catch(() => onErrorRef.current?.("Nie udało się załadować Google Sign-In"));

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled]);

  if (!clientId) return null;

  return (
    <div
      ref={ref}
      className={`w-full flex justify-center min-h-12 ${disabled ? "pointer-events-none opacity-50" : ""}`}
    />
  );
}
