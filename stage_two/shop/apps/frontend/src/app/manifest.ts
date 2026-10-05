import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Northstar | Objects for the everyday",
    short_name: "Northstar",
    description: "Considered pieces for a softer, more intentional everyday.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#171717",
    icons: [
      {
        src: "/icons/northstar-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/northstar-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/northstar-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}