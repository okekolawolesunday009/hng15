/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const precacheEntries = (self.__SW_MANIFEST ?? []).filter((entry) => {
  const path = typeof entry === "string" ? entry : entry.url;
  const url = new URL(path, self.location.origin);

  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/offline.html" ||
      url.pathname.startsWith("/icons/"))
  );
});

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => request.method === "GET" && request.mode === "navigate",
      },
    ],
  },
});

serwist.addEventListeners();