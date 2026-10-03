import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSerwistRoute } from "@serwist/turbopack";

const precacheAssets = [
  { url: "/offline.html", file: "offline.html" },
  { url: "/icons/northstar-192.png", file: "icons/northstar-192.png" },
  { url: "/icons/northstar-512.png", file: "icons/northstar-512.png" },
  { url: "/icons/northstar-maskable-512.png", file: "icons/northstar-maskable-512.png" },
].map(({ url, file }) => ({
  url,
  revision: createHash("sha256")
    .update(readFileSync(join(process.cwd(), "public", file)))
    .digest("hex"),
}));

export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: precacheAssets,
});