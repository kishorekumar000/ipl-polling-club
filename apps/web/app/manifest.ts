import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IPL Polling Club",
    short_name: "IPL Club",
    description: "Daily IPL polling club with match alerts and admin control.",
    start_url: "/",
    display: "standalone",
    background_color: "#041425",
    theme_color: "#0b1d33",
    orientation: "portrait",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/app-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
